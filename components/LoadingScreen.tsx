'use client';

import React from 'react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { BouncingDots } from '@/components/loading-ui/bouncing-dots';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

export function LoadingScreen({
  message = 'กำลังเข้าสู่ระบบ...',
  subMessage,
  className = '',
}: LoadingScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#800020] p-6 text-white min-h-screen min-h-[100dvh] w-full select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* โลโก้รูปขวด (เฉพาะรูปขวด ไม่มีตัวหนังสือชื่อบริษัท) อยู่ด้านบนเหนือจุดเด้ง */}
      <div className="mb-5 sm:mb-6 flex flex-col items-center text-center">
        <img
          src="/images/ubr_beverage_logo_transparent.png"
          alt="โลโก้ อุบลรุ่งเรือง เบฟเวอเรจ - รูปขวด"
          className="h-16 sm:h-20 w-auto object-contain drop-shadow-md"
          loading="lazy"
        />
      </div>

      {/* Bouncing Dots Animation สีทองอำพัน */}
      <div className="my-2 flex items-center justify-center text-amber-400">
        <BouncingDots className="w-14 sm:w-16 h-4" />
      </div>

      {/* ข้อความสถานะการโหลด */}
      {message && (
        <h3 className="text-base sm:text-lg font-medium tracking-normal text-white/95 mt-3 text-center">
          {message}
        </h3>
      )}

      {/* คำอธิบายเพิ่มเติม (ถ้ามี) */}
      {subMessage && (
        <p className="text-xs sm:text-sm text-white/70 tracking-normal mt-1.5 text-center max-w-sm">
          {subMessage}
        </p>
      )}
    </div>
  );
}

export default LoadingScreen;
