import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, sql } from '@/lib/db';
import { signToken, CustomerSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password, rememberMe = true } = await req.json();

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกรหัสลูกค้า (Cus_User)' },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const cleanUser = String(username).trim();
    const cleanPass = password ? String(password).trim() : '';

    // ค้นหาลูกค้าตาม Cus_User หรือ Customer_Id
    const result = await pool
      .request()
      .input('username', cleanUser)
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
          RTRIM(LTRIM(Cus_User)) = @username 
          OR RTRIM(LTRIM(Customer_Id)) = @username 
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

    if (cleanPass !== storedPass) {
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

    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax';
      path: string;
      maxAge?: number;
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 30; // 30 วัน
    }

    response.cookies.set('ubr_customer_token', token, cookieOptions);

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message },
      { status: 500 }
    );
  }
}
