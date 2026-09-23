import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, sql } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(60, parseInt(searchParams.get('limit') || '24', 10)));
    const offset = (page - 1) * limit;

    // ตรวจสอบระดับราคาของลูกค้า ถ้า Login ให้ใช้ระดับของลูกค้า ถ้าไม่ Login ให้ใช้ระดับ 1
    const customer = await getCurrentCustomer();
    const customerLevel = customer ? customer.customerLevel : 1;
    const priceCol = `Sale_Price${customerLevel}`;

    const pool = await getDbPool();
    const request = pool.request();

    // แสดงเฉพาะสินค้าที่เป็น Pre Order (Type_Name = 'Pre Order') ไม่ต้องใช้ Trade_Type_Sts_Web อีกต่อไป
    let whereClause = "WHERE RTRIM(LTRIM(t.Type_Name)) = 'Pre Order'";

    if (category && category !== 'ทั้งหมด' && category !== 'all' && category !== 'Pre Order') {
      if (category.toLowerCase().includes('macallan')) {
        whereClause += " AND (t.Trade_Name LIKE '%Macallan%' OR t.Trade_Name LIKE '%Maccallan%' OR t.Trade_Id_Main LIKE '%Macallan%')";
      } else if (category.toLowerCase().includes('glenrothes')) {
        whereClause += " AND (t.Trade_Name LIKE '%Glenrothes%' OR t.Trade_Id_Main LIKE '%Glenrothes%')";
      } else if (category.toLowerCase().includes('highland')) {
        whereClause += " AND (t.Trade_Name LIKE '%Highland%' OR t.Trade_Id_Main LIKE '%Highland%')";
      } else {
        whereClause += " AND (t.Trade_Name LIKE @category OR t.Trade_Province LIKE @category OR t.Trade_Id_Main LIKE @category)";
        request.input('category', `%${category}%`);
      }
    }

    if (search) {
      whereClause += " AND (t.Trade_Name LIKE @search OR t.Trade_Id LIKE @search OR t.Trade_NameEN LIKE @search)";
      request.input('search', `%${search}%`);
    }

    // นับจำนวนสินค้าทั้งหมดที่ตรงเงื่อนไข
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM Trade t
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    // ดึงข้อมูลสินค้าพร้อมราคาตาม Customer Level โดย fallback ไปยัง Sale_Price1 หรือ Cost_Price
    const dataQuery = `
      SELECT 
        RTRIM(LTRIM(t.Trade_Id)) AS Trade_Id,
        RTRIM(LTRIM(t.Trade_Name)) AS Trade_Name,
        RTRIM(LTRIM(ISNULL(t.Trade_NameEN, ''))) AS Trade_NameEN,
        RTRIM(LTRIM(ISNULL(t.Unit_Name, ''))) AS Unit_Name,
        RTRIM(LTRIM(ISNULL(t.Type_Name, ''))) AS Type_Name,
        ISNULL(t.Sale_Price1, 0) AS Sale_Price1,
        t.Sale_Price2,
        t.Sale_Price3,
        t.Sale_Price4,
        t.Sale_Price5,
        CASE 
          WHEN t.Sale_Price1 > 0 THEN t.Sale_Price1
          ELSE 0 
        END AS Active_Price,
        RTRIM(LTRIM(ISNULL(t.Trade_Part_Image, ''))) AS Trade_Part_Image,
        RTRIM(LTRIM(ISNULL(t.Trade_Province, ''))) AS Trade_Province,
        RTRIM(LTRIM(ISNULL(t.Trade_Note, ''))) AS Trade_Note,
        ISNULL(t.Trade_deposit, 0) AS Trade_deposit
      FROM Trade t
      ${whereClause}
      ORDER BY 
        CASE WHEN t.Trade_Part_Image IS NOT NULL AND t.Trade_Part_Image <> '' THEN 0 ELSE 1 END,
        t.Trade_Name ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    request.input('offset', offset);
    request.input('limit', limit);

    const dataResult = await request.query(dataQuery);

    return NextResponse.json({
      success: true,
      customerLevel,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products: dataResult.recordset,
    });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดสินค้า: ' + error.message },
      { status: 500 }
    );
  }
}
