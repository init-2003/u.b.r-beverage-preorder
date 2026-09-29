import React from 'react';

interface CheckoutIllustrationProps {
  className?: string;
  size?: number;
}

export function CheckoutIllustration({
  className = 'w-12 h-12 sm:w-14 sm:h-14',
  size,
}: CheckoutIllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Aura Circle (Warm Amber / Gold Glow) */}
      <circle cx="50" cy="50" r="46" fill="#FFFBEB" />
      <circle cx="50" cy="50" r="39" fill="#FEF3C7" fillOpacity="0.75" />

      {/* Floating Sparkles & Decorative Elements */}
      {/* Top right gold sparkle star */}
      <path
        d="M82 17L84 21L88 23L84 25L82 29L80 25L76 23L80 21L82 17Z"
        fill="#F59E0B"
      />
      {/* Top left emerald dot */}
      <circle cx="19" cy="26" r="2.5" fill="#10B981" fillOpacity="0.85" />
      {/* Top right coral/burgundy dot */}
      <circle cx="87" cy="33" r="2" fill="#E11D48" fillOpacity="0.75" />
      {/* Left warm amber dot */}
      <circle cx="15" cy="44" r="1.8" fill="#FBBF24" />
      {/* Bottom right soft teal dot */}
      <circle cx="85" cy="65" r="1.5" fill="#14B8A6" />

      {/* Ground Soft Oval Shadow */}
      <ellipse cx="50" cy="80" rx="32" ry="4.5" fill="#94A3B8" fillOpacity="0.3" />

      {/* ================= BEVERAGE BOTTLE ON THE LEFT ================= */}
      <g id="beverage-item">
        {/* Shadow under bottle */}
        <ellipse cx="23" cy="74" rx="8" ry="2" fill="#94A3B8" fillOpacity="0.25" />
        {/* Cap */}
        <rect x="19" y="38" width="8" height="4.5" rx="1.2" fill="#F59E0B" />
        {/* Neck */}
        <rect x="20.5" y="42" width="5" height="7" rx="1" fill="#0D9488" />
        {/* Body */}
        <path
          d="M17 49C17 47.5 19 46.5 21 46.5H25C27 46.5 29 47.5 29 49L30 73H16L17 49Z"
          fill="#14B8A6"
        />
        {/* Bottle Highlight */}
        <path
          d="M19 50L18 69"
          stroke="#CCFBF1"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Bottle Label */}
        <rect x="17.5" y="55" width="11" height="7" rx="1" fill="#FFFFFF" />
        <line
          x1="19.5"
          y1="58.5"
          x2="26.5"
          y2="58.5"
          stroke="#0D9488"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* ================= CLIPBOARD / ORDER CONFIRMATION DOCUMENT ================= */}
      <g id="order-document">
        {/* Clipboard Backboard (Warm Kraft / Wood tone) */}
        <rect
          x="28"
          y="20"
          width="48"
          height="57"
          rx="6"
          fill="#F59E0B"
        />
        <rect
          x="30"
          y="22"
          width="44"
          height="53"
          rx="4"
          fill="#D97706"
        />

        {/* Crisp White Order Paper Sheet */}
        <rect
          x="32"
          y="22"
          width="40"
          height="51"
          rx="3"
          fill="#FFFFFF"
        />

        {/* Document Header Band (U.B.R. Brand Burgundy) */}
        <path
          d="M32 22H72V31H32Z"
          fill="#800020"
        />
        {/* Header Text Line Simulation */}
        <rect
          x="38"
          y="25.5"
          width="18"
          height="2.5"
          rx="1"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />

        {/* Top Metallic Clamp */}
        <rect
          x="44"
          y="17"
          width="16"
          height="6.5"
          rx="2"
          fill="#334155"
        />
        <path
          d="M48 17V14C48 12.5 49.5 11.5 52 11.5C54.5 11.5 56 12.5 56 14V17"
          stroke="#F59E0B"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Checklist Item 1 (Checked) */}
        <circle cx="38" cy="37" r="2.5" fill="#10B981" />
        <path
          d="M37 37L37.8 38L39.2 36"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="43" y="35.5" width="22" height="3" rx="1.5" fill="#CBD5E1" />

        {/* Checklist Item 2 (Checked) */}
        <circle cx="38" cy="45" r="2.5" fill="#10B981" />
        <path
          d="M37 45L37.8 46L39.2 44"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="43" y="43.5" width="18" height="3" rx="1.5" fill="#CBD5E1" />

        {/* Checklist Item 3 (Checked) */}
        <circle cx="38" cy="53" r="2.5" fill="#10B981" />
        <path
          d="M37 53L37.8 54L39.2 52"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="43" y="51.5" width="20" height="3" rx="1.5" fill="#CBD5E1" />

        {/* Total Divider Line */}
        <line
          x1="35"
          y1="59"
          x2="69"
          y2="59"
          stroke="#E2E8F0"
          strokeWidth="1.2"
          strokeDasharray="2 1.5"
        />

        {/* Total Price Tag Highlight */}
        <rect x="49" y="62" width="18" height="5" rx="2.5" fill="#FEE2E2" />
        <rect x="53" y="63.5" width="10" height="2" rx="1" fill="#800020" />
      </g>

      {/* ================= VERIFIED ORDER BADGE & CHECKMARK ================= */}
      <g id="verified-stamp">
        {/* Outer White Glow */}
        <circle cx="68" cy="65" r="14" fill="#FFFFFF" />
        {/* Emerald Outer Ring */}
        <circle cx="68" cy="65" r="12.5" fill="#10B981" />
        {/* Dark Emerald Inner Core */}
        <circle cx="68" cy="65" r="10.5" fill="#059669" />
        {/* White Confirmed Checkmark */}
        <path
          d="M63 65L66.5 68.5L73.5 61.5"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Ribbon Tail Left */}
        <path
          d="M62 75L59 81L64 78.5L66 81L65.5 75"
          fill="#047857"
        />
      </g>
    </svg>
  );
}

export default CheckoutIllustration;
