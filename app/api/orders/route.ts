import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { getDbPool, sql } from '@/lib/db';
import { createPreOrder } from '@/lib/order-service';

// GET /api/orders: รายการประวัติคำสั่งซื้อ
export async function GET(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '50', 10)));
    const tel = searchParams.get('tel') || '';
    const customerIdParam = searchParams.get('customerId') || '';

    const pool = await getDbPool();
    const request = pool.request().input('limit', limit);

    let whereClause = "WHERE h.Fn_Doc_No NOT LIKE '%autorun%'";

    if (customer) {
      whereClause += " AND h.Customer_Id = @customerId";
      request.input('customerId', customer.customerId);
    } else if (customerIdParam) {
      whereClause += " AND h.Customer_Id = @customerId";
      request.input('customerId', customerIdParam);
    } else if (tel) {
      whereClause += " AND EXISTS (SELECT 1 FROM Customer_online co WHERE co.Fn_Doc_No = h.Fn_Doc_No AND co.Customer_Tel LIKE @tel)";
      request.input('tel', `%${tel}%`);
    } else {
      // สำหรับหน้าเว็บทั่วไป หรือเมื่อยังไม่ได้ล็อกอิน ให้ดึงคำสั่งจอง Pre-Order ล่าสุด
      whereClause += " AND h.Fn_Doc_No LIKE 'ORD%'";
    }

    const result = await request.query(`
      SELECT TOP (@limit)
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
        h.money_sts,
        h.money_sts_name,
        h.Fn_Doc_No_local,
        h.FILE_NAME_PIC,
        h.confirm_at,
        h.fn_type_sale,
        h.Due_Date_Pay,
        COALESCE(
          NULLIF(RTRIM(LTRIM((SELECT TOP 1 co.Customer_Name FROM Customer_online co WHERE co.Fn_Doc_No = h.Fn_Doc_No))), ''),
          NULLIF(RTRIM(LTRIM((SELECT TOP 1 c.Customer_Contact FROM Customer c WHERE c.Customer_Id = h.Customer_Id))), ''),
          NULLIF(RTRIM(LTRIM((SELECT TOP 1 c.Customer_Name FROM Customer c WHERE c.Customer_Id = h.Customer_Id))), ''),
          h.Customer_Id
        ) AS ShipToName,
        (SELECT TOP 1 co.Customer_Name FROM Customer_online co WHERE co.Fn_Doc_No = h.Fn_Doc_No) AS Customer_Name,
        (SELECT TOP 1 co.Customer_Tel FROM Customer_online co WHERE co.Fn_Doc_No = h.Fn_Doc_No) AS Customer_Tel,
        (SELECT TOP 1 co.Customer_Address FROM Customer_online co WHERE co.Fn_Doc_No = h.Fn_Doc_No) AS Customer_Address,
        (SELECT COUNT(*) FROM Fnt_Detail_online d WHERE d.Fn_Doc_No = h.Fn_Doc_No) AS ItemCount,
        (SELECT TOP 1 d.Trade_Name FROM Fnt_Detail_online d WHERE d.Fn_Doc_No = h.Fn_Doc_No) AS Sample_Trade_Name,
        (SELECT TOP 1 d.Type_Name FROM Fnt_Detail_online d WHERE d.Fn_Doc_No = h.Fn_Doc_No) AS Sample_Type_Name
      FROM Fnt_Header_online h
      ${whereClause}
      ORDER BY h.Fn_Doc_Date DESC, h.Fn_Doc_No DESC
    `);

    const orders = result.recordset || [];
    if (orders.length > 0) {
      const docNos = orders.map((o: any) => o.Fn_Doc_No).filter(Boolean);
      if (docNos.length > 0) {
        const detailRequest = pool.request();
        const paramsList: string[] = [];
        docNos.forEach((docNo: string, index: number) => {
          const pName = `doc_${index}`;
          detailRequest.input(pName, docNo);
          paramsList.push(`@${pName}`);
        });

        const detailResult = await detailRequest.query(`
          SELECT 
            d.Fn_Doc_No,
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
            RTRIM(LTRIM(ISNULL(t.Trade_Part_Image, ''))) AS Trade_Part_Image
          FROM Fnt_Detail_online d
          LEFT JOIN Trade t ON RTRIM(LTRIM(d.Trade_Id)) = RTRIM(LTRIM(t.Trade_Id))
          WHERE d.Fn_Doc_No IN (${paramsList.join(',')})
          ORDER BY d.ID_NO ASC
        `);

        const itemsByDocNo: Record<string, any[]> = {};
        for (const row of detailResult.recordset) {
          const docNo = row.Fn_Doc_No;
          if (!itemsByDocNo[docNo]) itemsByDocNo[docNo] = [];
          itemsByDocNo[docNo].push(row);
        }

        for (const order of orders) {
          order.items = itemsByDocNo[order.Fn_Doc_No] || [];
        }
      }
    }

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงรายการคำสั่งซื้อ: ' + error.message },
      { status: 500 }
    );
  }
}

// POST /api/orders: สร้างคำสั่งซื้อ Pre-order ใหม่ บันทึกลง Fnt_Header_online และ Fnt_Detail_online
export async function POST(req: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำการสั่งจองสินค้า' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, paymentMethod, customerName, customerTel, customerAddress, customerZip, customerEmail, remark, paymentSlipFilename } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีรายการสินค้าในคำสั่งซื้อ' },
        { status: 400 }
      );
    }

    const customerId = customer.customerId;
    const finalCustomerName = (customerName || customer.customerName || '').trim();
    const finalCustomerTel = (customerTel || customer.customerTel || '').trim();
    const finalCustomerAddress = (customerAddress || customer.customerAddress || '').trim();
    const finalCustomerZip = (customerZip || customer.customerZip || '').trim();
    const finalCustomerEmail = (customerEmail || (customer.cusUser && customer.cusUser.includes('@') ? customer.cusUser : '')).trim();

    if (!finalCustomerAddress || !finalCustomerTel) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุที่อยู่จัดส่งและเบอร์โทรศัพท์ติดต่อ' },
        { status: 400 }
      );
    }

    const orderResult = await createPreOrder({
      customerId,
      customerName: finalCustomerName || customer.customerName || customerId,
      customerTel: finalCustomerTel,
      customerAddress: finalCustomerAddress,
      customerZip: finalCustomerZip,
      customerEmail: finalCustomerEmail,
      paymentMethod: paymentMethod === 'T' ? 'T' : 'M',
      paymentSlipFilename: paymentSlipFilename || '',
      remark: remark || '',
      items: items.map((item: any) => ({
        tradeId: item.tradeId,
        tradeName: item.tradeName,
        qty: Number(item.qty) || 1,
        unitName: (item.unitName || '').trim(),
        typeId: item.typeId || '',
        typeName: item.typeName || '',
        salePrice: Number(item.salePrice) || 0,
        depositPrice: item.depositPrice ? Number(item.depositPrice) : undefined,
        remark: item.remark ? String(item.remark).trim() : undefined,
      })),
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกคำสั่ง Pre-Order เรียบร้อยแล้ว',
      data: orderResult,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ: ' + error.message },
      { status: 500 }
    );
  }
}