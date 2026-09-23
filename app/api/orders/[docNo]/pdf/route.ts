import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/auth';
import { generatePurchaseOrderPdf } from '@/lib/po-pdf-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docNo: string }> }
) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบก่อนดาวน์โหลดใบสั่งซื้อ' },
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
        { success: false, message: 'ไม่พบข้อมูลคำสั่งซื้อ' },
        { status: 404 }
      );
    }

    const header = headerResult.recordset[0];

    const orderCustomerId = (header.Customer_Id || '').trim();
    if (orderCustomerId && orderCustomerId !== customer.customerId) {
      return NextResponse.json(
        { success: false, message: 'คุณไม่มีสิทธิ์ดาวน์โหลดเอกสารนี้' },
        { status: 403 }
      );
    }

    // ใบสั่งซื้อ (PO) ออกให้เฉพาะคำสั่งซื้อที่มีสถานะเป็น '3' (ออกใบเสร็จแล้ว)
    if (header.Doc_Sts !== '3') {
      return NextResponse.json(
        { success: false, message: 'เอกสารใบสั่งซื้อจะดาวน์โหลดได้ เมื่อสถานะเป็น "ออกใบเสร็จแล้ว" เท่านั้น' },
        { status: 403 }
      );
    }

    // ดึงข้อมูลรายการสินค้า
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
          d.Type_Name,
          COALESCE(NULLIF(d.Sale_Price, 0), NULLIF(t.Sale_Price1, 0), 0) AS Sale_Price,
          ISNULL(t.Sale_Price1, 0) AS Sale_Price1,
          (d.Qty * COALESCE(NULLIF(d.Sale_Price, 0), NULLIF(t.Sale_Price1, 0), 0)) AS Line_Total,
          ISNULL(d.fn_deposit_D, 0) AS fn_deposit_D
        FROM Fnt_Detail_online d
        LEFT JOIN Trade t ON RTRIM(LTRIM(d.Trade_Id)) = RTRIM(LTRIM(t.Trade_Id))
        WHERE d.Fn_Doc_No = @docNo
        ORDER BY d.ID_NO ASC
      `);

    // ดึงข้อมูลจัดส่งจาก Customer_online
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

    const orderData = {
      ...header,
      Customer_Name: shippingInfo.Customer_Name || header.Customer_Name,
      Customer_Tel: shippingInfo.Customer_Tel || header.Customer_Tel,
      Customer_Address: shippingInfo.Customer_Address || header.Customer_Address,
      Customer_Zip: shippingInfo.Customer_Zip || header.Customer_Zip,
      Fn_Total: finalTotal,
      shipping: shippingInfo,
      items,
    };

    const pdfBuffer = await generatePurchaseOrderPdf(orderData);

    const filename = `PurchaseOrderNo${header.Fn_Doc_No}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Generate PO PDF error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF: ' + (error?.message || error) },
      { status: 500 }
    );
  }
}
