'use client';

import React from 'react';

export interface LoginHeaderProps {
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
  titleId?: string;
  className?: string;
}

export function LoginHeader({
  showLogo = true,
  title = 'เข้าสู่ระบบ',
  subtitle = 'Welcome to U.B.R Beverage Online Store',
  titleId = 'login-modal-title',
  className = '',
}: LoginHeaderProps) {
  return (
    <div className={`flex flex-col items-center text-center space-y-1.5 mb-6 ${className}`}>
      {/* Line 1: Logo */}
      {showLogo && (
        <img
          src="/images/ubr_beverage_logo.png"
          alt="โลโก้ อุบลรุ่งเรือง เบฟเวอเรจ"
          className="w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-sm shadow-2xs object-contain mb-1"
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
          className="text-xl sm:text-2xl font-bold text-slate-900 tracking-normal pt-0.5"
        >
          {title}
        </h3>
      )}
    </div>
  );
}

export default LoginHeader;
