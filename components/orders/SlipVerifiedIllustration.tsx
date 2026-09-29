import React from 'react';

interface SlipVerifiedIllustrationProps {
  className?: string;
  size?: number;
}

export function SlipVerifiedIllustration({
  className = 'w-12 h-12',
  size,
}: SlipVerifiedIllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Aura Circle (Emerald / Mint) */}
      <circle cx="50" cy="50" r="46" fill="#ECFDF5" />
      <circle cx="50" cy="50" r="39" fill="#D1FAE5" fillOpacity="0.7" />

      {/* Floating Sparkles & Decorative Elements */}
      <circle cx="83" cy="22" r="2.5" fill="#10B981" fillOpacity="0.8" />
      <circle cx="17" cy="40" r="2" fill="#6EE7B7" />
      {/* Golden Sparkle (Top-Left) */}
      <path
        d="M21 27L23 31L27 33L23 35L21 39L19 35L15 33L19 31L21 27Z"
        fill="#F59E0B"
      />
      {/* Emerald Sparkle (Top-Right) */}
      <path
        d="M77 18L78.5 21L81.5 22.5L78.5 24L77 27L75.5 24L72.5 22.5L75.5 21Z"
        fill="#059669"
      />
      <circle cx="81" cy="74" r="1.8" fill="#A7F3D0" />

      {/* Ground Soft Oval Shadow */}
      <ellipse cx="48" cy="80" rx="28" ry="4.5" fill="#94A3B8" fillOpacity="0.28" />

      {/* ================= SECONDARY STACKED RECEIPT (BEHIND) ================= */}
      <rect
        x="23"
        y="21"
        width="38"
        height="53"
        rx="4"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        strokeWidth="0.6"
      />

      {/* ================= MAIN BANK SLIP / E-RECEIPT ================= */}
      <g id="slip-document">
        {/* White Slip Body */}
        <rect
          x="26"
          y="17"
          width="38"
          height="57"
          rx="4"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />

        {/* Top Emerald Header Bar */}
        <path
          d="M26 21C26 18.8 27.8 17 30 17H60C62.2 17 64 18.8 64 21V26H26V21Z"
          fill="#059669"
        />
        {/* Bank Emblem / White dot */}
        <circle cx="31.5" cy="21.5" r="1.5" fill="#FFFFFF" fillOpacity="0.95" />
        {/* Slip Title line */}
        <rect x="35" y="20.5" width="16" height="2" rx="1" fill="#FFFFFF" fillOpacity="0.85" />

        {/* Slip Amount Highlight Box */}
        <rect
          x="30"
          y="29"
          width="30"
          height="9"
          rx="2"
          fill="#F0FDF4"
          stroke="#86EFAC"
          strokeWidth="0.8"
        />
        {/* Baht Sign */}
        <text
          x="33.5"
          y="35.8"
          fill="#047857"
          fontWeight="bold"
          fontSize="6"
          fontFamily="Prompt, sans-serif"
        >
          ฿
        </text>
        {/* Amount Value bar */}
        <rect x="39" y="32.5" width="17" height="3" rx="1" fill="#059669" />

        {/* Detail Lines (Account / Reference / Date) */}
        <rect x="30" y="41.5" width="22" height="2" rx="1" fill="#94A3B8" fillOpacity="0.75" />
        <rect x="30" y="45.5" width="28" height="2" rx="1" fill="#CBD5E1" />
        <rect x="30" y="49.5" width="18" height="2" rx="1" fill="#E2E8F0" />

        {/* Mini QR Code on Slip */}
        <rect
          x="30"
          y="54.5"
          width="15"
          height="15"
          rx="1.5"
          fill="#F8FAFC"
          stroke="#E2E8F0"
          strokeWidth="0.6"
        />
        {/* QR Finder patterns */}
        <rect x="32" y="56.5" width="3.5" height="3.5" rx="0.5" fill="#059669" />
        <rect x="39.5" y="56.5" width="3.5" height="3.5" rx="0.5" fill="#059669" />
        <rect x="32" y="64" width="3.5" height="3.5" rx="0.5" fill="#059669" />
        {/* QR modules */}
        <rect x="37.5" y="61.5" width="2" height="2" fill="#059669" />
        <rect x="40" y="64" width="2.5" height="2" fill="#059669" />
      </g>

      {/* ================= VERIFIED BADGE & SEAL ================= */}
      <g id="verified-seal">
        {/* Ribbon tails below seal */}
        <path d="M59 66L56 76L61 73.5L65 76L64 67" fill="#F59E0B" />
        <path d="M73 66L76 76L71 73.5L67 76L68 67" fill="#D97706" />

        {/* Soft Aura Ring around badge */}
        <circle cx="66" cy="56" r="14.5" fill="#D1FAE5" fillOpacity="0.85" />

        {/* Outer Emerald Badge */}
        <circle cx="66" cy="56" r="12" fill="#059669" />
        {/* Inner Bright Mint Ring */}
        <circle cx="66" cy="56" r="10.5" fill="#10B981" />
        {/* Fine Inner Circle Line */}
        <circle
          cx="66"
          cy="56"
          r="9"
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Verified Bold Checkmark */}
        <path
          d="M61.5 56L64.5 59.2L70.5 52.8"
          stroke="#FFFFFF"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default SlipVerifiedIllustration;
