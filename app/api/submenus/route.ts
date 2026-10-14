import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        sm.SubMenu_ID,
        sm.Type_ID,
        RTRIM(LTRIM(sm.SubMenu_NameTH)) AS SubMenu_NameTH,
        RTRIM(LTRIM(ISNULL(sm.SubMenu_NameEN, ''))) AS SubMenu_NameEN,
        sm.Sort_Order,
        COUNT(t.Trade_Id) AS Product_Count
      FROM Type_SubMenu sm
      INNER JOIN Trade t ON t.SubMenu_ID_Ref = sm.SubMenu_ID
      WHERE sm.Status = 'Y'
        AND (UPPER(RTRIM(LTRIM(ISNULL(t.productType, '')))) = 'PREORDER' OR RTRIM(LTRIM(t.Type_Name)) = 'Pre Order')
      GROUP BY 
        sm.SubMenu_ID,
        sm.Type_ID,
        sm.SubMenu_NameTH,
        sm.SubMenu_NameEN,
        sm.Sort_Order
      ORDER BY 
        sm.Sort_Order ASC, 
        sm.SubMenu_ID ASC
    `);

    return NextResponse.json({
      success: true,
      subMenus: result.recordset || [],
    });
  } catch (error: any) {
    console.error('Fetch submenus error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดเมนูประเภท: ' + error.message },
      { status: 500 }
    );
  }
}
