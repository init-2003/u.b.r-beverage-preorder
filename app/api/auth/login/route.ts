import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { signToken, CustomerSession } from '@/lib/auth';
import { validateLoginPayload } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'รูปแบบข้อมูล JSON ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const validation = validateLoginPayload(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { success: false, message: validation.error || 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { username: cleanUser, password: cleanPass, rememberMe } = validation.data;
    const pool = await getDbPool();

    const cleanUserUpper = cleanUser.toUpperCase();
    const phoneDigits = cleanUser.replace(/\D/g, '');
    const hasPhone = phoneDigits.length >= 9 && phoneDigits.length <= 12 ? 1 : 0;

    // ค้นหาลูกค้าตาม Cus_User, Customer_Id (ไม่สนตัวพิมพ์เล็ก-ใหญ่) หรือค้นหาตามเบอร์โทรศัพท์
    const result = await pool
      .request()
      .input('usernameUpper', cleanUserUpper)
      .input('hasPhone', hasPhone)
      .input('phoneDigits', phoneDigits)
      .query(`
        SELECT TOP 1 
          Customer_Id, 
          Customer_Name, 
          Customer_Tel, 
          Customer_Address, 
          Customer_Zip, 
          Customer_Lavel,
          Cus_User, 
          Cus_SPass, 
          Customer_Sts
        FROM Customer 
        WHERE (
          UPPER(RTRIM(LTRIM(Cus_User))) = @usernameUpper 
          OR UPPER(RTRIM(LTRIM(Customer_Id))) = @usernameUpper 
          OR (@hasPhone = 1 AND REPLACE(REPLACE(REPLACE(Customer_Tel, ' ', ''), '-', ''), ',', '') LIKE '%' + @phoneDigits + '%')
        )
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบบัญชีลูกค้านี้ในระบบ' },
        { status: 404 }
      );
    }

    const cus = result.recordset[0];

    // ตรวจสอบรหัสผ่านตาม Cus_SPass
    const storedPass = (cus.Cus_SPass || '').trim();

    if (!cleanPass) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสผ่าน (Cus_SPass)' },
        { status: 400 }
      );
    }

    const isPassMatch =
      cleanPass === storedPass ||
      cleanPass.toLowerCase() === storedPass.toLowerCase();

    if (!isPassMatch) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // กำหนด Customer Level (1 - 5) ถ้าไม่มีให้ Default เป็น 1
    const rawLevel = parseInt(cus.Customer_Lavel, 10);
    const level = !isNaN(rawLevel) && rawLevel >= 1 && rawLevel <= 5 ? rawLevel : 1;

    const sessionData: CustomerSession = {
      customerId: cus.Customer_Id.trim(),
      cusUser: (cus.Cus_User || '').trim(),
      customerName: (cus.Customer_Name || '').trim(),
      customerTel: (cus.Customer_Tel || '').trim(),
      customerAddress: (cus.Customer_Address || '').trim(),
      customerZip: (cus.Customer_Zip || '').trim(),
      customerLevel: level,
    };

    const token = signToken(sessionData);

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      customer: sessionData,
    });

    // ตรวจสอบว่าเป็นการเชื่อมต่อผ่าน HTTPS จริงหรือไม่ (รองรับทั้ง HTTPS ตรง และผ่าน Reverse Proxy)
    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isHttps = forwardedProto ? forwardedProto.includes('https') : req.nextUrl.protocol === 'https:';

    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax';
      path: string;
      maxAge?: number;
    } = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
    };

    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 30; // 30 วัน
    }

    response.cookies.set('ubr_customer_token', token, cookieOptions);
    // รีเซ็ตสถานะ Sidebar ให้เปิด (Expanded: false) เป็นค่าเริ่มต้นเมื่อ Login
    response.cookies.set('ubr_sidebar_collapsed', 'false', { path: '/', maxAge: 31536000, sameSite: 'lax' });
    response.cookies.set('ubr_sidebar_collapsed_wide', 'false', { path: '/', maxAge: 31536000, sameSite: 'lax' });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message },
      { status: 500 }
    );
  }
}
