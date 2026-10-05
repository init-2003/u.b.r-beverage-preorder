import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export interface CarouselSlide {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  btn1Text?: string;
  btn1Link?: string;
  btn2Text?: string;
  btn2Link?: string;
  sortOrder: number;
}

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        Carousel_Id,
        RTRIM(LTRIM(ISNULL(Slide_Title, ''))) AS Slide_Title,
        RTRIM(LTRIM(ISNULL(Slide_Text, ''))) AS Slide_Text,
        RTRIM(LTRIM(ISNULL(Image_Url, ''))) AS Image_Url,
        RTRIM(LTRIM(ISNULL(Btn1_Text, ''))) AS Btn1_Text,
        RTRIM(LTRIM(ISNULL(Btn1_Link, ''))) AS Btn1_Link,
        RTRIM(LTRIM(ISNULL(Btn2_Text, ''))) AS Btn2_Text,
        RTRIM(LTRIM(ISNULL(Btn2_Link, ''))) AS Btn2_Link,
        ISNULL(Sort_Order, 999) AS Sort_Order
      FROM Web_Carousel
      WHERE Is_Active = 1
      ORDER BY Sort_Order ASC, Carousel_Id ASC
    `);

    const slides: CarouselSlide[] = (result.recordset || []).map((row: any) => {
      let img = (row.Image_Url || '').trim();
      if (img && !img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('/')) {
        img = `/images/banners/${img}`;
      }

      return {
        id: row.Carousel_Id,
        title: row.Slide_Title || 'U.B.R Beverage',
        subtitle: row.Slide_Text,
        image: img || '/images/banners/banner1.jpg',
        btn1Text: row.Btn1_Text,
        btn1Link: row.Btn1_Link,
        btn2Text: row.Btn2_Text,
        btn2Link: row.Btn2_Link,
        sortOrder: row.Sort_Order,
      };
    });

    return NextResponse.json({
      success: true,
      slides,
    });
  } catch (error: any) {
    console.error('Fetch carousel from DB error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลด Carousel: ' + (error?.message || error), slides: [] },
      { status: 500 }
    );
  }
}
