'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Printer, Download, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PurchaseOrderDocument, {
  PurchaseOrderData,
} from '@/components/orders/PurchaseOrderDocument';

export default function ViewPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docNo = params?.docNo as string;
  const internalToken = searchParams.get('internal_token');
  const isInternal = Boolean(internalToken);

  const { customer, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<PurchaseOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isInternal && !authLoading && !customer) {
      router.replace('/');
    }
  }, [authLoading, customer, router, isInternal]);

  useEffect(() => {
    if (!docNo) return;
    if (!isInternal && authLoading) return;
    if (!isInternal && !customer) {
      setLoading(false);
      router.replace('/');
      return;
    }
    let isMounted = true;

    async function fetchOrder() {
      setLoading(true);
      setErrorMsg('');
      try {
        const queryStr = internalToken ? `?internal_token=${encodeURIComponent(internalToken)}` : '';
        const res = await fetch(`/api/orders/${encodeURIComponent(docNo)}${queryStr}`);
        const data = await res.json();
        if (!isMounted) return;
        if (res.status === 401 || res.status === 403) {
          if (!isInternal) router.replace('/');
          setErrorMsg(data.message || 'ไม่มีสิทธิ์เข้าถึง');
          return;
        }
        if (!res.ok || !data.success || !data.order) {
          setErrorMsg(data.message || 'ไม่พบเอกสารคำสั่งซื้อนี้');
          return;
        }
        setOrder(data.order);
      } catch {
        if (isMounted) setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [docNo, customer, authLoading, router, isInternal, internalToken]);

  useEffect(() => {
    if (order?.Fn_Doc_No) {
      document.title = `PurchaseOrderNo${order.Fn_Doc_No}`;
    }
  }, [order?.Fn_Doc_No]);

  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      document.title = `PurchaseOrderNo${order?.Fn_Doc_No || docNo}`;
      window.print();
    }
  };

  const handleDownload = async () => {
    if (downloading || !order) return;
    try {
      setDownloading(true);
      const res = await fetch(`/api/orders/${encodeURIComponent(order.Fn_Doc_No)}/pdf`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'ไม่สามารถดาวน์โหลดใบสั่งซื้อได้');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PurchaseOrderNo${order.Fn_Doc_No}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading || !customer || loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-[#c81415] mb-3" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-md shadow-sm border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">ไม่สามารถเปิดเอกสารได้</h2>
          <p className="text-xs text-slate-600">{errorMsg || 'ไม่พบข้อมูลคำสั่งซื้อ'}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
        </div>
      </div>
    );
  }

  // ใบสั่งซื้อ (PO) ออกให้เฉพาะคำสั่งซื้อที่มีสถานะเป็น '3' (ออกใบเสร็จแล้ว)
  const isReceiptIssued = (order.Doc_Sts || '').trim() === '3';
  if (!isReceiptIssued) {
    const currentStatusText =
      (order.Doc_Sts || '').trim() === '4'
        ? 'ยกเลิก Order'
        : order.Doc_Sts_Name || 'กำลังดำเนินการ';

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-md shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่สามารถเปิดใบสั่งซื้อได้</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            เอกสารใบสั่งซื้อจะสามารถพิมพ์หรือดาวน์โหลดได้ เมื่อสถานะคำสั่งซื้อเป็น{' '}
            <strong className="text-emerald-700 font-bold">"ออกใบเสร็จแล้ว"</strong> เรียบร้อยแล้วเท่านั้น
          </p>
          <div className="text-xs bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-500">
            สถานะคำสั่งซื้อปัจจุบัน:{' '}
            <strong className="text-slate-800">{currentStatusText}</strong>
          </div>
          <div className="pt-2">
            <Link
              href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปหน้ารายละเอียดคำสั่งซื้อ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 print:bg-white print:p-0 print:m-0 print:min-h-0">
      {/* Action Bar (Hidden when printing) */}
      <div className="max-w-[850px] mx-auto mb-4 flex items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-md shadow-sm border border-slate-200 print:hidden">
        <div className="text-xs text-slate-600">
          เลขที่เอกสาร: <strong className="text-slate-800 font-bold">{order.Fn_Doc_No}</strong>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={`inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer ${
              downloading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังดาวน์โหลด...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] active:bg-[#1e3a8a] text-white px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Standard A4 Purchase Order Document */}
      <PurchaseOrderDocument order={order} />
    </div>
  );
}
