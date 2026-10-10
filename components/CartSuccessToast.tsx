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
      <div className="bg-neutral-900/90 text-white rounded-2xl shadow-2xl px-5 sm:px-8 py-5 sm:py-6 max-w-[92vw] sm:max-w-md w-auto flex flex-col items-center text-center animate-toast-pop backdrop-blur-md border border-white/10">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#00bfa5] flex items-center justify-center text-white mb-3 shadow-lg">
          <Check className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-[3.5]" />
        </div>
        <p className="text-xs sm:text-sm md:text-[15px] font-medium text-white/95 whitespace-nowrap">
          คุณได้ทำการเพิ่มสินค้าลงในตะกร้าสินค้าแล้ว
        </p>
      </div>
    </div>
  );
}
