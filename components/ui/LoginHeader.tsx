'use client';

import React from 'react';

export interface LoginHeaderProps {
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
  titleId?: string;
  className?: string;
  align?: 'left' | 'center';
}

export function LoginHeader({
  showLogo = false,
  title = 'เข้าสู่ระบบ',
  subtitle,
  titleId = 'login-modal-title',
  className = '',
  align = 'left',
}: LoginHeaderProps) {
  const isLeft = align === 'left';
  return (
    <div
      className={`flex flex-col w-full ${
        isLeft ? 'items-start text-left' : 'items-center text-center'
      } ${className || 'mb-6 sm:mb-8'}`}
    >
      {/* Line 1: Logo */}
      {showLogo && (
        <img
          src="/images/ubr_beverage_logo.png"
          alt="โลโก้ อุบลรุ่งเรือง เบฟเวอเรจ"
          className="w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-sm shadow-2xs object-contain mb-2 sm:mb-2.5"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
          }}
        />
      )}

      {/* Line 2: Welcome to U.B.R Beverage Online Store */}
      {subtitle && (
        <p className="text-xs sm:text-[13px] font-medium text-slate-500 tracking-normal">
          {subtitle}
        </p>
      )}

      {/* Line 3: Title */}
      {title && (
        <h3
          id={titleId}
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-normal pt-0.5"
        >
          {title}
        </h3>
      )}
    </div>
  );
}

export default LoginHeader;
