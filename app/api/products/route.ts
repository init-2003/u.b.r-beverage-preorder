import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/auth';
import { resolveProductImageUrl } from '@/lib/image-utils';
import { escapeSqlLike, parseProductsQuery } from '@/lib/validation';
import { calcDeposit } from '@/lib/deposit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Zod: ตัดความยาว/ลบ control chars และ clamp page, limit (ค่า SQL ส่งผ่าน parameter เสมอ)
    const { category, search, page, limit, typeId, subMenuId } = parseProductsQuery(searchParams);
    const offset = (page - 1) * limit;

    // ตรวจสอบระดับราคาของลูกค้า ถ้า Login ให้ใช้ระดับของลูกค้า ถ้าไม่ Login ให้ใช้ระดับ 1
    const customer = await getCurrentCustomer();
    const customerLevel = customer ? customer.customerLevel : 1;

    const pool = await getDbPool();
    const request = pool.request();

    // แสดงเฉพาะสินค้าที่เป็น Pre Order (productType = 'PREORDER') รองรับทั้ง productType และ Type_Name
    let whereClause = "WHERE (UPPER(RTRIM(LTRIM(ISNULL(t.productType, '')))) = 'PREORDER' OR RTRIM(LTRIM(t.Type_Name)) = 'Pre Order')";

    if (subMenuId && subMenuId > 0) {
      whereClause += " AND (t.SubMenu_ID_Ref = @subMenuId)";
      request.input('subMenuId', subMenuId);
    } else if (typeId && typeId !== 'all' && typeId !== 'ทั้งหมด') {
      whereClause += ` AND (
        (t.SubMenu_ID_Ref > 0 AND sm.Type_ID = @typeId)
        OR (
          (t.SubMenu_ID_Ref IS NULL OR t.SubMenu_ID_Ref = 0)
          AND (
            RTRIM(LTRIM(ISNULL(t.Type_ID_Ref, ''))) = @typeId
            OR (
              (t.Type_ID_Ref IS NULL OR RTRIM(LTRIM(t.Type_ID_Ref)) = '' OR RTRIM(LTRIM(t.Type_ID_Ref)) = 'Pre Order')
              AND tp_by_name.Type_Id = @typeId
            )
          )
        )
      )`;
      request.input('typeId', typeId);
    } else if (category && category !== 'ทั้งหมด' && category !== 'all' && category !== 'Pre Order' && category !== 'PREORDER') {
      if (category.toLowerCase().includes('macallan')) {
        whereClause += " AND (t.Trade_Name LIKE '%Macallan%' OR t.Trade_Name LIKE '%Maccallan%' OR t.Trade_Id_Main LIKE '%Macallan%')";
      } else if (category.toLowerCase().includes('glenrothes')) {
        whereClause += " AND (t.Trade_Name LIKE '%Glenrothes%' OR t.Trade_Id_Main LIKE '%Glenrothes%')";
      } else if (category.toLowerCase().includes('highland')) {
        whereClause += " AND (t.Trade_Name LIKE '%Highland%' OR t.Trade_Id_Main LIKE '%Highland%')";
      } else if (category === 'สินค้าเปิดจอง' || category === 'สินค้านำเข้า') {
        // รายการสินค้า Pre-Order ทั้งหมดตรงตามเงื่อนไข
      } else {
        const cat = category.trim();
        const isWhisky = cat.includes('วิสกี้') || cat.toLowerCase().includes('whisky') || cat.toLowerCase().includes('scotch');
        const isWine = cat.includes('ไวน์') || cat.toLowerCase().includes('wine');
        const isBeer = cat.includes('เบียร์') || cat.toLowerCase().includes('beer');
        const isSake = cat.includes('สาเก') || cat.toLowerCase().includes('sake');
        const isPlum = cat.includes('บ๊วย') || cat.toLowerCase().includes('umeshu');
        const isBrandy = cat.includes('บรั่นดี') || cat.toLowerCase().includes('brandy') || cat.toLowerCase().includes('cognac');
        const isSoju = cat.includes('โซจู') || cat.toLowerCase().includes('soju');

        whereClause += ` AND (
          (t.SubMenu_ID_Ref > 0 AND t.SubMenu_ID_Ref = @subMenuIdParam)
          OR sm.SubMenu_NameTH = @categoryExact
          OR sm.SubMenu_NameTH LIKE @category
          OR t.Type_Name = @categoryExact 
          OR t.Type_Name LIKE @category 
          OR t.Trade_Name LIKE @category 
          OR t.Trade_Province LIKE @category 
          OR t.Trade_Id_Main LIKE @category
          ${isWhisky ? "OR t.Trade_Name LIKE '%Whisky%' OR t.Trade_Province LIKE '%Whisky%' OR t.Trade_Name LIKE '%Scotch%' OR t.Trade_Name LIKE '%Macallan%'" : ''}
          ${isWine ? "OR t.Trade_Name LIKE '%Wine%' OR t.Trade_Province LIKE '%Wine%'" : ''}
          ${isBeer ? "OR t.Trade_Name LIKE '%Beer%' OR t.Trade_Province LIKE '%Beer%'" : ''}
          ${isSake ? "OR t.Trade_Name LIKE '%Sake%' OR t.Type_Name LIKE '%สาเก%'" : ''}
          ${isPlum ? "OR t.Trade_Name LIKE '%Umeshu%' OR t.Trade_Name LIKE '%Plum%'" : ''}
          ${isBrandy ? "OR t.Trade_Name LIKE '%Brandy%' OR t.Trade_Name LIKE '%Cognac%'" : ''}
          ${isSoju ? "OR t.Trade_Name LIKE '%Soju%'" : ''}
        )`;
        request.input('category', `%${escapeSqlLike(category)}%`);
        request.input('categoryExact', category.trim());
        request.input('subMenuIdParam', -1);
      }
    }

    if (search) {
      whereClause += " AND (t.Trade_Name LIKE @search OR t.Trade_Id LIKE @search OR t.Trade_NameEN LIKE @search)";
      request.input('search', `%${escapeSqlLike(search)}%`);
    }

    // นับจำนวนสินค้าทั้งหมดที่ตรงเงื่อนไข โดยเชื่อมกับ Type_SubMenu และ [Type]
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM Trade t
      LEFT JOIN Type_SubMenu sm ON t.SubMenu_ID_Ref = sm.SubMenu_ID
      LEFT JOIN [Type] tp_by_name ON RTRIM(LTRIM(t.Type_Name)) = RTRIM(LTRIM(tp_by_name.Type_Name))
      ${whereClause}
    `;
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0]?.total || 0;

    // ดึงข้อมูลสินค้าพร้อม Type_SubMenu โดยอิง productType = 'PREORDER'
    const dataQuery = `
      SELECT 
        RTRIM(LTRIM(t.Trade_Id)) AS Trade_Id,
        RTRIM(LTRIM(t.Trade_Name)) AS Trade_Name,
        RTRIM(LTRIM(ISNULL(t.Trade_NameEN, ''))) AS Trade_NameEN,
        RTRIM(LTRIM(ISNULL(t.Unit_Name, ''))) AS Unit_Name,
        RTRIM(LTRIM(ISNULL(t.Type_Name, ''))) AS Type_Name,
        RTRIM(LTRIM(ISNULL(t.productType, ''))) AS productType,
        ISNULL(t.SubMenu_ID_Ref, 0) AS SubMenu_ID_Ref,
        RTRIM(LTRIM(ISNULL(sm.SubMenu_NameTH, ''))) AS SubMenu_NameTH,
        RTRIM(LTRIM(ISNULL(sm.SubMenu_NameEN, ''))) AS SubMenu_NameEN,
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
      LEFT JOIN Type_SubMenu sm ON t.SubMenu_ID_Ref = sm.SubMenu_ID
      LEFT JOIN [Type] tp_by_name ON RTRIM(LTRIM(t.Type_Name)) = RTRIM(LTRIM(tp_by_name.Type_Name))
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
    const products = (dataResult.recordset || []).map((p: any) => {
      const activePrice = Number(p.Active_Price ?? p.Sale_Price1 ?? 0);
      const { depositPercent, depositPrice } = calcDeposit(activePrice, p.Trade_deposit);
      const resolvedCategory = p.SubMenu_NameTH || p.Type_Name || 'Pre Order';
      return {
        ...p,
        category: resolvedCategory,
        Trade_Part_Image: resolveProductImageUrl(p.Trade_Part_Image),
        Deposit_Percent: depositPercent,
        Deposit_Price: depositPrice,
      };
    });

    return NextResponse.json({
      success: true,
      customerLevel,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดสินค้า: ' + error.message },
      { status: 500 }
    );
  }
}
