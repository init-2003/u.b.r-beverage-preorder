'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';

function EmptyCartIllustration() {
  return (
    <div className="w-24 h-20 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 100 80" className="w-full h-full text-slate-400">
        {/* Cart handle & frame */}
        <path
          d="M15 15 H28 L38 52 H76 L86 24 H30"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Basket body */}
        <path
          d="M31 24 H84 L75 50 H39 Z"
          fill="#cbd5e1"
        />
        {/* Subtle cross (X) inside basket */}
        <path
          d="M54 33 L62 41 M62 33 L54 41"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Wheels */}
        <circle cx="43" cy="62" r="5" fill="#94a3b8" />
        <circle cx="72" cy="62" r="5" fill="#94a3b8" />
      </svg>
    </div>
  );
}

export default function CartDropdown() {
  const router = useRouter();
  const { items, totalQty } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const prevQtyRef = useRef(totalQty);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (totalQty > prevQtyRef.current) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 500);
      prevQtyRef.current = totalQty;
      return () => clearTimeout(timer);
    }
    prevQtyRef.current = totalQty;
  }, [totalQty]);

  const openDropdown = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(false);
    setIsOpen(true);
  };

  const closeDropdown = () => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 170);
  };

  const toggleDropdown = () => {
    if (isOpen && !isClosing) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target === e.currentTarget && isClosing) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsOpen(false);
      setIsClosing(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }
    if (isOpen && !isClosing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Navigate to cart
  const handleGoToCart = () => {
    closeDropdown();
    router.push('/cart');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Icon Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative p-2 sm:p-2.5 text-white hover:bg-white/10 rounded-full transition-transform duration-150 active:scale-80 flex items-center justify-center cursor-pointer select-none"
        title="ตะกร้าสั่งจองสินค้า"
        aria-label="ตะกร้าสินค้า"
        aria-expanded={isOpen && !isClosing}
      >
        <ShoppingCart
          className={`w-6 h-6 sm:w-6.5 sm:h-6.5 text-white stroke-[1.8] transition-transform duration-200 ${
            isBumping ? 'animate-cart-wiggle' : ''
          }`}
        />
        {isMounted && totalQty > 0 && (
          <span
            key={totalQty}
            className={`absolute -top-1 -right-1.5 min-w-[20px] h-[20px] px-1 bg-white text-[#c81415] text-[11px] font-black rounded-full flex items-center justify-center border border-[#c81415]/20 shadow-xs tabular-nums leading-none ${
              isBumping ? 'animate-badge-bump' : ''
            }`}
          >
            {totalQty}
          </span>
        )}
      </button>

      {/* Floating Dropdown Popover with smooth in/out animations */}
      {isOpen && (
        <div
          onAnimationEnd={handleAnimationEnd}
          className={`absolute right-0 top-full mt-2.5 w-[350px] sm:w-[380px] z-50 ${
            isClosing ? 'animate-popover-out' : 'animate-popover'
          }`}
        >
          {/* Arrow Pointer pointing to Cart Icon */}
          <div className="absolute -top-[7px] right-[13px] sm:right-[16px] w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-slate-200 z-20 shadow-[-2px_-2px_3px_rgba(0,0,0,0.04)]" />

          {/* Popover Card */}
          <div className="relative bg-white rounded-sm shadow-xl border border-slate-200 overflow-hidden text-slate-800 z-10">
          {items.length === 0 ? (
            /* ========================================================= */
            /* EMPTY STATE: 100% Matching User's Image Reference         */
            /* ========================================================= */
            <div className="py-8 px-6 text-center space-y-3">
              {/* Illustrated Empty Cart with X */}
              <EmptyCartIllustration />

              {/* Title */}
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                ไม่มีสินค้าในตะกร้า
              </h3>

              {/* Subtitle description */}
              <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                <span>คุณไม่มีสินค้าในตะกร้า</span>
                <br />
                <span>โปรดเลือกหยิบสินค้าที่ต้องการซื้อลงตะกร้า</span>
              </p>
            </div>
          ) : (
            /* ========================================================= */
            /* ACTIVE CART STATE: Shopee style compact single line rows  */
            /* ========================================================= */
            <div className="flex flex-col">
              {/* Header */}
              <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-normal">
                  สินค้าที่เพิ่มเข้ามาล่าสุด
                </span>
              </div>

              {/* Items List (Shopee style single row per item) */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100/80">
                {items.map((item) => (
                  <Link
                    key={item.tradeId}
                    href={`/products/${item.tradeId}`}
                    onClick={() => closeDropdown()}
                    className="p-2.5 sm:p-3 flex items-center gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group select-none"
                  >
                    {/* Square Thumbnail */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-none bg-white shrink-0 overflow-hidden border border-slate-200/80 p-0.5 flex items-center justify-center">
                      <img
                        src={item.image || '/images/ubr_beverage_logo.png'}
                        alt={item.tradeName}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
                        }}
                      />
                    </div>

                    {/* Product Name (Single line truncate) */}
                    <span
                      className="text-xs sm:text-[13px] text-slate-800 font-normal truncate flex-1 min-w-0 group-hover:text-red-600 transition-colors"
                      title={item.tradeName}
                    >
                      {item.tradeName}
                    </span>

                    {/* Price in Red */}
                    <span className="text-xs sm:text-[13px] font-bold text-[#c81415] shrink-0 tabular-nums ml-2">
                      ฿{(item.salePrice || 0).toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Footer Actions (Clean seamless white, no border line) */}
              <div className="p-3 sm:p-3.5 bg-white flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-normal truncate">
                  มีสินค้า {totalQty} ชิ้นในตะกร้า
                </span>

                <button
                  type="button"
                  onClick={handleGoToCart}
                  className="py-2 px-5 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  ไปที่ตะกร้า
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
