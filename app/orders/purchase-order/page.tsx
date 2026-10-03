'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PurchaseOrderDocument, {
  PurchaseOrderData,
} from '@/components/orders/PurchaseOrderDocument';
import { WineLoading } from '@/components/WineLoading';
import { AlertCircle } from 'lucide-react';

function PurchaseOrderViewer() {
  const searchParams = useSearchParams();

  const getParam = (names: string[]) => {
    for (const [key, value] of searchParams.entries()) {
      if (names.includes(key.toLowerCase())) {
        return value.trim();
      }
    }
    return '';
  };

  const docNo = getParam(['docno', 'doc_no', 'docno_local', 'orderno', 'order_no', 'orderno_local', 'id']);

  const [order, setOrder] = useState<PurchaseOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!docNo) {
      setLoading(false);
      setErrorMsg('กรุณาระบุเลขที่คำสั่งซื้อ (docno)');
      return;
    }

    let isMounted = true;

    async function fetchOrder() {
      setLoading(true);
      setErrorMsg('');
      try {
        const queryStr = searchParams.toString();
        const url = `/api/orders/${encodeURIComponent(docNo)}${queryStr ? `?${queryStr}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success || !data.order) {
          setErrorMsg(data.message || 'ไม่สามารถเปิดเอกสารได้');
          return;
        }

        setOrder(data.order);
      } catch {
        if (isMounted) {
          setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [docNo, searchParams]);

  useEffect(() => {
    if (order?.Fn_Doc_No) {
      document.title = `PurchaseOrderNo${order.Fn_Doc_No}`;
    }
  }, [order?.Fn_Doc_No]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 print:hidden">
        <WineLoading size="md" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-100 print:hidden">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">ไม่สามารถเปิดเอกสารได้</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {errorMsg || 'ข้อมูลไม่ถูกต้อง'}
          </p>
        </div>
      </div>
    );
  }

  // ใบสั่งซื้อ (PO) ออกให้เฉพาะคำสั่งซื้อที่มีสถานะเป็น '0' (กำลังดำเนินการ / ชำระแล้ว) หรือ '3' (ออกใบเสร็จแล้ว)
  const docSts = (order.Doc_Sts || '').trim();
  const canViewPo = docSts === '0' || docSts === '3';

  if (!canViewPo) {
    const unconfirmedMsg =
      docSts === '4'
        ? 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว'
        : 'ยังไม่สร้างใบสั่งซื้อสำหรับออร์เดอร์นี้ เพราะระบบต้องชำระเงินก่อนถึงจะสร้างได้';

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-100 print:hidden">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">ยังไม่สามารถเปิดใบสั่งซื้อได้</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {unconfirmedMsg}
          </p>
          <div className="text-xs bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-500">
            สถานะคำสั่งซื้อปัจจุบัน:{' '}
            <strong className="text-slate-800">{order.Doc_Sts_Name || 'รอชำระ'}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#eceef1] py-8 px-2 flex justify-center items-start print:static print:inset-auto print:bg-white print:p-0 print:m-0 print:block print:overflow-visible print:h-auto print:min-h-0 print:max-h-none">
      {/* Standalone Purchase Order Document: ไม่มีปุ่มใดๆ มีเพียงตัวเอกสาร A4 เท่านั้น */}
      <PurchaseOrderDocument order={order} />
    </div>
  );
}

export default function StandalonePurchaseOrderQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 print:hidden">
          <WineLoading size="md" />
        </div>
      }
    >
      <PurchaseOrderViewer />
    </Suspense>
  );
}
