'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'ubr_cookie_consent';

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (pathname?.includes('/purchase-order')) return;
    // Check if user has already accepted cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for smooth entrance animation
      const timer = setTimeout(() => setIsVisible(true), 250);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (pathname?.includes('/purchase-order')) {
    return null;
  }

  const handleAccept = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      setIsVisible(false);
    }, 400);
  };

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
      setIsVisible(false);
    }, 400);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[99999] print:hidden transform-gpu will-change-[transform,opacity] transition-[transform,opacity] duration-300 ease-out ${
        isAnimatingOut
          ? 'translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100 pointer-events-auto'
      }`}
      role="alert"
      aria-label="Cookie consent notification"
    >
      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
            {/* Text content */}
            <div className="flex-1 min-w-0 pr-7 sm:pr-0">
              <p className="text-[12.5px] sm:text-[13px] text-slate-800 leading-relaxed font-normal break-words">
                preorder.ubonrr.com ใช้คุกกี้เพื่อเพิ่มประสิทธิภาพในการให้บริการ
                และส่งมอบประสบการณ์ที่ดีในการใช้งานเว็บไซต์ ตรวจสอบและ<span className="inline-block whitespace-nowrap">ทำความเข้าใจ</span>{' '}
                <Link
                  href="/cookie-policy"
                  className="text-[#800020] hover:text-[#570016] font-medium transition-colors underline decoration-slate-300 underline-offset-2 hover:decoration-[#800020]"
                >
                  นโยบายคุกกี้
                </Link>
                {' '}และ{' '}
                <Link
                  href="/privacy-policy"
                  className="text-[#800020] hover:text-[#570016] font-medium transition-colors underline decoration-slate-300 underline-offset-2 hover:decoration-[#800020]"
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
                {' '}หากคุณไม่ปฏิเสธและดำเนินการต่อโดยการคลิกปุ่ม
              </p>
            </div>

            {/* Mobile close button (Top Right like Image 2) */}
            <button
              id="cookie-close-btn-mobile"
              onClick={handleClose}
              className="sm:hidden absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="ปิดการแจ้งเตือนคุกกี้"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Action buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                id="cookie-accept-btn"
                onClick={handleAccept}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-10 py-2.5 sm:py-2.5 bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold text-[13px] sm:text-[13.5px] rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap shadow-sm hover:shadow active:scale-[0.99]"
              >
                ยอมรับ
              </button>

              {/* Desktop close button */}
              <button
                id="cookie-close-btn-desktop"
                onClick={handleClose}
                className="hidden sm:flex flex-shrink-0 p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all duration-200 cursor-pointer"
                aria-label="ปิดการแจ้งเตือนคุกกี้"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
