'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'ubr_cookie_consent';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for smooth entrance animation
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

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
      className={`fixed bottom-0 left-0 right-0 z-[9999] print:hidden transition-all duration-500 ease-out ${
        isAnimatingOut
          ? 'translate-y-full opacity-0'
          : 'translate-y-0 opacity-100'
      }`}
      role="alert"
      aria-label="Cookie consent notification"
    >
      {/* Top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-[#c81415] via-amber-500 to-[#c81415]" />

      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Text content */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-[12.5px] text-slate-600 leading-relaxed">
                เว็บไซต์ หจก.อุบลรุ่งเรืองเบฟเวอเรจ ใช้คุกกี้เพื่อเพิ่มประสิทธิภาพการให้บริการ
                และมอบประสบการณ์ที่ดีในการใช้งานเว็บไซต์ โปรดศึกษาและทำความเข้าใจ{' '}
                <Link
                  href="/cookie-policy"
                  className="text-[#c81415] hover:text-[#960d0e] underline underline-offset-2 transition-colors font-medium"
                >
                  นโยบายคุกกี้
                </Link>
                {' '}และ{' '}
                <Link
                  href="/privacy-policy"
                  className="text-[#c81415] hover:text-[#960d0e] underline underline-offset-2 transition-colors font-medium"
                >
                  นโยบายความเป็นส่วนตัว
                </Link>
                {' '}หากท่านไม่ปฏิเสธและดำเนินการต่อ กรุณากดปุ่ม &quot;ยอมรับ&quot;
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                id="cookie-accept-btn"
                onClick={handleAccept}
                className="inline-flex items-center px-5 sm:px-7 py-2 sm:py-2.5 bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold text-[11px] sm:text-[12.5px] rounded-full transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 cursor-pointer whitespace-nowrap"
              >
                ยอมรับ
              </button>

              <button
                id="cookie-close-btn"
                onClick={handleClose}
                className="flex-shrink-0 p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all duration-200 cursor-pointer"
                aria-label="ปิดการแจ้งเตือนคุกกี้"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
