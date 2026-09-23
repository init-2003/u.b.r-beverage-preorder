import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        CASE 
          WHEN t.Trade_Name LIKE '%Macallan%' OR t.Trade_Name LIKE '%Maccallan%' THEN 'The Macallan'
          WHEN t.Trade_Name LIKE '%Glenrothes%' THEN 'The Glenrothes'
          WHEN t.Trade_Name LIKE '%Highland Park%' THEN 'Highland Park'
          ELSE RTRIM(LTRIM(t.Type_Name))
        END AS Type_Name,
        COUNT(t.Trade_Id) AS Product_Count
      FROM Trade t
      WHERE RTRIM(LTRIM(t.Type_Name)) = 'Pre Order'
      GROUP BY 
        CASE 
          WHEN t.Trade_Name LIKE '%Macallan%' OR t.Trade_Name LIKE '%Maccallan%' THEN 'The Macallan'
          WHEN t.Trade_Name LIKE '%Glenrothes%' THEN 'The Glenrothes'
          WHEN t.Trade_Name LIKE '%Highland Park%' THEN 'Highland Park'
          ELSE RTRIM(LTRIM(t.Type_Name))
        END
      ORDER BY Product_Count DESC
    `);

    return NextResponse.json({
      success: true,
      categories: result.recordset,
    });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดหมวดหมู่: ' + error.message },
      { status: 500 }
    );
  }
}
