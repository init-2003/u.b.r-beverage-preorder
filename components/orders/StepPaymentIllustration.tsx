import React from 'react';

interface StepPaymentIllustrationProps {
  status?: 'pending' | 'completed';
  className?: string;
}

export function StepPaymentIllustration({
  status = 'pending',
  className = 'w-12 h-12 sm:w-14 sm:h-14',
}: StepPaymentIllustrationProps) {
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
        fill={isCompleted ? '#EFF6FF' : '#FEF2F2'}
      />
      <circle
        cx="40"
        cy="40"
        r="30"
        fill={isCompleted ? '#DBEAFE' : '#FEE2E2'}
        fillOpacity="0.75"
      />

      {/* Decorative Sparkles & Dots */}
      <circle
        cx="67"
        cy="18"
        r="2"
        fill={isCompleted ? '#2563EB' : '#EF4444'}
        fillOpacity="0.8"
      />
      <circle
        cx="14"
        cy="28"
        r="1.5"
        fill={isCompleted ? '#60A5FA' : '#F87171'}
      />
      <path
        d="M17 19L18.5 22L21.5 23.5L18.5 25L17 28L15.5 25L12.5 23.5L15.5 22L17 19Z"
        fill="#F59E0B"
      />

      {/* Soft Ground Shadow */}
      <ellipse cx="40" cy="64" rx="20" ry="3.5" fill="#94A3B8" fillOpacity="0.25" />

      {/* ================= WALLET / PAYMENT CARD ================= */}
      {/* Background Banknote peek */}
      <rect
        x="24"
        y="22"
        width="32"
        height="18"
        rx="2.5"
        fill={isCompleted ? '#1D4ED8' : '#DC2626'}
        transform="rotate(-5 24 22)"
      />
      <rect
        x="26"
        y="24"
        width="28"
        height="14"
        rx="1.5"
        fill={isCompleted ? '#60A5FA' : '#F87171'}
        transform="rotate(-5 24 22)"
      />

      {/* Main Credit/Debit Card */}
      <g>
        <rect
          x="21"
          y="28"
          width="38"
          height="25"
          rx="4"
          fill={isCompleted ? '#1E3A8A' : '#991B1B'}
        />
        {/* Card Gradient Strip / Header */}
        <rect
          x="21"
          y="33"
          width="38"
          height="6"
          fill={isCompleted ? '#2563EB' : '#B91C1C'}
        />
        {/* EMV Chip */}
        <rect
          x="25"
          y="41"
          width="7"
          height="6"
          rx="1.5"
          fill="#FBBF24"
        />
        <line x1="28.5" y1="41" x2="28.5" y2="47" stroke="#D97706" strokeWidth="0.75" />
        <line x1="25" y1="44" x2="32" y2="44" stroke="#D97706" strokeWidth="0.75" />
        {/* Card Numbers / Dots */}
        <circle cx="36" cy="44" r="1" fill="#FFFFFF" fillOpacity="0.7" />
        <circle cx="39" cy="44" r="1" fill="#FFFFFF" fillOpacity="0.7" />
        <circle cx="42" cy="44" r="1" fill="#FFFFFF" fillOpacity="0.7" />
        <circle cx="45" cy="44" r="1" fill="#FFFFFF" fillOpacity="0.7" />
      </g>

      {/* Status Badge Bubble (Bottom Right) */}
      {isCompleted ? (
        /* Blue Check Badge */
        <g id="check-badge">
          <circle cx="53" cy="51" r="9" fill="#FFFFFF" />
          <circle cx="53" cy="51" r="7.5" fill="#2563EB" />
          <path
            d="M49.5 51L51.8 53.3L56.5 48.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        /* Red/Amber Clock Badge */
        <g id="clock-badge">
          <circle cx="53" cy="51" r="9" fill="#FFFFFF" />
          <circle cx="53" cy="51" r="7.5" fill="#EF4444" />
          <circle cx="53" cy="51" r="6" fill="#DC2626" />
          {/* Clock hands */}
          <path
            d="M53 48V51.2L55.5 52.8"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}
