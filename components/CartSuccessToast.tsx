'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartSuccessToast() {
  const { isToastOpen } = useCart();

  if (!isToastOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4 select-none"
      aria-live="polite"
    >
      <div className="bg-neutral-900/90 text-white rounded-xl shadow-2xl p-6 sm:p-7 max-w-[280px] sm:max-w-[320px] w-full flex flex-col items-center text-center animate-toast-pop backdrop-blur-md border border-white/10">
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#00bfa5] flex items-center justify-center text-white mb-3.5 shadow-lg">
          <Check className="w-9 h-9 sm:w-10 sm:h-10 text-white stroke-[3.5]" />
        </div>
        <p className="text-sm sm:text-[15px] font-medium text-white/95 leading-relaxed tracking-wide">
          คุณได้ทำการเพิ่มสินค้าลงในตะกร้าสินค้าแล้ว
        </p>
      </div>
    </div>
  );
}
