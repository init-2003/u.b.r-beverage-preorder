import React from 'react';

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
  className?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  size = 'md',
  showText = true,
  lightText = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0">
        <img
          src="/images/ubr_beverage_logo_transparent.png"
          alt="โลโก้ อุบลรุ่งเรือง เบฟเวอเรจ - U.B.R. Beverage"
          className={`${sizeClasses[size]} object-contain shrink-0 block`}
        />
      </div>
      {showText && (
        <div>
          <h1
            className={`font-black tracking-tight leading-snug ${
              lightText ? 'text-white' : 'text-slate-900'
            } ${
              size === 'sm'
                ? 'text-sm'
                : size === 'lg'
                ? 'text-xl'
                : size === 'xl'
                ? 'text-2xl'
                : 'text-base sm:text-lg'
            }`}
          >
            หจก.อุบลรุ่งเรืองเบฟเวอเรจ
          </h1>
          <p
            className={`text-[10px] font-bold uppercase tracking-widest ${
              lightText ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            UBON RUNG RUEANG BEVERAGE
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyLogo;
