'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import lottie, { AnimationItem } from 'lottie-web';
import successAnimationData from '@/public/animations/success-check.json';

interface PaymentSuccessModalProps {
  docNo: string;
}

export default function PaymentSuccessModal({ docNo }: PaymentSuccessModalProps) {
  const router = useRouter();
  const animationContainer = useRef<HTMLDivElement>(null);
  const redirectedRef = useRef(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  const handleRedirect = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(`/orders/${encodeURIComponent(docNo)}`);
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let animItem: AnimationItem | null = null;

    if (animationContainer.current) {
      animItem = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        animationData: successAnimationData,
      });

      // เมื่ออนิเมชันเล่นจบ
      animItem.addEventListener('complete', () => {
        setAnimationFinished(true);
      });
    }

    // Safety fallback: หากไม่ได้รับ event ให้เปิดปุ่มพร้อมกดได้ทันทีใน 1.5 วินาที
    const timer = setTimeout(() => {
      setAnimationFinished(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      if (animItem) {
        animItem.destroy();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden touch-none">
      <div className="bg-white rounded-sm p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Lottie Animation Container */}
        <div
          ref={animationContainer}
          className="w-36 h-36 -my-2 flex items-center justify-center pointer-events-none"
        />

        {/* Success Text */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
          แนบสลิปเรียบร้อยแล้ว
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          เลขที่ออเดอร์:{' '}
          <span className="font-semibold text-slate-700">{docNo}</span>
        </p>

        {/* ปุ่ม ยืนยัน สำหรับไปหน้ารายละเอียดคำสั่งซื้อ (Capsule Style) */}
        <button
          type="button"
          onClick={handleRedirect}
          className="w-full mt-6 py-2.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  );
}
