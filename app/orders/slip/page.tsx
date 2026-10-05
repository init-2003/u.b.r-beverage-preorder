'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WineLoading } from '@/components/WineLoading';
import { AlertCircle } from 'lucide-react';

interface OrderData {
  Fn_Doc_No: string;
  FILE_NAME_PIC?: string;
  Customer_Id?: string;
  Customer_Name?: string;
}

function SlipViewerContent() {
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
  const paramUser = getParam(['cususer', 'cus_user', 'user', 'u', 'username']);
  const paramPass = getParam(['cuspass', 'cus_pass', 'pass', 'p', 'password']);
  const tokenParam = getParam(['token', 'internal_token']);
  const paramFile = getParam(['file', 'filename', 'file_name', 'slip', 'pic', 'img', 'image']);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasFallbackError, setHasFallbackError] = useState(false);

  useEffect(() => {
    if (!docNo) {
      setLoading(false);
      setErrorMsg('กรุณาระบุเลขที่คำสั่งซื้อ (docno)');
      return;
    }

    if (!tokenParam && (!paramUser || !paramPass)) {
      setLoading(false);
      setErrorMsg('กรุณาระบุชื่อผู้ใช้และรหัสผ่าน (cususer, cuspass)');
      return;
    }

    let isMounted = true;

    async function fetchSlip() {
      setLoading(true);
      setErrorMsg('');
      try {
        const queryStr = searchParams.toString();
        const url = `/api/orders/${encodeURIComponent(docNo)}${queryStr ? `?${queryStr}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success || !data.order) {
          setErrorMsg(data.message || 'ไม่สามารถเปิดรูปสลิปได้');
          return;
        }

        const orderInfo: OrderData = data.order;
        setOrder(orderInfo);

        const picFile = (orderInfo.FILE_NAME_PIC || '').trim();
        if (!picFile) {
          setErrorMsg('คำสั่งซื้อนี้ยังไม่มีรูปสลิปชำระเงิน');
          return;
        }

        // ตรวจสอบชื่อไฟล์หากมีการระบุเข้ามาใน URL (Hybrid Mode)
        if (paramFile) {
          const cleanParamFile = paramFile.trim().toLowerCase();
          const cleanPicFile = picFile.toLowerCase();
          const baseParamFile = cleanParamFile.split('/').pop() || cleanParamFile;
          const basePicFile = cleanPicFile.split('/').pop() || cleanPicFile;

          if (baseParamFile !== basePicFile) {
            setErrorMsg('ชื่อไฟล์รูปภาพไม่ตรงกับคำสั่งซื้อนี้');
            return;
          }
        }

        // กำหนด path รูปสลิป
        if (picFile.startsWith('http://') || picFile.startsWith('https://') || picFile.startsWith('/uploads/')) {
          setImgSrc(picFile);
        } else if (picFile.includes('/')) {
          setImgSrc(`/uploads/slips/${picFile}`);
        } else {
          setImgSrc(`/uploads/slips/${orderInfo.Fn_Doc_No || docNo}/${picFile}`);
        }
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

    fetchSlip();

    return () => {
      isMounted = false;
    };
  }, [docNo, searchParams, tokenParam, paramUser, paramPass]);

  useEffect(() => {
    if (order?.Fn_Doc_No) {
      document.title = `Slip-${order.Fn_Doc_No}`;
    }
  }, [order?.Fn_Doc_No]);

  // กำหนด Fallback กรณี path รูปแรกไม่พบ (เช่น เก็บไว้ที่ /uploads/slips/[filename] ตรงๆ)
  const handleImageError = () => {
    if (!hasFallbackError && order?.FILE_NAME_PIC) {
      setHasFallbackError(true);
      const fallbackUrl = `/uploads/slips/${order.FILE_NAME_PIC.trim()}`;
      if (imgSrc !== fallbackUrl) {
        setImgSrc(fallbackUrl);
        return;
      }
    }
    setErrorMsg('ไม่พบไฟล์รูปภาพสลิปในระบบ');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none">
        <WineLoading size="md" />
      </div>
    );
  }

  if (errorMsg || !imgSrc) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black select-none">
        <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 p-6 rounded-lg text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-sm font-bold text-neutral-200">ไม่สามารถแสดงรูปสลิปได้</h2>
          <p className="text-xs text-neutral-400 leading-relaxed font-medium">
            {errorMsg || 'ไม่พบข้อมูล'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-2 sm:p-4 select-none overflow-hidden">
      {/* แสดงเฉพาะรูปสลิปและพื้นหลังสีดำเท่านั้น */}
      <img
        src={imgSrc}
        alt={`Slip-${order?.Fn_Doc_No || docNo}`}
        onError={handleImageError}
        className="max-h-full max-w-full object-contain rounded-xs shadow-2xl transition-transform duration-200"
      />
    </div>
  );
}

export default function StandaloneSlipPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <WineLoading size="md" />
        </div>
      }
    >
      <SlipViewerContent />
    </Suspense>
  );
}
