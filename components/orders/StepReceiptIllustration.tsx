import React from 'react';

interface StepReceiptIllustrationProps {
  status?: 'inactive' | 'completed';
  className?: string;
}

export function StepReceiptIllustration({
  status = 'inactive',
  className = 'w-12 h-12 sm:w-14 sm:h-14',
}: StepReceiptIllustrationProps) {
  const isCompleted = status === 'completed';

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background Circular Aura & Base (Opaque white center to block the line behind) */}
      <circle cx="40" cy="40" r="38" fill="#FFFFFF" />
      <circle
        cx="40"
        cy="40"
        r="36"
        fill={isCompleted ? '#ECFDF5' : '#F8FAFC'}
      />
      <circle
        cx="40"
        cy="40"
        r="30"
        fill={isCompleted ? '#D1FAE5' : '#F1F5F9'}
        fillOpacity="0.75"
      />

      {/* Decorative Sparkles & Dots (only for completed) */}
      {isCompleted && (
        <>
          <circle cx="68" cy="22" r="2" fill="#10B981" fillOpacity="0.8" />
          <circle cx="14" cy="30" r="1.5" fill="#34D399" />
          <path
            d="M60 16L61.5 19L64.5 20.5L61.5 22L60 25L58.5 22L55.5 20.5L58.5 19L60 16Z"
            fill="#F59E0B"
          />
        </>
      )}

      {/* Soft Ground Shadow */}
      <ellipse
        cx="40"
        cy="64"
        rx="20"
        ry="3.5"
        fill={isCompleted ? '#94A3B8' : '#CBD5E1'}
        fillOpacity={isCompleted ? '0.28' : '0.2'}
      />

      {/* ================= OFFICIAL RECEIPT / INVOICE PAPER ================= */}
      <g opacity={isCompleted ? '1' : '0.55'}>
        {/* Main Paper Sheet */}
        <rect
          x="26"
          y="20"
          width="28"
          height="38"
          rx="3"
          fill="#FFFFFF"
          stroke={isCompleted ? '#059669' : '#94A3B8'}
          strokeWidth="1.5"
        />

        {/* Paper Header Ribbon / Banner */}
        <path
          d="M26 23C26 21.3431 27.3431 20 29 20H51C52.6569 20 54 21.3431 54 23V28H26V23Z"
          fill={isCompleted ? '#10B981' : '#CBD5E1'}
        />

        {/* Header Title Mini Line */}
        <rect
          x="32"
          y="23.5"
          width="16"
          height="1.8"
          rx="0.9"
          fill="#FFFFFF"
        />

        {/* Receipt Text / Itemized Lines */}
        <rect
          x="30"
          y="32"
          width="20"
          height="1.5"
          rx="0.75"
          fill={isCompleted ? '#64748B' : '#94A3B8'}
        />
        <rect
          x="30"
          y="36"
          width="15"
          height="1.5"
          rx="0.75"
          fill={isCompleted ? '#94A3B8' : '#CBD5E1'}
        />
        <rect
          x="30"
          y="40"
          width="18"
          height="1.5"
          rx="0.75"
          fill={isCompleted ? '#64748B' : '#94A3B8'}
        />

        {/* Dividing Dashed Line before total */}
        <line
          x1="30"
          y1="44"
          x2="50"
          y2="44"
          stroke={isCompleted ? '#CBD5E1' : '#E2E8F0'}
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* Mini Barcode at the bottom of the receipt */}
        <g opacity="0.7" transform="translate(30, 48)">
          <rect x="0" y="0" width="1" height="5" fill="#334155" />
          <rect x="2" y="0" width="2" height="5" fill="#334155" />
          <rect x="5" y="0" width="1" height="5" fill="#334155" />
          <rect x="7" y="0" width="1.5" height="5" fill="#334155" />
          <rect x="10" y="0" width="2" height="5" fill="#334155" />
          <rect x="13" y="0" width="1" height="5" fill="#334155" />
          <rect x="15" y="0" width="2" height="5" fill="#334155" />
          <rect x="18" y="0" width="1" height="5" fill="#334155" />
        </g>
      </g>

      {/* Status Badge Bubble (Bottom Right) */}
      {isCompleted ? (
        /* Green/Gold Check Badge */
        <g id="receipt-check-badge">
          <circle cx="53" cy="51" r="9" fill="#FFFFFF" />
          <circle cx="53" cy="51" r="7.5" fill="#10B981" />
          <path
            d="M49.5 51L51.8 53.3L56.5 48.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        /* Inactive Subtle Check Circle */
        <g id="receipt-inactive-badge">
          <circle cx="53" cy="51" r="8" fill="#FFFFFF" />
          <circle cx="53" cy="51" r="6.5" fill="#E2E8F0" />
          <path
            d="M50 51L52 53L56 49"
            stroke="#94A3B8"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}
