/**
 * สคริปต์คำนวณและอัปเดตยอดมัดจำ (fn_deposit_D / fn_deposit_H) ย้อนหลังสำหรับออเดอร์สถานะ '1' (รอชำระ)
 * เนื่องจากเดิม Trade_deposit ถูกอ่านเป็นบาทแทนที่จะเป็น %
 *
 * วิธีใช้งาน:
 *   node scripts/fix-legacy-deposit.js          (โหมด Dry-run แสดงรายการที่จะแก้ ไม่แตะต้อง DB)
 *   node scripts/fix-legacy-deposit.js --commit (โหมด Commit แก้ไขจริงใน DB)
 */

const { getDbPool, sql } = require('../lib/db.ts');

async function main() {
  const isCommit = process.argv.includes('--commit');
  console.log(`\n=== FIX LEGACY DEPOSIT SCRIPT (${isCommit ? 'COMMIT MODE' : 'DRY RUN MODE'}) ===\n`);

  const pool = await getDbPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const req = tx.request();
    // ค้นหาออเดอร์ Pre Order ที่ยังรอชำระ (Doc_Sts = '1')
    const ordersResult = await req.query(`
      SELECT 
        RTRIM(LTRIM(h.Branch_Id)) AS Branch_Id,
        RTRIM(LTRIM(h.Fn_Doc_No)) AS Fn_Doc_No,
        h.fn_deposit_H,
        h.Fn_Total,
        h.Doc_Sts
      FROM Fnt_Header_online h
      WHERE RTRIM(LTRIM(h.fn_type_sale)) = 'Pre Order'
        AND RTRIM(LTRIM(h.Doc_Sts)) = '1'
      ORDER BY h.Fn_Doc_No DESC
    `);

    const orders = ordersResult.recordset || [];
    console.log(`พบคำสั่งซื้อรอชำระทั้งหมด: ${orders.length} รายการ\n`);

    let updatedOrdersCount = 0;

    for (const order of orders) {
      const itemsReq = tx.request();
      itemsReq.input('branchId', order.Branch_Id);
      itemsReq.input('docNo', order.Fn_Doc_No);

      const itemsResult = await itemsReq.query(`
        SELECT 
          d.ID_NO,
          RTRIM(LTRIM(d.Trade_Id)) AS Trade_Id,
          d.Qty,
          d.Sale_Price,
          d.fn_deposit_D,
          t.Trade_deposit
        FROM Fnt_Detail_online d
        LEFT JOIN Trade t ON RTRIM(LTRIM(d.Trade_Id)) = RTRIM(LTRIM(t.Trade_Id))
        WHERE d.Branch_Id = @branchId
          AND RTRIM(LTRIM(d.Fn_Doc_No)) = @docNo
      `);

      let newTotalDeposit = 0;
      let hasChange = false;

      const itemUpdates = [];

      for (const item of itemsResult.recordset || []) {
        const qty = Number(item.Qty) || 0;
        const salePrice = Number(item.Sale_Price) || 0;
        const depositPct = item.Trade_deposit != null ? Number(item.Trade_deposit) : 0;
        
        let unitDeposit = 0;
        if (depositPct > 0 && salePrice > 0) {
          const clampedPct = Math.min(Math.max(depositPct, 0), 100);
          unitDeposit = Math.round(((salePrice * clampedPct) / 100) * 100) / 100;
        }

        const newLineDeposit = Math.round((unitDeposit * qty) * 100) / 100;
        newTotalDeposit += newLineDeposit;

        const oldLineDeposit = Number(item.fn_deposit_D) || 0;
        if (Math.abs(newLineDeposit - oldLineDeposit) > 0.01) {
          hasChange = true;
          itemUpdates.push({
            idNo: item.ID_NO,
            tradeId: item.Trade_Id,
            qty,
            salePrice,
            depositPct,
            oldLineDeposit,
            newLineDeposit,
          });
        }
      }

      newTotalDeposit = Math.round(newTotalDeposit * 100) / 100;
      const oldTotalDeposit = Number(order.fn_deposit_H) || 0;
      if (Math.abs(newTotalDeposit - oldTotalDeposit) > 0.01) {
        hasChange = true;
      }

      if (hasChange) {
        updatedOrdersCount++;
        console.log(`[Order ${order.Fn_Doc_No}] มัดจำเดิม: ฿${oldTotalDeposit.toLocaleString()} -> มัดจำใหม่: ฿${newTotalDeposit.toLocaleString()}`);
        for (const u of itemUpdates) {
          console.log(`  - สินค้า ${u.tradeId} (จำนวน ${u.qty}, ราคา ฿${u.salePrice}, มัดจำ ${u.depositPct}%): บรรทัดเดิม ฿${u.oldLineDeposit} -> ใหม่ ฿${u.newLineDeposit}`);
          
          if (isCommit) {
            const uReq = tx.request();
            uReq.input('idNo', u.idNo);
            uReq.input('dep', newLineDeposit);
            await uReq.query(`
              UPDATE Fnt_Detail_online
              SET fn_deposit_D = @dep
              WHERE ID_NO = @idNo
            `);
          }
        }

        if (isCommit) {
          const hReq = tx.request();
          hReq.input('branchId', order.Branch_Id);
          hReq.input('docNo', order.Fn_Doc_No);
          hReq.input('totalDep', newTotalDeposit);
          await hReq.query(`
            UPDATE Fnt_Header_online
            SET fn_deposit_H = @totalDep
            WHERE Branch_Id = @branchId
              AND RTRIM(LTRIM(Fn_Doc_No)) = @docNo
          `);
        }
      }
    }

    if (isCommit) {
      await tx.commit();
      console.log(`\n[สำเร็จ] บันทึกการแก้ไขออเดอร์จำนวน ${updatedOrdersCount} รายการเรียบร้อยแล้ว`);
    } else {
      await tx.rollback();
      console.log(`\n[DRY RUN เสร็จสิ้น] พบออเดอร์ที่ต้องปรับยอด: ${updatedOrdersCount} รายการ (ไม่ได้บันทึกลง DB)`);
      console.log(`หากต้องการบันทึกจริง ให้รัน: node scripts/fix-legacy-deposit.js --commit\n`);
    }

    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('Error in fix-legacy-deposit:', err);
    process.exit(1);
  }
}

main();
