import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, sql } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();

    const customer = await getCurrentCustomer();
    const customerLevel = customer ? customer.customerLevel : 1;
    const priceCol = `Sale_Price${customerLevel}`;

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input('id', decodedId)
      .query(`
        SELECT TOP 1
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
          RTRIM(LTRIM(ISNULL(t.Detail_Trade, ''))) AS Detail_Trade,
          ISNULL(t.Trade_deposit, 0) AS Trade_deposit
        FROM Trade t
        WHERE t.Trade_Id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบรายการสินค้านี้ในระบบ' },
        { status: 404 }
      );
    }

    const p = result.recordset[0];
    const depositPrice = Number(p.Trade_deposit) || 0;
    const activePrice = Number(p.Sale_Price1) || 0;

    const depositPercent = (depositPrice > 0 && activePrice > 0)
      ? Math.round((depositPrice / activePrice) * 100)
      : 0;

    const origin = (p.Trade_Province || '').trim();

    const product = {
      id: p.Trade_Id,
      name: p.Trade_Name,
      nameEN: p.Trade_NameEN,
      category: p.Type_Name || 'Pre Order',
      unitName: (p.Unit_Name || '').trim(),
      price: activePrice,
      salePrice1: Number(p.Sale_Price1) || 0,
      salePrice2: p.Sale_Price2 || 0,
      salePrice3: p.Sale_Price3 || 0,
      salePrice4: p.Sale_Price4 || 0,
      salePrice5: p.Sale_Price5 || 0,
      customerLevel,
      depositPrice,
      depositPercent,
      leadTimeDays: 0,
      origin,
      description: (p.Detail_Trade || p.Trade_Note || '').trim(),
      imageUrl: p.Trade_Part_Image ? p.Trade_Part_Image : '/images/ubr_beverage_logo.png',
      isPreorderOnly: (p.Type_Name || '').trim().toLowerCase() === 'pre order',
    };

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('Fetch product detail error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า: ' + error.message },
      { status: 500 }
    );
  }
}