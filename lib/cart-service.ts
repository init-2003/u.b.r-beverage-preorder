import { getDbPool, sql } from '@/lib/db';

export interface CartItemSyncInput {
  tradeId: string;
  tradeName: string;
  tradeNameEN?: string;
  unitName: string;
  typeName?: string;
  salePrice: number;
  depositPrice?: number;
  qty: number;
  image?: string;
}

export interface CartDbItem {
  tradeId: string;
  tradeName: string;
  tradeNameEN?: string;
  unitName: string;
  typeName?: string;
  salePrice: number;
  depositPrice?: number;
  qty: number;
  image?: string;
}

/**
 * บันทึก/อัปเดตข้อมูลตะกร้าสินค้าลงฐานข้อมูล Fnt_Detail_online
 * โดยใช้ Fn_Doc_No = 'ORDautorun' และอ้างอิงตาม Customer_Id
 * (ตาราง Fnt_Header_online จะถูกบันทึกเมื่อสั่งซื้อสำเร็จเท่านั้น)
 */
export async function syncCartToDb(customerId: string, items: CartItemSyncInput[]) {
  if (!customerId || !customerId.trim()) {
    throw new Error('Customer_Id is required to sync cart to database');
  }

  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || process.env.BRANCH_ID || '001';
    const cleanCusId = customerId.trim();
    const now = new Date();

    // หากไม่มีสินค้าในตะกร้า ให้ลบแถว ORDautorun ใน Detail ออก
    if (!items || items.length === 0) {
      const delReq = new sql.Request(transaction);
      delReq.input('branchId', branchId);
      delReq.input('customerId', cleanCusId);

      await delReq.query(`
        DELETE FROM Fnt_Detail_online
        WHERE Branch_Id = @branchId 
          AND RTRIM(LTRIM(Fn_Doc_No)) = 'ORDautorun'
          AND RTRIM(LTRIM(Customer_Id)) = @customerId;
      `);

      await transaction.commit();
      return { success: true, count: 0 };
    }

    // คำนวณยอดเงินรวมและยอดมัดจำรวม
    let totalAmount = 0;
    let totalDeposit = 0;
    for (const item of items) {
      const p = Number(item.salePrice) || 0;
      const q = Number(item.qty) || 0;
      const dep = Number(item.depositPrice) || 0;
      totalAmount += p * q;
      totalDeposit += dep * q;
    }

    // 2. ลบรายการเก่าใน Fnt_Detail_online แล้วบันทึกรายการสินค้าปัจจุบันลงไป
    const clearDetailReq = new sql.Request(transaction);
    clearDetailReq.input('branchId', branchId);
    clearDetailReq.input('customerId', cleanCusId);
    await clearDetailReq.query(`
      DELETE FROM Fnt_Detail_online
      WHERE Branch_Id = @branchId 
        AND RTRIM(LTRIM(Fn_Doc_No)) = 'ORDautorun'
        AND RTRIM(LTRIM(Customer_Id)) = @customerId
    `);

    for (const item of items) {
      const p = Number(item.salePrice) || 0;
      const q = Number(item.qty) || 0;
      const unitDep = Number(item.depositPrice) || 0;
      const lineDep = unitDep * q;

      const detailReq = new sql.Request(transaction);
      detailReq.input('Branch_Id', branchId);
      detailReq.input('Fn_Doc_No', 'ORDautorun');
      detailReq.input('Fn_Doc_Date', now);
      detailReq.input('Customer_Id', cleanCusId);
      detailReq.input('Trade_Id', item.tradeId.trim());
      detailReq.input('Trade_Name', (item.tradeName || '').trim());
      detailReq.input('Qty', q);
      detailReq.input('Unit_Name', (item.unitName || '').trim());
      detailReq.input('Type_Name', (item.typeName || '').trim());
      detailReq.input('Cost_Price', 0);
      detailReq.input('Sale_Price', p);
      detailReq.input('Pb_User', cleanCusId);
      detailReq.input('Pb_Now', now);
      detailReq.input('orderby', 'CUS');
      detailReq.input('Type_Free', '0');
      detailReq.input('fn_deposit_D', lineDep);
      detailReq.input('fn_type_sale', 'Pre Order');

      await detailReq.query(`
        INSERT INTO Fnt_Detail_online (
          Branch_Id, Fn_Doc_No, Fn_Doc_Date, Customer_Id,
          Trade_Id, Trade_Name, Qty, Unit_Name,
          Type_Name, Cost_Price, Sale_Price,
          Pb_User, Pb_Now, orderby, Type_Free,
          fn_deposit_D, fn_type_sale
        ) VALUES (
          @Branch_Id, @Fn_Doc_No, @Fn_Doc_Date, @Customer_Id,
          @Trade_Id, @Trade_Name, @Qty, @Unit_Name,
          @Type_Name, @Cost_Price, @Sale_Price,
          @Pb_User, @Pb_Now, @orderby, @Type_Free,
          @fn_deposit_D, @fn_type_sale
        )
      `);
    }

    await transaction.commit();
    return { success: true, count: items.length, totalAmount, totalDeposit };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * ดึงรายการสินค้าในตะกร้าของลูกค้าจากตาราง Fnt_Detail_online (Fn_Doc_No = 'ORDautorun')
 */
export async function getCartFromDb(customerId: string): Promise<CartDbItem[]> {
  if (!customerId || !customerId.trim()) return [];

  const pool = await getDbPool();
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || process.env.BRANCH_ID || '001';
  const cleanCusId = customerId.trim();

  const req = pool.request();
  req.input('branchId', branchId);
  req.input('customerId', cleanCusId);

  const result = await req.query(`
    SELECT 
      d.Trade_Id,
      d.Trade_Name,
      d.Qty,
      d.Unit_Name,
      d.Type_Name,
      d.Sale_Price,
      d.fn_deposit_D,
      d.fn_type_sale,
      t.Trade_NameEN,
      t.Trade_deposit,
      t.Trade_Part_Image
    FROM Fnt_Detail_online d
    LEFT JOIN Trade t ON RTRIM(LTRIM(d.Trade_Id)) = RTRIM(LTRIM(t.Trade_Id))
    WHERE d.Branch_Id = @branchId
      AND RTRIM(LTRIM(d.Fn_Doc_No)) = 'ORDautorun'
      AND RTRIM(LTRIM(d.Customer_Id)) = @customerId
    ORDER BY d.ID_NO ASC
  `);

  return (result.recordset || []).map((row) => {
    const qty = Number(row.Qty) || 1;
    const unitDep = row.Trade_deposit != null && Number(row.Trade_deposit) > 0
      ? Number(row.Trade_deposit)
      : (Number(row.fn_deposit_D) || 0) / (qty || 1);

    const image = row.Trade_Part_Image
      ? (row.Trade_Part_Image.startsWith('/') ? row.Trade_Part_Image : `/${row.Trade_Part_Image}`)
      : '/images/ubr_beverage_logo.png';

    return {
      tradeId: (row.Trade_Id || '').trim(),
      tradeName: (row.Trade_Name || '').trim(),
      tradeNameEN: row.Trade_NameEN ? row.Trade_NameEN.trim() : undefined,
      unitName: (row.Unit_Name || 'หน่วย').trim(),
      typeName: row.Type_Name ? row.Type_Name.trim() : undefined,
      salePrice: Number(row.Sale_Price) || 0,
      depositPrice: unitDep,
      qty,
      image,
    };
  });
}

/**
 * ล้างตะกร้าสินค้าในฐานข้อมูลสำหรับลูกค้ารายนี้
 */
export async function clearCartInDb(customerId: string) {
  if (!customerId || !customerId.trim()) return;

  const pool = await getDbPool();
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || process.env.BRANCH_ID || '001';
  const cleanCusId = customerId.trim();

  const req = pool.request();
  req.input('branchId', branchId);
  req.input('customerId', cleanCusId);

  await req.query(`
    DELETE FROM Fnt_Detail_online
    WHERE Branch_Id = @branchId
      AND RTRIM(LTRIM(Fn_Doc_No)) = 'ORDautorun'
      AND RTRIM(LTRIM(Customer_Id)) = @customerId;
  `);
}
