import { getDbPool, sql } from '@/lib/db';

export interface OrderItemInput {
  tradeId: string;
  tradeName: string;
  qty: number;
  unitName: string;
  typeId?: string;
  typeName?: string;
  salePrice: number;
  depositPrice?: number;
  remark?: string;
}

export interface CreateOrderParams {
  customerId: string;
  customerName: string;
  customerTel: string;
  customerAddress: string;
  customerZip: string;
  customerEmail?: string;
  paymentMethod: 'M' | 'T'; // M = เก็บเงินปลายทาง, T = โอนเงิน
  paymentSlipFilename?: string;
  qrRef?: string;
  remark?: string;
  items: OrderItemInput[];
}

export async function generateNextDocNo(
  conn: sql.Transaction | sql.ConnectionPool,
  branchId: string = '001'
): Promise<string> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const thaiYear = (currentYear + 543).toString().slice(-2); // e.g. 2026 -> 2569 -> '69'

  // อัปเดตและดึงเลขรันจากตาราง PBM_CTRL ภายใต้ Transaction แบบ Concurrency Safe
  const req = conn.request();
  req.input('branchId', sql.NVarChar, branchId);
  req.input('now', sql.DateTime, now);
  req.input('thaiYear', sql.NVarChar, thaiYear);

  const result = await req.query(`
    UPDATE PBM_CTRL WITH (ROWLOCK, UPDLOCK)
    SET PB_RUN_NO = PB_RUN_NO + 1,
        PB_RUN_YR = @thaiYear,
        PB_RUN_DATE = @now
    OUTPUT 
        DELETED.PB_RUN_CD,
        DELETED.PB_RUN_YR,
        DELETED.PB_RUN_NO AS CurrentRunNo,
        INSERTED.PB_RUN_NO AS NextRunNo
    WHERE PB_RUN_CD = 'ORD' 
      AND Branch_ID = @branchId
  `);

  if (!result.recordset || result.recordset.length === 0) {
    throw new Error(`ไม่พบข้อมูลการรันเลขเอกสาร ORD สำหรับสาขา ${branchId} ในตาราง PBM_CTRL`);
  }

  const row = result.recordset[0];
  const runCd = (row.PB_RUN_CD || 'ORD').trim();
  const runYr = (row.PB_RUN_YR || thaiYear).trim();
  const currentNo = Number(row.CurrentRunNo);

  const paddedSeq = currentNo.toString().padStart(6, '0');
  return `${runCd}${runYr}${paddedSeq}`;
}

