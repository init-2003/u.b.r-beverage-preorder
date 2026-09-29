import React from 'react';

interface CartIllustrationProps {
  className?: string;
  size?: number;
}

export function CartIllustration({
  className = 'w-12 h-12 sm:w-14 sm:h-14',
  size,
}: CartIllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Aura Circle (Warm Crimson/Rose) */}
      <circle cx="50" cy="50" r="46" fill="#FDF2F4" />
      <circle cx="50" cy="50" r="39" fill="#FCE7EC" fillOpacity="0.75" />

      {/* Floating Sparkles & Decorative Elements */}
      {/* Top right gold sparkle star */}
      <path
        d="M78 18L80 22L84 24L80 26L78 30L76 26L72 24L76 22L78 18Z"
        fill="#F59E0B"
      />
      {/* Top left mint/teal dot */}
      <circle cx="21" cy="28" r="2.5" fill="#14B8A6" fillOpacity="0.85" />
      {/* Top right coral dot */}
      <circle cx="86" cy="34" r="2" fill="#E11D48" fillOpacity="0.75" />
      {/* Left warm amber dot */}
      <circle cx="17" cy="46" r="1.8" fill="#FBBF24" />
      {/* Bottom right soft blue dot */}
      <circle cx="83" cy="68" r="1.5" fill="#93C5FD" />

      {/* Ground Soft Oval Shadow */}
      <ellipse cx="50" cy="80" rx="30" ry="4.5" fill="#94A3B8" fillOpacity="0.3" />

      {/* ================= ITEMS INSIDE THE CART ================= */}
      {/* 1. Soda / Drink Can (Orange) */}
      <g id="drink-can">
        <ellipse cx="30" cy="37" rx="4.5" ry="1.8" fill="#FCD34D" />
        <path
          d="M25.5 37V49C25.5 50.5 27.5 51.5 30 51.5C32.5 51.5 34.5 50.5 34.5 49V37Z"
          fill="#FB923C"
        />
        <path d="M25.5 41H34.5V45H25.5Z" fill="#F97316" />
        {/* Can Tab */}
        <ellipse cx="30" cy="37" rx="1.8" ry="0.8" fill="#FFFFFF" fillOpacity="0.8" />
      </g>

      {/* 2. Beverage Bottle (Teal Glass with Gold Cap) */}
      <g id="beverage-bottle">
        {/* Cap */}
        <rect x="36" y="21" width="8" height="4.5" rx="1.2" fill="#F59E0B" />
        {/* Neck */}
        <rect x="37.5" y="25" width="5" height="7" rx="1" fill="#0D9488" />
        {/* Body */}
        <path
          d="M34 32C34 30.5 36 29.5 38 29.5H42C44 29.5 46 30.5 46 32L47 53H33L34 32Z"
          fill="#14B8A6"
        />
        {/* Bottle Shine Reflection */}
        <path
          d="M36 33L35.2 49"
          stroke="#CCFBF1"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Bottle Label */}
        <rect x="34.5" y="38" width="11" height="7" rx="1" fill="#FFFFFF" />
        <line
          x1="36.5"
          y1="41.5"
          x2="43.5"
          y2="41.5"
          stroke="#0D9488"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>

      {/* 3. Cardboard Pre-Order Parcel (Kraft Box) */}
      <g id="parcel-box">
        {/* Top Face */}
        <polygon points="56,27 68,32 59,37 47,32" fill="#FDE68A" />
        {/* Left Face */}
        <polygon points="47,32 59,37 59,53 47,48" fill="#F59E0B" />
        {/* Right Face */}
        <polygon points="59,37 68,32 68,48 59,53" fill="#D97706" />
        {/* Sealing Tape */}
        <polygon points="55,28.5 59,30.5 58,34 54,32" fill="#800020" />
        {/* Quality Seal Stamp */}
        <circle cx="53" cy="42.5" r="3" fill="#FFFFFF" fillOpacity="0.9" />
        <path
          d="M51.5 42.5L52.5 43.5L54.5 41.5"
          stroke="#D97706"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ================= SHOPPING CART STRUCTURE ================= */}
      {/* Handle Grip & Stem */}
      <rect x="14" y="26" width="9" height="5" rx="2.5" fill="#800020" />
      <rect x="15.5" y="27.5" width="6" height="2" rx="1" fill="#E11D48" />
      <path
        d="M20 29L27 43"
        stroke="#475569"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Lower Chassis Frame */}
      <path
        d="M27 43L32 68H71"
        stroke="#334155"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Storage Tray Bar */}
      <line
        x1="38"
        y1="65"
        x2="68"
        y2="65"
        stroke="#94A3B8"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Basket Main Body (U.B.R. Brand Burgundy) */}
      <path
        d="M27 37H78C80 37 81.2 38.5 80.5 40.5L73.5 59C72.8 60.8 71 62 69 62H35C33 62 31.2 60.8 30.5 59L26 39C25.5 37.8 26 37 27 37Z"
        fill="#800020"
      />
      {/* Basket Inner Face */}
      <path
        d="M29 40H75.5L69.5 58.5C69 59.5 68 60.2 66.8 60.2H36.2C35 60.2 34 59.5 33.5 58.5L29 40Z"
        fill="#9F1239"
      />

      {/* Mesh / Grid Lines on Basket (Crisp Rose Accents) */}
      <path
        d="M30 45H73"
        stroke="#FECDD3"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      <path
        d="M32 51H69"
        stroke="#FECDD3"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      <path
        d="M34 56.5H65"
        stroke="#FECDD3"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />

      {/* Vertical Slats */}
      <line
        x1="41"
        y1="40"
        x2="42"
        y2="60"
        stroke="#FECDD3"
        strokeWidth="1.2"
        strokeOpacity="0.75"
      />
      <line
        x1="52"
        y1="40"
        x2="52"
        y2="60"
        stroke="#FECDD3"
        strokeWidth="1.2"
        strokeOpacity="0.75"
      />
      <line
        x1="63"
        y1="40"
        x2="62"
        y2="60"
        stroke="#FECDD3"
        strokeWidth="1.2"
        strokeOpacity="0.75"
      />

      {/* Top Rim Gloss Highlight */}
      <path
        d="M28 38.5H77"
        stroke="#FDA4AF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />

      {/* ================= WHEELS ================= */}
      {/* Back Wheel */}
      <path d="M35 68V72" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="35" cy="74" r="5.5" fill="#1E293B" />
      <circle cx="35" cy="74" r="3.2" fill="#E2E8F0" />
      <circle cx="35" cy="74" r="1.5" fill="#800020" />

      {/* Front Wheel */}
      <path d="M67 68V72" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="67" cy="74" r="5.5" fill="#1E293B" />
      <circle cx="67" cy="74" r="3.2" fill="#E2E8F0" />
      <circle cx="67" cy="74" r="1.5" fill="#800020" />
    </svg>
  );
}

export default CartIllustration;
