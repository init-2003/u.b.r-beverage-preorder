import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'ออกจากระบบเรียบร้อยแล้ว' });
  res.cookies.set('ubr_customer_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  // รีเซ็ตสถานะ Sidebar ให้เปิด (Expanded: false) เป็นค่าเริ่มต้น
  res.cookies.set('ubr_sidebar_collapsed', 'false', { path: '/', maxAge: 31536000, sameSite: 'lax' });
  res.cookies.set('ubr_sidebar_collapsed_wide', 'false', { path: '/', maxAge: 31536000, sameSite: 'lax' });
  return res;
}