export async function createPreOrder(params: CreateOrderParams) {
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || process.env.BRANCH_ID || '001';
    const docNo = await generateNextDocNo(transaction, branchId);
    const now = new Date();

    // คำนวณยอดเงินรวมและยอดมัดจำรวม
    let totalAmount = 0;
    let totalDeposit = 0;
    for (const item of params.items) {
      totalAmount += item.qty * item.salePrice;
      const unitDeposit = (item.depositPrice && item.depositPrice > 0)
        ? item.depositPrice
        : 0;
      totalDeposit += unitDeposit * item.qty;
    }

    const moneySts = params.paymentMethod;
    const moneyStsName = moneySts === 'M' ? 'เก็บเงินปลายทาง' : 'โอนผ่านบัญชี';

    // หมายเหตุคำสั่งซื้อ (Fn_Remark & Customer_Remark)
    const orderRemark = (params.remark || '').trim();
    const finalHeaderRemark = orderRemark.length > 150 ? orderRemark.substring(0, 147) + '...' : orderRemark;

    // กำหนดสถานะคำสั่งซื้อเริ่มต้น:
    // เก็บเงินปลายทาง ('M') หรือ แนบสลิปแล้ว -> '0' (กำลังดำเนินการ)
    // โอนเงินผ่านบัญชี ('T') และยังไม่แนบสลิป -> '1' (รอชำระ)
    const isCod = moneySts === 'M';
    const initialDocSts = (isCod || Boolean(params.paymentSlipFilename)) ? '0' : '1';
    const initialDocStsName = initialDocSts === '0' ? 'กำลังดำเนินการ' : 'รอชำระ';

    // 1. บันทึกลงตาราง Fnt_Header_online พร้อม fn_deposit_H
    const headerReq = new sql.Request(transaction);
    headerReq.input('Branch_Id', sql.NVarChar, branchId);
    headerReq.input('Fn_Doc_No', sql.NVarChar, docNo);
    headerReq.input('Fn_Doc_Date', sql.DateTime, now);
    headerReq.input('Doc_Sts', sql.NChar, initialDocSts);
    headerReq.input('Doc_Sts_Name', sql.NVarChar, initialDocStsName);
    headerReq.input('Customer_Id', sql.NVarChar, params.customerId.trim());
    headerReq.input('Fn_Total', sql.Money, totalAmount);
    headerReq.input('Fn_Amount', sql.Money, totalAmount);
    headerReq.input('Fn_Total_Cash', sql.Money, totalAmount);
    headerReq.input('money_sts', sql.NVarChar, moneySts);
    headerReq.input('money_sts_name', sql.NVarChar, moneyStsName);
    headerReq.input('QR_REF', sql.VarChar, params.qrRef || '');
    headerReq.input('FILE_NAME_PIC', sql.VarChar, params.paymentSlipFilename || '');
    headerReq.input('confirm_at', sql.DateTime, now);
    headerReq.input('orderbyH', sql.NVarChar, 'CUS');
    headerReq.input('Pb_User', sql.NVarChar, params.customerId.trim());
    headerReq.input('Pb_Now', sql.DateTime, now);
    headerReq.input('Fn_Remark', sql.NVarChar, finalHeaderRemark);
    headerReq.input('fn_deposit_H', sql.Money, totalDeposit);
    headerReq.input('fn_type_sale', sql.NVarChar, 'Pre Order');
    const dueDatePay = (moneySts === 'T' && Boolean(params.paymentSlipFilename)) ? now : null;
    headerReq.input('Due_Date_Pay', sql.DateTime, dueDatePay);

    await headerReq.query(`
      INSERT INTO Fnt_Header_online (
        Branch_Id, Fn_Doc_No, Fn_Doc_Date, Doc_Sts, Doc_Sts_Name,
        Customer_Id, Fn_Total, Fn_Amount, Fn_Total_Cash,
        money_sts, money_sts_name, QR_REF, FILE_NAME_PIC,
        confirm_at, orderbyH, Pb_User, Pb_Now, Fn_Remark,
        fn_deposit_H, fn_type_sale, Due_Date_Pay
      ) VALUES (
        @Branch_Id, @Fn_Doc_No, @Fn_Doc_Date, @Doc_Sts, @Doc_Sts_Name,
        @Customer_Id, @Fn_Total, @Fn_Amount, @Fn_Total_Cash,
        @money_sts, @money_sts_name, @QR_REF, @FILE_NAME_PIC,
        @confirm_at, @orderbyH, @Pb_User, @Pb_Now, @Fn_Remark,
        @fn_deposit_H, @fn_type_sale, @Due_Date_Pay
      )
    `);

    // 2. บันทึกลงตาราง Fnt_Detail_online พร้อม fn_deposit_D
    for (const item of params.items) {
      const lineDeposit = (item.depositPrice && item.depositPrice > 0)
        ? item.depositPrice * item.qty
        : 0;

      const finalTradeName = item.tradeName.trim();

      const detailReq = new sql.Request(transaction);
      detailReq.input('Branch_Id', sql.NVarChar, branchId);
      detailReq.input('Fn_Doc_No', sql.NVarChar, docNo);
      detailReq.input('Fn_Doc_Date', sql.DateTime, now);
      detailReq.input('Customer_Id', sql.NVarChar, params.customerId.trim());
      detailReq.input('Trade_Id', sql.NVarChar, item.tradeId.trim());
      detailReq.input('Trade_Name', sql.NVarChar, finalTradeName);
      detailReq.input('Qty', sql.Float, item.qty);
      detailReq.input('Unit_Name', sql.NVarChar, item.unitName.trim());
      detailReq.input('Type_ID', sql.NVarChar, (item.typeId || '').trim());
      detailReq.input('Type_Name', sql.NVarChar, (item.typeName || '').trim());
      detailReq.input('Cost_Price', sql.Money, 0);
      detailReq.input('Sale_Price', sql.Money, item.salePrice);
      detailReq.input('Pb_User', sql.NVarChar, params.customerId.trim());
      detailReq.input('Pb_Now', sql.DateTime, now);
      detailReq.input('orderby', sql.NVarChar, 'CUS');
      detailReq.input('Type_Free', sql.VarChar, '0');
      detailReq.input('fn_deposit_D', sql.Money, lineDeposit);
      detailReq.input('fn_type_sale', sql.NVarChar, 'Pre Order');

      await detailReq.query(`
        INSERT INTO Fnt_Detail_online (
          Branch_Id, Fn_Doc_No, Fn_Doc_Date, Customer_Id,
          Trade_Id, Trade_Name, Qty, Unit_Name,
          Type_ID, Type_Name, Cost_Price, Sale_Price,
          Pb_User, Pb_Now, orderby, Type_Free,
          fn_deposit_D, fn_type_sale
        ) VALUES (
          @Branch_Id, @Fn_Doc_No, @Fn_Doc_Date, @Customer_Id,
          @Trade_Id, @Trade_Name, @Qty, @Unit_Name,
          @Type_ID, @Type_Name, @Cost_Price, @Sale_Price,
          @Pb_User, @Pb_Now, @orderby, @Type_Free,
          @fn_deposit_D, @fn_type_sale
        )
      `);
    }

    // 3. บันทึกข้อมูลลูกค้าและที่อยู่จัดส่งลง Customer_online
    const cusReq = new sql.Request(transaction);
    cusReq.input('Customer_Id', sql.NVarChar, params.customerId.trim());
    cusReq.input('Customer_Name', sql.NVarChar, params.customerName.trim());
    cusReq.input('Customer_Tel', sql.NVarChar, params.customerTel.trim());
    cusReq.input('Customer_Address', sql.NVarChar, params.customerAddress.trim());
    cusReq.input('Customer_Zip', sql.NVarChar, params.customerZip.trim());
    cusReq.input('Customer_Email', sql.NVarChar, (params.customerEmail || '').trim());
    cusReq.input('Customer_Remark', sql.NVarChar, (params.remark || '').trim().substring(0, 200));
    cusReq.input('Sts', sql.NVarChar, moneyStsName);
    cusReq.input('Pb_User', sql.NVarChar, params.customerId.trim());
    cusReq.input('Pb_Now', sql.DateTime, now);
    cusReq.input('Fn_Doc_No', sql.NVarChar, docNo);
    cusReq.input('type_sale', sql.NVarChar, 'Pre Order');

    await cusReq.query(`
      INSERT INTO Customer_online (
        Customer_Id, Customer_Name, Customer_Tel,
        Customer_Address, Customer_Zip, Customer_Email,
        Customer_Remark, Sts, Pb_User, Pb_Now,
        Fn_Doc_No, type_sale
      ) VALUES (
        @Customer_Id, @Customer_Name, @Customer_Tel,
        @Customer_Address, @Customer_Zip, @Customer_Email,
        @Customer_Remark, @Sts, @Pb_User, @Pb_Now,
        @Fn_Doc_No, @type_sale
      )
    `);

    // 4. ล้างหรือตัดรายการสินค้าที่สั่งซื้อออกจาก ORDautorun ของลูกค้ารายนี้
    const orderedTradeIds = params.items.map((i) => (i.tradeId || '').trim()).filter(Boolean);
    if (orderedTradeIds.length > 0) {
      const clearAutorunReq = new sql.Request(transaction);
      clearAutorunReq.input('branchId', sql.NVarChar, branchId);
      clearAutorunReq.input('customerId', sql.NVarChar, params.customerId.trim());

      const idParams = orderedTradeIds.map((id, index) => {
        const pName = `tradeId_${index}`;
        clearAutorunReq.input(pName, sql.NVarChar, id);
        return `@${pName}`;
      }).join(', ');

      await clearAutorunReq.query(`
        DELETE FROM Fnt_Detail_online
        WHERE Branch_Id = @branchId
          AND RTRIM(LTRIM(Fn_Doc_No)) = 'ORDautorun'
          AND RTRIM(LTRIM(Customer_Id)) = @customerId
          AND RTRIM(LTRIM(Trade_Id)) IN (${idParams});
      `);
    }

    await transaction.commit();

    return {
      success: true,
      docNo,
      totalAmount,
      totalDeposit,
      itemCount: params.items.length,
      createdAt: now,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
