'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PurchaseOrderDocument, {
  PurchaseOrderData,
} from '@/components/orders/PurchaseOrderDocument';
import { WineLoading } from '@/components/WineLoading';

export default function StandaloneA4PurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const docNo = params?.docNo as string;
  const internalToken = searchParams.get('internal_token');

  const getParam = (names: string[]) => {
    for (const [key, value] of searchParams.entries()) {
      if (names.includes(key.toLowerCase())) {
        return value.trim();
      }
    }
    return '';
  };

  const paramUser = getParam(['cususer', 'cus_user', 'user', 'u', 'username']);
  const paramPass = getParam(['cuspass', 'cus_pass', 'pass', 'p', 'password']);
  const tokenParam = (searchParams.get('token') || '').trim();
  const hasDirectAuth = Boolean(internalToken || tokenParam || (paramUser && paramPass));

  const { customer, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<PurchaseOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [screenWidth, setScreenWidth] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!hasDirectAuth && !authLoading && !customer) {
      router.replace('/');
    }
  }, [authLoading, customer, router, hasDirectAuth]);

  useEffect(() => {
    if (!docNo) return;
    if (!hasDirectAuth && authLoading) return;
    if (!hasDirectAuth && !customer) {
      setLoading(false);
      router.replace('/');
      return;
    }
    let isMounted = true;

    async function fetchOrder() {
      setLoading(true);
      setErrorMsg('');
      try {
        const queryStr = searchParams.toString();
        const res = await fetch(
          `/api/orders/${encodeURIComponent(docNo)}${queryStr ? `?${queryStr}` : ''}`
        );
        const data = await res.json();
        if (!isMounted) return;
        if (res.status === 401 || res.status === 403) {
          if (!hasDirectAuth) router.replace('/');
          setErrorMsg(data.message || 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้');
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
  }, [docNo, customer, authLoading, router, hasDirectAuth, searchParams]);

  useEffect(() => {
    if (order?.Fn_Doc_No) {
      document.title = `PO-${order.Fn_Doc_No}`;
    }
  }, [order?.Fn_Doc_No]);

  if (loading || (!hasDirectAuth && (authLoading || !customer))) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <WineLoading size="md" />
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
        </div>
      </div>
    );
  }

  // ใบสั่งซื้อ (PO) ออกให้เมื่อสถานะเป็น '0' (กำลังดำเนินการ / ชำระแล้ว) หรือ '3' (ออกใบเสร็จแล้ว)
  const docSts = (order.Doc_Sts || '').trim();
  const canViewPo = docSts === '0' || docSts === '3';
  if (!canViewPo) {
    const currentStatusText =
      docSts === '4'
        ? 'ยกเลิก Order'
        : order.Doc_Sts_Name || 'รอชำระ';

    const unconfirmedMsg =
      docSts === '4'
        ? 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว'
        : 'ยังไม่มีใบสั่งซื้อสำหรับออร์เดอร์นี้';

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-md shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">ยังไม่สามารถเปิดใบสั่งซื้อได้</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {unconfirmedMsg}
          </p>
          <div className="text-xs bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-500">
            สถานะคำสั่งซื้อปัจจุบัน:{' '}
            <strong className="text-slate-800">{currentStatusText}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-6 px-2 sm:px-6 print:bg-white print:p-0 print:m-0 print:min-h-0">
      {/* Pure A4 Document View (Centered without any buttons) */}
      <div className="w-full flex justify-center overflow-x-auto print:overflow-visible pb-8 print:pb-0">
        <div
          style={
            screenWidth > 0 && screenWidth < 820
              ? {
                  zoom: Math.min(
                    1,
                    Math.max(0.35, (screenWidth - (screenWidth < 480 ? 16 : 32)) / 794)
                  ),
                  margin: '0 auto',
                }
              : { margin: '0 auto' }
          }
          className="print:!transform-none print:!zoom-100"
        >
          <PurchaseOrderDocument order={order} />
        </div>
      </div>
    </div>
  );
}
