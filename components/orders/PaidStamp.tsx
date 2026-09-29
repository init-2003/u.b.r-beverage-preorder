import React from 'react';

interface PaidStampProps {
  date?: string;
  docNo?: string;
  label?: string;
  subLabel?: string;
  shape?: 'circle' | 'rectangle' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'green' | 'orange' | 'amber' | 'blue';
  className?: string;
  animate?: boolean;
}

function formatStampDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function PaidStamp({
  date,
  docNo,
  label = 'ชำระแล้ว',
  subLabel = 'PAID',
  shape = 'circle',
  size = 'md',
  color = 'red',
  className = '',
  animate = true,
}: PaidStampProps) {
  const formattedDate = formatStampDate(date);
  const isGreen = color === 'green';
  const isAmber = color === 'orange' || color === 'amber';
  const isBlue = color === 'blue';

  // ================= BADGE STAMP (ตราปั๊มแบบป้ายแนวนอน / Rubber Stamp Badge) =================
  if (shape === 'badge') {
    let borderColor = 'border-red-600';
    let dashedBorderColor = 'border-red-500/75';
    let textColor = 'text-red-600';
    let bgColor = 'bg-red-500/[0.05]';
    let dividerColor = 'border-red-600/50';
    let shadowColor = 'rgba(220, 38, 38, 0.2)';
    let inkDotColor = '#dc2626';

    if (isGreen) {
      borderColor = 'border-emerald-600';
      dashedBorderColor = 'border-emerald-500/75';
      textColor = 'text-emerald-700';
      bgColor = 'bg-emerald-600/[0.05]';
      dividerColor = 'border-emerald-600/50';
      shadowColor = 'rgba(5, 150, 105, 0.2)';
      inkDotColor = '#059669';
    } else if (isAmber) {
      borderColor = 'border-amber-600';
      dashedBorderColor = 'border-amber-500/75';
      textColor = 'text-amber-700';
      bgColor = 'bg-amber-500/[0.06]';
      dividerColor = 'border-amber-600/50';
      shadowColor = 'rgba(217, 119, 6, 0.2)';
      inkDotColor = '#d97706';
    } else if (isBlue) {
      borderColor = 'border-blue-600';
      dashedBorderColor = 'border-blue-500/75';
      textColor = 'text-blue-700';
      bgColor = 'bg-blue-600/[0.05]';
      dividerColor = 'border-blue-600/50';
      shadowColor = 'rgba(29, 78, 216, 0.2)';
      inkDotColor = '#1d4ed8';
    }

    return (
      <div
        className={`select-none inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px] border-[1.8px] ${borderColor} ${bgColor} ${textColor} transform -rotate-2 hover:rotate-0 transition-transform duration-150 relative overflow-hidden shadow-2xs ${className}`}
        style={{
          boxShadow: `0 1px 2px 0 ${shadowColor}, inset 0 0 0 1px ${shadowColor}`,
        }}
        aria-label={`ตราปั๊ม${label}`}
      >
        {/* Inner dashed stamp border */}
        <div className={`absolute inset-0 border border-dashed ${dashedBorderColor} m-[1.5px] rounded-[1.5px] pointer-events-none`} />

        {/* Star / Stamp icon */}
        <span className="text-[9px] font-black leading-none shrink-0 opacity-90">★</span>

        {/* Main Stamp Text */}
        <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase leading-none">
          {label}
        </span>

        {/* Subtitle / PAID or PENDING */}
        {subLabel && (
          <span className={`text-[9px] font-black font-mono tracking-widest uppercase border-l ${dividerColor} pl-1.5 ml-0.5 leading-none opacity-90`}>
            {subLabel}
          </span>
        )}

        {/* Subtle authentic ink grunge noise */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 [background-size:4px_4px]"
          style={{
            backgroundImage: `radial-gradient(${inkDotColor} 1px, transparent 1px)`,
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    );
  }

  const theme = isGreen
    ? {
        border: 'border-emerald-600',
        dashedBorder: 'border-emerald-500/85',
        bg: 'bg-emerald-600/[0.02]',
        text: 'text-emerald-700',
        textMuted: 'text-emerald-700/90',
        divider: 'border-emerald-600',
        dashedDivider: 'border-emerald-500/60',
        shadow: 'rgba(5, 150, 105, 0.15)',
        hex: '#059669',
      }
    : isAmber
    ? {
        border: 'border-amber-600',
        dashedBorder: 'border-amber-500/85',
        bg: 'bg-amber-600/[0.02]',
        text: 'text-amber-700',
        textMuted: 'text-amber-700/90',
        divider: 'border-amber-600',
        dashedDivider: 'border-amber-500/60',
        shadow: 'rgba(217, 119, 6, 0.15)',
        hex: '#d97706',
      }
    : isBlue
    ? {
        border: 'border-blue-600',
        dashedBorder: 'border-blue-500/85',
        bg: 'bg-blue-600/[0.02]',
        text: 'text-blue-700',
        textMuted: 'text-blue-700/90',
        divider: 'border-blue-600',
        dashedDivider: 'border-blue-500/60',
        shadow: 'rgba(29, 78, 216, 0.15)',
        hex: '#1d4ed8',
      }
    : {
        border: 'border-red-600',
        dashedBorder: 'border-red-500/85',
        bg: 'bg-red-500/[0.03]',
        text: 'text-red-600',
        textMuted: 'text-red-600/90',
        divider: 'border-red-600',
        dashedDivider: 'border-red-500/60',
        shadow: 'rgba(220, 38, 38, 0.2)',
        hex: '#dc2626',
      };

  // ================= CIRCULAR STAMP (ตราปั๊มวงกลมเสมือนจริง) =================
  if (shape === 'circle') {
    const circleSizes = {
      sm: 'w-36 h-36 p-1.5',
      md: 'w-44 h-44 sm:w-48 sm:h-48 p-2 sm:p-2.5',
      lg: 'w-56 h-56 sm:w-60 sm:h-60 p-3',
    };

    const titleSizes = {
      sm: 'text-base font-black tracking-wide',
      md: 'text-xl sm:text-2xl font-black tracking-wider',
      lg: 'text-2xl sm:text-3xl font-black tracking-widest',
    };

    const subSizes = {
      sm: 'text-[9px] tracking-[0.2em]',
      md: 'text-[10px] sm:text-[11px] tracking-[0.25em]',
      lg: 'text-xs tracking-[0.3em]',
    };

    return (
      <div
        className={`select-none pointer-events-none inline-block ${
          animate ? 'animate-stamp-slam' : 'rotate-[-12deg]'
        } ${className}`}
        style={{ mixBlendMode: 'multiply' }}
        aria-label={`ตราปั๊ม${label}`}
      >
        {/* Outer Circular Ring */}
        <div
          className={`relative rounded-full border-[3.5px] ${theme.border} ${theme.bg} ${theme.text} shadow-xs flex items-center justify-center ${circleSizes[size]}`}
          style={{
            boxShadow: `inset 0 0 0 1px ${theme.shadow}`,
          }}
        >
          {/* Inner Dashed Ring */}
          <div className={`w-full h-full rounded-full border-[1.5px] border-dashed ${theme.dashedBorder} flex flex-col items-center justify-between p-2 sm:p-2.5 text-center overflow-hidden`}>
            {/* Top Arc Section */}
            <div className="w-full pt-1 flex flex-col items-center justify-center">
              <div className={`text-[8.5px] sm:text-[10px] font-black tracking-widest uppercase ${theme.textMuted} flex items-center gap-1`}>
                <span className="text-[7px]">★</span>
                <span>U.B.R. BEVERAGE</span>
                <span className="text-[7px]">★</span>
              </div>
            </div>

            {/* Middle Section with Double Dividing Lines */}
            <div className="w-full py-1 my-auto flex flex-col items-center justify-center relative">
              {/* Top double dividing line */}
              <div className={`w-[86%] border-t-[1.5px] ${theme.divider} relative`}>
                <div className={`w-full border-t border-dashed ${theme.dashedDivider} mt-[2px]`} />
              </div>

              {/* Main Stamp Text */}
              <div className="py-1 flex flex-col items-center">
                <span className={`${theme.text} leading-tight ${titleSizes[size]}`}>
                  {label}
                </span>
                <span className={`${theme.text} font-mono font-black uppercase mt-0.5 ${subSizes[size]}`}>
                  - {subLabel} -
                </span>
              </div>

              {/* Bottom double dividing line */}
              <div className={`w-[86%] border-t border-dashed ${theme.dashedDivider} mb-[2px]`}>
                <div className={`w-full border-t-[1.5px] ${theme.divider} mt-[2px]`} />
              </div>
            </div>

            {/* Bottom Arc Section */}
            <div className={`w-full pb-1 flex flex-col items-center justify-center text-[8px] sm:text-[9.5px] font-bold ${theme.textMuted} leading-tight`}>
              {formattedDate && <span>วันที่: {formattedDate}</span>}
              {docNo && <span className="font-mono tracking-wider">{docNo}</span>}
            </div>
          </div>

          {/* Authentic ink grunge noise texture */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-20 [background-size:6px_6px]"
            style={{
              backgroundImage: `radial-gradient(${theme.hex} 1px, transparent 1px)`,
              mixBlendMode: 'multiply',
            }}
          />
        </div>
      </div>
    );
  }

  // ================= RECTANGULAR STAMP (ตราปั๊มสี่เหลี่ยม) =================
  const sizeClasses = {
    sm: 'w-36 py-1 px-2.5 text-[10px]',
    md: 'w-48 sm:w-52 py-1.5 sm:py-2 px-3 sm:px-4 text-xs',
    lg: 'w-60 sm:w-64 py-2 sm:py-2.5 px-4 sm:px-5 text-sm',
  };

  const titleSizeClasses = {
    sm: 'text-sm font-black tracking-wider leading-none',
    md: 'text-lg sm:text-xl font-black tracking-widest leading-none',
    lg: 'text-2xl font-black tracking-widest leading-none',
  };

  const subSizeClasses = {
    sm: 'text-[9px] font-bold tracking-widest',
    md: 'text-[11px] font-black tracking-[0.25em]',
    lg: 'text-xs font-black tracking-[0.3em]',
  };

  return (
    <div
      className={`select-none pointer-events-none inline-block ${
        animate ? 'animate-stamp-slam' : 'rotate-[-12deg]'
      } ${className}`}
      style={{ mixBlendMode: 'multiply' }}
      aria-label={`ตราปั๊ม${label}`}
    >
      {/* Outer border container */}
      <div
        className={`relative rounded-sm border-[3px] ${theme.border} ${theme.bg} ${theme.text} shadow-xs ${sizeClasses[size]}`}
        style={{
          boxShadow: `inset 0 0 0 1px ${theme.shadow}`,
        }}
      >
        {/* Inner double border */}
        <div className={`border border-dashed ${theme.dashedBorder} rounded-[2px] p-1.5 sm:p-2 text-center flex flex-col items-center justify-center space-y-0.5`}>
          {/* Header org name */}
          <div className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase ${theme.textMuted} flex items-center gap-1`}>
            <span>★</span>
            <span>U.B.R. BEVERAGE</span>
            <span>★</span>
          </div>

          {/* Main Stamp Text */}
          <div className={`${theme.text} py-0.5 ${titleSizeClasses[size]}`}>
            {label}
          </div>

          {/* Sub English PAID / PENDING */}
          <div className={`${theme.text} font-mono uppercase ${subSizeClasses[size]}`}>
            - {subLabel} -
          </div>

          {/* Footer info: Date & DocNo */}
          {(formattedDate || docNo) && (
            <div className={`pt-0.5 border-t ${theme.dashedDivider} w-full mt-0.5 flex items-center justify-between text-[8px] sm:text-[9.5px] font-bold ${theme.textMuted} px-1`}>
              {formattedDate ? <span>วันที่: {formattedDate}</span> : <span />}
              {docNo ? <span>{docNo}</span> : <span />}
            </div>
          )}
        </div>

        {/* Subtle rubber stamp ink grunge texture overlays */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 [background-size:6px_6px]"
          style={{
            backgroundImage: `radial-gradient(${theme.hex} 1px, transparent 1px)`,
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    </div>
  );
}
