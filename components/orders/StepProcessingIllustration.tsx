import React from 'react';

interface StepProcessingIllustrationProps {
  status?: 'inactive' | 'active' | 'completed';
  className?: string;
}

export function StepProcessingIllustration({
  status = 'inactive',
  className = 'w-12 h-12 sm:w-14 sm:h-14',
}: StepProcessingIllustrationProps) {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isInactive = status === 'inactive';

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
        fill={
          isCompleted
            ? '#FFFBEB'
            : isActive
              ? '#FFF7ED'
              : '#F8FAFC'
        }
      />
      <circle
        cx="40"
        cy="40"
        r="30"
        fill={
          isCompleted
            ? '#FEF3C7'
            : isActive
              ? '#FFEDD5'
              : '#F1F5F9'
        }
        fillOpacity="0.8"
      />

      {/* Decorative Sparkles & Dots (only for active or completed) */}
      {!isInactive && (
        <>
          <circle
            cx="66"
            cy="20"
            r="2"
            fill={isCompleted ? '#F59E0B' : '#EA580C'}
            fillOpacity="0.85"
          />
          <circle
            cx="15"
            cy="32"
            r="1.5"
            fill={isCompleted ? '#FBBF24' : '#FB923C'}
          />
          <path
            d="M62 38L63.5 41L66.5 42.5L63.5 44L62 47L60.5 44L57.5 42.5L60.5 41L62 38Z"
            fill={isCompleted ? '#D97706' : '#EA580C'}
          />
        </>
      )}

      {/* Soft Ground Shadow */}
      <ellipse
        cx="40"
        cy="64"
        rx="20"
        ry="3.5"
        fill={isInactive ? '#CBD5E1' : '#94A3B8'}
        fillOpacity={isInactive ? '0.2' : '0.28'}
      />

      {/* ================= CARDBOARD PACKAGE / PROCESSING BOX ================= */}
      {/* Box Base (Isometric 3D Parcel) */}
      <g opacity={isInactive ? '0.55' : '1'}>
        {/* Left Side */}
        <path
          d="M23 37L39 45V61L23 53V37Z"
          fill={
            isCompleted
              ? '#D97706'
              : isActive
                ? '#EA580C'
                : '#94A3B8'
          }
        />
        {/* Right Side */}
        <path
          d="M39 45L55 37V53L39 61V45Z"
          fill={
            isCompleted
              ? '#B45309'
              : isActive
                ? '#C2410C'
                : '#64748B'
          }
        />
        {/* Top Face */}
        <path
          d="M39 29L55 37L39 45L23 37L39 29Z"
          fill={
            isCompleted
              ? '#F59E0B'
              : isActive
                ? '#FB923C'
                : '#CBD5E1'
          }
        />

        {/* Packing Tape Strip */}
        <path
          d="M36 30.5L42 33.5L42 43.5L36 40.5V30.5Z"
          fill={
            isCompleted
              ? '#78350F'
              : isActive
                ? '#9A3412'
                : '#475569'
          }
          fillOpacity="0.4"
        />
        <path
          d="M37 44L41 46V60L37 58V44Z"
          fill={
            isCompleted
              ? '#78350F'
              : isActive
                ? '#9A3412'
                : '#475569'
          }
          fillOpacity="0.3"
        />

        {/* Small shipping barcode / label on box side */}
        <rect
          x="26"
          y="42"
          width="8"
          height="5"
          rx="1"
          fill="#FFFFFF"
          fillOpacity={isInactive ? '0.7' : '0.9'}
          transform="skewY(26)"
        />
      </g>

      {/* Floating Gear for Processing in Active State */}
      {isActive && (
        <g transform="translate(18, 16) scale(0.65)">
          <circle cx="15" cy="15" r="9" fill="#EA580C" />
          <circle cx="15" cy="15" r="4.5" fill="#FFFFFF" />
          <path
            d="M13 3H17V6H13V3ZM13 24H17V27H13V24ZM3 13H6V17H3V13ZM24 13H27V17H24V13Z"
            fill="#EA580C"
          />
        </g>
      )}

      {/* Status Badge Bubble (Bottom Right) */}
      {isCompleted ? (
        /* Amber Check Badge */
        <g id="proc-check-badge">
          <circle cx="53" cy="51" r="9" fill="#FFFFFF" />
          <circle cx="53" cy="51" r="7.5" fill="#D97706" />
          <path
            d="M49.5 51L51.8 53.3L56.5 48.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : isActive ? (
        /* Orange Active Clock Badge */
        <g id="proc-clock-badge">
          <circle cx="53" cy="51" r="9" fill="#FFFFFF" />
          <circle cx="53" cy="51" r="7.5" fill="#EA580C" />
          <circle cx="53" cy="51" r="6" fill="#C2410C" />
          <path
            d="M53 48V51.2L55.5 52.8"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        /* Inactive Subtle Clock / Step Indicator */
        <g id="proc-inactive-badge">
          <circle cx="53" cy="51" r="8" fill="#FFFFFF" />
          <circle cx="53" cy="51" r="6.5" fill="#E2E8F0" />
          <path
            d="M53 48.5V51.2L55 52.5"
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
