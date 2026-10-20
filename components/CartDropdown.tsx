'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { ProductImage } from '@/components/ui/ProductImage';

function EmptyCartIllustration() {
  return (
    <div className="w-24 h-20 mx-auto flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 100 80" className="w-full h-full text-slate-400" aria-hidden="true">
        <style>{`
          @keyframes miniCartFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
          }
          .mini-cart-group {
            animation: miniCartFloat 3s ease-in-out infinite;
            transform-origin: center center;
          }
        `}</style>
        <g className="mini-cart-group">
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
        </g>
      </svg>
    </div>
  );
}

export default function CartDropdown() {
  const router = useRouter();
  const { items, totalQty, totalAmount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const prevQtyRef = useRef(totalQty);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastToggleTimeRef = useRef<number>(0);

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
    if (!isOpen) return;
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 170);
  };

  const toggleDropdown = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const now = Date.now();
    // ป้องกันการยิง Event ซ้ำซ้อน (Touchstart + Click double fire บนมือถือ)
    if (now - lastToggleTimeRef.current < 350) {
      return;
    }
    lastToggleTimeRef.current = now;

    if (isOpen) {
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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }
    if (isOpen && !isClosing) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, isClosing]);

  // เมื่อเปิดแล้วเลื่อน scroll สินค้าในหน้าเว็บ ให้ปิดตะกร้าลงอัตโนมัติ (Auto-close on page scroll)
  useEffect(() => {
    if (!isOpen || isClosing) return;

    // 1. ตรวจจับการเลื่อนหน้าเว็บหลัก (Scroll Window / Page) -> สั่งปิดตะกร้าทันที
    const handleWindowScroll = () => {
      closeDropdown();
    };

    // 2. หมุนลูกกลิ้งเมาส์บนหน้าเว็บนอกตัว Dropdown -> ปิดตะกร้าและให้หน้าเว็บเลื่อนดูสินค้าได้อิสระ
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const isInside = dropdownRef.current && dropdownRef.current.contains(target);
      if (!isInside) {
        closeDropdown();
      }
    };

    // 3. กด Escape เพื่อปิด
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
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
            className={`w-6 h-6 sm:w-6.5 sm:h-6.5 text-white stroke-[1.8] transition-transform duration-200 ${isBumping ? 'animate-cart-wiggle' : ''
              }`}
          />
          {isMounted && totalQty > 0 && (
            <span
              key={totalQty}
              className={`absolute -top-1 -right-1.5 min-w-[20px] h-[20px] px-1 bg-white text-[#800020] text-[11px] font-black rounded-full flex items-center justify-center border border-[#800020]/20 shadow-xs tabular-nums leading-none ${isBumping ? 'animate-badge-bump' : ''
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
          className={`absolute right-0 top-full mt-2.5 w-[360px] sm:w-[390px] max-w-[calc(100vw-24px)] z-50 ${isClosing ? 'animate-popover-out' : 'animate-popover'
            }`}
        >
          {/* Arrow Pointer pointing to Cart Icon */}
          <div className="absolute -top-[7px] right-[13px] sm:right-[16px] w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-slate-200 z-20 shadow-[-2px_-2px_3px_rgba(0,0,0,0.04)]" />

          {/* Popover Card */}
          <div className="relative bg-white rounded-[14px] apple-squircle-card shadow-xl border border-slate-200 overflow-hidden text-slate-800 z-10">
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

                {/* Items List (Shopee style single row per item, seamless without divider lines) */}
                <div className="max-h-80 overflow-y-auto overscroll-contain">
                  {items.map((item) => (
                    <Link
                      key={item.tradeId}
                      href={`/products/${encodeURIComponent(item.tradeId)}`}
                      onClick={() => closeDropdown()}
                      className="p-2.5 sm:p-3 flex items-center gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group select-none"
                    >
                      {/* Product Image: Clean & Borderless matching cart */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center select-none transition-transform group-hover:scale-105">
                        <ProductImage
                          src={item.image || '/images/ubr_beverage_logo.png'}
                          alt={item.tradeName}
                          objectFit="contain"
                          className="w-full h-full"
                          priority={true}
                          fallbackSrc="/images/ubr_beverage_logo.png"
                        />
                      </div>

                      {/* Product Name & Quantity (matching image 2) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span
                          className="text-xs sm:text-[13px] text-slate-800 font-normal truncate group-hover:text-[#800020] transition-colors leading-snug"
                          title={item.tradeName}
                        >
                          {item.tradeName}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5">
                          x{item.qty}
                        </span>
                      </div>

                      {/* Total Price in Orange */}
                      <span className="text-xs sm:text-[13px] font-bold text-[#FF6B00] shrink-0 tabular-nums ml-2">
                        ฿{((item.salePrice || 0) * item.qty).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Footer Actions (Clean seamless white, no border line) */}
                <div className="p-3.5 sm:p-4 bg-white flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 font-normal truncate">
                      มีสินค้าในตะกร้า ({totalQty} ชิ้น)
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 shrink-0">
                      รวม: <span className="text-[#FF6B00] text-sm sm:text-base font-extrabold tabular-nums">฿{(totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoToCart}
                    className="w-full py-2.5 px-5 min-h-[42px] rounded-full bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center text-center"
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
