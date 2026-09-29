'use client';

import React, { useEffect, useRef } from 'react';
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

      // เมื่ออนิเมชันเล่นจบ รอ 300ms แล้วเด้งไปหน้าออเดอร์อัตโนมัติ
      animItem.addEventListener('complete', () => {
        setTimeout(handleRedirect, 300);
      });
    }

    // Safety fallback: เด้งไปหน้าออเดอร์อัตโนมัติภายใน 1.5 วินาที
    const timer = setTimeout(() => {
      handleRedirect();
    }, 1500);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      if (animItem) {
        animItem.destroy();
      }
    };
  }, [docNo]);

  return (
    <div
      onClick={handleRedirect}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden touch-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-sm p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200"
      >
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

        {/* Auto Redirect Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>กำลังนำท่านไปยังหน้ารายละเอียดคำสั่งซื้อ...</span>
        </div>
      </div>
    </div>
  );
}
