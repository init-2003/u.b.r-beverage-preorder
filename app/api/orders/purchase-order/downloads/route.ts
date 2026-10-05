import { NextRequest, NextResponse } from 'next/server';
import { handlePdfDownload } from '@/app/api/orders/[docNo]/pdf/route';
import { sanitizeDocNo } from '@/lib/validation';

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

  const rawDocNo = getParam(['docno', 'doc_no', 'docno_local', 'orderno', 'order_no', 'orderno_local', 'id']);
  const docNo = sanitizeDocNo(rawDocNo);

  if (!docNo) {
    return NextResponse.json(
      { success: false, message: 'เลขที่คำสั่งซื้อไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  return handlePdfDownload(req, docNo);
}
