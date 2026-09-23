import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'ออกจากระบบเรียบร้อยแล้ว' });
  res.cookies.set('ubr_customer_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return res;
}
