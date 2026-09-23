import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docNo: string }> }
) {
  try {
    const internalSecret = process.env.INTERNAL_PRINT_SECRET || 'ubr_internal_print_secret_2026';
    const isInternal = req.nextUrl.searchParams.get('internal_token') === internalSecret;
    const customer = await getCurrentCustomer();
    if (!customer && !isInternal) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบก่อนดูข้อมูลคำสั่งซื้อ' },
        { status: 401 }
      );
    }

    const { docNo } = await params;
    const pool = await getDbPool();

    // ดึงข้อมูล Header
    const headerResult = await pool
      .request()
      .input('docNo', docNo)
      .query(`
        SELECT TOP 1
          h.Branch_Id,
          h.Fn_Doc_No,
          h.Fn_Doc_Date,
          CASE 
            WHEN RTRIM(LTRIM(h.money_sts)) = 'M' AND RTRIM(LTRIM(h.Doc_Sts)) IN ('', '1') THEN '0'
            ELSE RTRIM(LTRIM(h.Doc_Sts))
          END AS Doc_Sts,
          CASE 
            WHEN RTRIM(LTRIM(h.Doc_Sts)) = '3' THEN 'ออกใบเสร็จแล้ว'
            WHEN RTRIM(LTRIM(h.Doc_Sts)) = '4' THEN 'ยกเลิก Order'
            WHEN RTRIM(LTRIM(h.money_sts)) = 'M' THEN 'กำลังดำเนินการ'
            WHEN RTRIM(LTRIM(h.Doc_Sts)) = '1' THEN 'รอชำระ'
            WHEN RTRIM(LTRIM(h.Doc_Sts)) = '0' THEN 'กำลังดำเนินการ'
            ELSE COALESCE(NULLIF(RTRIM(LTRIM(h.Doc_Sts_Name)), ''), 'กำลังดำเนินการ')
          END AS Doc_Sts_Name,
          h.Customer_Id,
          h.Fn_Total,
          ISNULL(h.fn_deposit_H, 0) AS fn_deposit_H,
          h.Fn_Amount,
          h.money_sts,
          h.money_sts_name,
          h.Fn_Doc_No_local,
          h.FILE_NAME_PIC,
          h.confirm_at,
          h.fn_type_sale,
          h.Fn_Remark,
          h.Due_Date_Pay,
          c.Customer_Name,
          c.Customer_Tel,
          c.Customer_Address,
          c.Customer_Zip
        FROM Fnt_Header_online h
        LEFT JOIN Customer c ON h.Customer_Id = c.Customer_Id
        WHERE h.Fn_Doc_No = @docNo
      `);

    if (headerResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบเอกสารคำสั่งซื้อนี้' },
        { status: 404 }
      );
    }

    const header = headerResult.recordset[0];
    const orderCustomerId = (header.Customer_Id || '').trim();

    // ตรวจสอบความเป็นเจ้าของคำสั่งซื้อ (ข้ามถ้าเป็นคำขอจาก internal print server)
    if (!isInternal && orderCustomerId && customer && orderCustomerId !== customer.customerId) {
      return NextResponse.json(
        { success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' },
        { status: 403 }
      );
    }

    // ดึงข้อมูลรายการสินค้าจาก Fnt_Detail_online ร่วมกับตาราง Trade เพื่อดึง Sale_Price1
    const detailResult = await pool
      .request()
      .input('docNo', docNo)
      .query(`
        SELECT 
          d.ID_NO,
          RTRIM(LTRIM(d.Trade_Id)) AS Trade_Id,
          RTRIM(LTRIM(d.Trade_Name)) AS Trade_Name,
          d.Qty,
          RTRIM(LTRIM(d.Unit_Name)) AS Unit_Name,
          RTRIM(LTRIM(d.Type_Name)) AS Type_Name,
          COALESCE(NULLIF(d.Sale_Price, 0), NULLIF(t.Sale_Price1, 0), 0) AS Sale_Price,
          ISNULL(t.Sale_Price1, 0) AS Sale_Price1,
          (d.Qty * COALESCE(NULLIF(d.Sale_Price, 0), NULLIF(t.Sale_Price1, 0), 0)) AS Line_Total,
          ISNULL(d.fn_deposit_D, 0) AS fn_deposit_D,
          d.fn_type_sale,
          d.Type_Free,
          d.Promotion_No,
          RTRIM(LTRIM(ISNULL(t.Trade_Part_Image, ''))) AS Trade_Part_Image,
          RTRIM(LTRIM(ISNULL(t.Trade_NameEN, ''))) AS Trade_NameEN
        FROM Fnt_Detail_online d
        LEFT JOIN Trade t ON RTRIM(LTRIM(d.Trade_Id)) = RTRIM(LTRIM(t.Trade_Id))
        WHERE d.Fn_Doc_No = @docNo
        ORDER BY d.ID_NO ASC
      `);

    // ดึงข้อมูล Snapshot ที่อยู่และข้อมูลลูกค้าจาก Customer_online
    const cusOnlineResult = await pool
      .request()
      .input('docNo', docNo)
      .query(`
        SELECT TOP 1
          Customer_Id,
          Customer_Name,
          Customer_Tel,
          Customer_Address,
          Customer_Zip,
          Customer_Email,
          Customer_Remark,
          Pb_Now,
          Sts,
          type_sale
        FROM Customer_online
        WHERE Fn_Doc_No = @docNo
      `);

    const shippingInfo = cusOnlineResult.recordset[0] || {
      Customer_Id: header.Customer_Id,
      Customer_Name: header.Customer_Name,
      Customer_Tel: header.Customer_Tel,
      Customer_Address: header.Customer_Address,
      Customer_Zip: header.Customer_Zip,
      Customer_Email: '',
      Customer_Remark: header.Fn_Remark || '',
      Pb_Now: header.Fn_Doc_Date,
      Sts: header.money_sts_name,
      type_sale: header.fn_type_sale,
    };

    const items = detailResult.recordset;
    const itemsSubtotal = items.reduce((acc: number, it: any) => acc + Number(it.Line_Total || 0), 0);
    const finalTotal = Number(header.Fn_Total) > 0 ? Number(header.Fn_Total) : itemsSubtotal;

    return NextResponse.json({
      success: true,
      order: {
        ...header,
        Customer_Name: shippingInfo.Customer_Name || header.Customer_Name,
        Customer_Tel: shippingInfo.Customer_Tel || header.Customer_Tel,
        Customer_Address: shippingInfo.Customer_Address || header.Customer_Address,
        Customer_Zip: shippingInfo.Customer_Zip || header.Customer_Zip,
        Fn_Total: finalTotal,
        shipping: shippingInfo,
        items,
      },
    });
  } catch (error: any) {
    console.error('Fetch order detail error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[docNo]: สำหรับอัปเดตสถานะคำสั่งซื้อ (Order Status Update)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docNo: string }> }
) {
  try {
    const { docNo } = await params;
    const body = await req.json();
    const { docSts, docStsName, trackingNo, remark, paymentSlipFilename } = body;

    const pool = await getDbPool();
    const request = pool.request();
    request.input('docNo', docNo);

    const setClauses = [];

    if (docSts !== undefined) {
      const stsStr = String(docSts).trim();
      setClauses.push('Doc_Sts = @docSts');
      request.input('docSts', stsStr);

      // บันทึกชื่อสถานะลงในคอลัมน์ Doc_Sts_Name อัตโนมัติตาม Doc_Sts
      let computedName = docStsName;
      if (!computedName) {
        if (stsStr === '1') computedName = 'รอชำระ';
        else if (stsStr === '0') computedName = 'กำลังดำเนินการ';
        else if (stsStr === '3') computedName = 'ออกใบเสร็จแล้ว';
        else if (stsStr === '4') computedName = 'ยกเลิก Order';
      }
      if (computedName) {
        setClauses.push('Doc_Sts_Name = @docStsName');
        request.input('docStsName', String(computedName));
      }
    } else if (docStsName !== undefined) {
      setClauses.push('Doc_Sts_Name = @docStsName');
      request.input('docStsName', String(docStsName));
    }
    if (trackingNo !== undefined) {
      setClauses.push('Fn_Doc_No_local = @trackingNo');
      request.input('trackingNo', String(trackingNo));
    }
    if (remark !== undefined) {
      setClauses.push('Fn_Remark = @remark');
      request.input('remark', String(remark));
    }
    if (paymentSlipFilename !== undefined) {
      setClauses.push('FILE_NAME_PIC = @paymentSlipFilename');
      request.input('paymentSlipFilename', String(paymentSlipFilename));
      // เมื่อแนบสลิปเรียบร้อยแล้ว ถ้าไม่ได้ระบุ docSts มา ให้เปลี่ยนสถานะจาก 1 (รอชำระ) เป็น 0 (กำลังดำเนินการ) โดยอัตโนมัติ
      if (docSts === undefined) {
        setClauses.push("Doc_Sts = '0'");
        setClauses.push("Doc_Sts_Name = N'กำลังดำเนินการ'");
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: false, message: 'ไม่มีข้อมูลที่ต้องอัปเดต' }, { status: 400 });
    }

    await request.query(`
      UPDATE Fnt_Header_online 
      SET ${setClauses.join(', ')}
      WHERE Fn_Doc_No = @docNo
    `);

    return NextResponse.json({
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + error.message },
      { status: 500 }
    );
  }
}
