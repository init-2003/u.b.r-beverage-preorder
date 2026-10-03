import { NextRequest, NextResponse } from 'next/server';
import { handlePdfDownload } from '@/app/api/orders/[docNo]/pdf/route';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const getParam = (names: string[]) => {
    for (const [key, value] of searchParams.entries()) {
      if (names.includes(key.toLowerCase())) {
        return value.trim();
      }
    }
    return '';
  };

  const docNo = getParam(['docno', 'doc_no', 'docno_local', 'orderno', 'order_no', 'orderno_local', 'id']);

  if (!docNo) {
    return NextResponse.json(
      { success: false, message: 'กรุณาระบุเลขที่คำสั่งซื้อ (docno)' },
      { status: 400 }
    );
  }

  return handlePdfDownload(req, docNo);
}
