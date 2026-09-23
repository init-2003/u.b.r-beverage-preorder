'use client';

import React, { useEffect, useRef } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import errorAnimationData from '@/public/animations/error-cross.json';

interface PaymentErrorModalProps {
  message: string;
  onClose: () => void;
}

export default function PaymentErrorModal({ message, onClose }: PaymentErrorModalProps) {
  const animationContainer = useRef<HTMLDivElement>(null);

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
        animationData: errorAnimationData,
      });
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      if (animItem) {
        animItem.destroy();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden touch-none">
      <div className="bg-white rounded-sm p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Lottie Error Animation Container */}
        <div
          ref={animationContainer}
          className="w-32 h-32 -my-2 flex items-center justify-center pointer-events-none"
        />

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-rose-600 mt-2">
          สลิปไม่ถูกต้อง
        </h3>

        {/* Error Detail Message */}
        <p className="mt-2 text-sm text-black leading-relaxed text-center">
          {message || 'กรุณาตรวจสอบสลิปและอัปโหลดใหม่อีกครั้ง'}
        </p>

        {/* Action Button (Capsule Style) */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-2.5 px-6 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}
