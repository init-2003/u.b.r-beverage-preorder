import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { MenuTreeItem, MenuSubItem } from '@/types/preorder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const pool = await getDbPool();

    const [typesRes, subMenusRes, countsRes, totalRes] = await Promise.all([
      // 1. ดึงประเภทหลักทั้งหมด 100% จากตาราง [Type] (ตัดเฉพาะแถวว่างออก)
      pool.request().query(`
        SELECT 
          RTRIM(LTRIM(tp.Type_Id)) AS Type_Id,
          RTRIM(LTRIM(tp.Type_Name)) AS Type_Name,
          RTRIM(LTRIM(ISNULL(tp.Type_NameEN, ''))) AS Type_NameEN
        FROM [Type] tp
        WHERE RTRIM(LTRIM(tp.Type_Id)) <> '' 
        ORDER BY tp.Type_Id ASC
      `),

      // 2. ดึงเมนูย่อยทั้งหมด 100% จากตาราง Type_SubMenu ที่ Status = 'Y'
      pool.request().query(`
        SELECT 
          sm.SubMenu_ID,
          RTRIM(LTRIM(sm.Type_ID)) AS Type_ID,
          RTRIM(LTRIM(sm.SubMenu_NameTH)) AS SubMenu_NameTH,
          RTRIM(LTRIM(ISNULL(sm.SubMenu_NameEN, ''))) AS SubMenu_NameEN,
          ISNULL(sm.Sort_Order, 999) AS Sort_Order
        FROM Type_SubMenu sm
        WHERE sm.Status = 'Y'
        ORDER BY ISNULL(sm.Sort_Order, 999) ASC, sm.SubMenu_ID ASC
      `),

      // 3. คำนวณจำนวนสินค้า Pre-Order แยกตาม Type_Id และ SubMenu_ID
      pool.request().query(`
        WITH PreorderTrades AS (
          SELECT 
            t.Trade_Id,
            t.SubMenu_ID_Ref,
            CASE 
              WHEN t.SubMenu_ID_Ref > 0 AND sm.Type_ID IS NOT NULL THEN RTRIM(LTRIM(sm.Type_ID))
              WHEN t.Type_ID_Ref IS NOT NULL AND RTRIM(LTRIM(t.Type_ID_Ref)) <> '' AND RTRIM(LTRIM(t.Type_ID_Ref)) <> 'Pre Order' THEN RTRIM(LTRIM(t.Type_ID_Ref))
              ELSE RTRIM(LTRIM(tp_by_name.Type_Id))
            END AS Resolved_Type_Id
          FROM Trade t
          LEFT JOIN Type_SubMenu sm ON t.SubMenu_ID_Ref = sm.SubMenu_ID
          LEFT JOIN [Type] tp_by_name ON RTRIM(LTRIM(t.Type_Name)) = RTRIM(LTRIM(tp_by_name.Type_Name))
          WHERE (UPPER(RTRIM(LTRIM(ISNULL(t.productType, '')))) = 'PREORDER' OR RTRIM(LTRIM(t.Type_Name)) = 'Pre Order')
        )
        SELECT 'TYPE' AS Kind, Resolved_Type_Id AS Item_Id, COUNT(*) AS Product_Count
        FROM PreorderTrades
        WHERE Resolved_Type_Id IS NOT NULL AND Resolved_Type_Id <> ''
        GROUP BY Resolved_Type_Id
        UNION ALL
        SELECT 'SUB' AS Kind, CAST(SubMenu_ID_Ref AS VARCHAR(20)) AS Item_Id, COUNT(*) AS Product_Count
        FROM PreorderTrades
        WHERE SubMenu_ID_Ref IS NOT NULL AND SubMenu_ID_Ref > 0
        GROUP BY SubMenu_ID_Ref
      `),

      // 4. จำนวนสินค้า Pre-Order ทั้งหมดในฐานข้อมูล
      pool.request().query(`
        SELECT COUNT(*) AS totalProducts
        FROM Trade t
        WHERE (UPPER(RTRIM(LTRIM(ISNULL(t.productType, '')))) = 'PREORDER' OR RTRIM(LTRIM(t.Type_Name)) = 'Pre Order')
      `),
    ]);

    const typeCounts = new Map<string, number>();
    const subCounts = new Map<number, number>();

    for (const row of countsRes.recordset || []) {
      const count = Number(row.Product_Count) || 0;
      if (row.Kind === 'TYPE') {
        typeCounts.set(row.Item_Id, count);
      } else if (row.Kind === 'SUB') {
        subCounts.set(Number(row.Item_Id), count);
      }
    }

    const totalProducts = Number(totalRes.recordset?.[0]?.totalProducts) || 0;

    const subMenusByType = new Map<string, MenuSubItem[]>();
    for (const sm of subMenusRes.recordset || []) {
      const tid = String(sm.Type_ID);
      const count = subCounts.get(Number(sm.SubMenu_ID)) || 0;
      if (!subMenusByType.has(tid)) {
        subMenusByType.set(tid, []);
      }
      subMenusByType.get(tid)!.push({
        subMenuId: Number(sm.SubMenu_ID),
        typeId: tid,
        subMenuNameTH: sm.SubMenu_NameTH,
        subMenuNameEN: sm.SubMenu_NameEN || undefined,
        sortOrder: sm.Sort_Order,
        productCount: count,
      });
    }

    // แสดงประเภททั้งหมด 100% จากตาราง [Type] (ตัดเฉพาะแถวว่างออก)
    const tree: MenuTreeItem[] = (typesRes.recordset || [])
      .filter((tp: any) => tp.Type_Id && String(tp.Type_Id).trim() !== '')
      .map((tp: any) => {
        const tid = String(tp.Type_Id).trim();
        const count = typeCounts.get(tid) || 0;
        const subList = subMenusByType.get(tid) || [];
        return {
          typeId: tid,
          typeName: tp.Type_Name,
          typeNameEN: tp.Type_NameEN || undefined,
          productCount: count,
          subMenus: subList,
        };
      });

    return NextResponse.json(
      {
        success: true,
        totalProducts,
        tree,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Fetch menu-tree error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดเมนูหมวดหมู่: ' + error.message },
      { status: 500 }
    );
  }
}

