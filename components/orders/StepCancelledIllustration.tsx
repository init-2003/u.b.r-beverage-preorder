import React from 'react';

interface StepCancelledIllustrationProps {
  className?: string;
}

export function StepCancelledIllustration({
  className = 'w-12 h-12 sm:w-14 sm:h-14',
}: StepCancelledIllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background Circular Aura & Base (Opaque white center to block line behind) */}
      <circle cx="40" cy="40" r="38" fill="#FFFFFF" />
      <circle cx="40" cy="40" r="36" fill="#FEF2F2" />
      <circle cx="40" cy="40" r="30" fill="#FEE2E2" fillOpacity="0.8" />

      {/* Decorative Sparkles & Ambient Dots */}
      <circle cx="68" cy="20" r="2" fill="#DC2626" fillOpacity="0.75" />
      <circle cx="13" cy="29" r="1.5" fill="#EF4444" fillOpacity="0.8" />
      <path
        d="M62 15L63.5 18L66.5 19.5L63.5 21L62 24L60.5 21L57.5 19.5L60.5 18L62 15Z"
        fill="#F59E0B"
      />

      {/* Soft Ground Shadow */}
      <ellipse
        cx="40"
        cy="64"
        rx="20"
        ry="3.5"
        fill="#94A3B8"
        fillOpacity="0.25"
      />

      {/* ================= CANCELLED ORDER DOCUMENT ================= */}
      <g>
        {/* Main Paper Sheet with subtle tilt */}
        <rect
          x="26"
          y="18"
          width="28"
          height="39"
          rx="3"
          fill="#FFFFFF"
          stroke="#F87171"
          strokeWidth="1.5"
        />

        {/* Paper Header Ribbon / Banner */}
        <path
          d="M26 21C26 19.3431 27.3431 18 29 18H51C52.6569 18 54 19.3431 54 21V26H26V21Z"
          fill="#EF4444"
        />

        {/* Header Title Mini Line */}
        <rect
          x="32"
          y="21.5"
          width="16"
          height="1.8"
          rx="0.9"
          fill="#FFFFFF"
        />

        {/* Receipt Text / Itemized Lines (Strikethrough / Cancelled look) */}
        <rect
          x="30"
          y="30"
          width="20"
          height="1.5"
          rx="0.75"
          fill="#CBD5E1"
        />
        <rect
          x="30"
          y="34"
          width="16"
          height="1.5"
          rx="0.75"
          fill="#CBD5E1"
        />
        <rect
          x="30"
          y="38"
          width="18"
          height="1.5"
          rx="0.75"
          fill="#CBD5E1"
        />
        <rect
          x="30"
          y="42"
          width="12"
          height="1.5"
          rx="0.75"
          fill="#CBD5E1"
        />

        {/* Dashed Tear / Cancellation Divider */}
        <line
          x1="30"
          y1="47"
          x2="50"
          y2="47"
          stroke="#FCA5A5"
          strokeWidth="1"
          strokeDasharray="2 1.5"
        />

        {/* ================= 3D EMBOSSED CANCEL BADGE (SEAL) ================= */}
        {/* Seal Drop Shadow */}
        <circle
          cx="47"
          cy="46"
          r="12.5"
          fill="#991B1B"
          fillOpacity="0.25"
        />

        {/* Seal Outer Ring with White Border */}
        <circle
          cx="47"
          cy="45"
          r="12"
          fill="#991B1B"
          stroke="#FFFFFF"
          strokeWidth="2"
        />

        {/* Seal Inner Face */}
        <circle
          cx="47"
          cy="45"
          r="10"
          fill="#DC2626"
        />

        {/* Inner Subtle Ring */}
        <circle
          cx="47"
          cy="45"
          r="8.5"
          stroke="#EF4444"
          strokeWidth="1"
          strokeDasharray="2 1"
        />

        {/* White Cancel Cross ✕ with Rounded Caps */}
        <path
          d="M43 41L51 49M51 41L43 49"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default StepCancelledIllustration;
