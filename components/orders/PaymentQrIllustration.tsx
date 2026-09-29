import React from 'react';

interface PaymentQrIllustrationProps {
  className?: string;
  size?: number;
}

export function PaymentQrIllustration({
  className = 'w-12 h-12',
  size,
}: PaymentQrIllustrationProps) {
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
      <circle cx="50" cy="50" r="46" fill="#FEF2F2" />
      <circle cx="50" cy="50" r="39" fill="#FEE2E2" fillOpacity="0.65" />

      {/* Floating Sparkles & Decorative Elements */}
      <circle cx="83" cy="22" r="2.5" fill="#EF4444" fillOpacity="0.75" />
      <circle cx="17" cy="38" r="2" fill="#FCA5A5" />
      <path
        d="M21 27L23 31L27 33L23 35L21 39L19 35L15 33L19 31L21 27Z"
        fill="#F59E0B"
      />
      <circle cx="81" cy="74" r="1.5" fill="#93C5FD" />

      {/* Ground Soft Oval Shadow */}
      <ellipse cx="48" cy="79" rx="28" ry="4.5" fill="#94A3B8" fillOpacity="0.3" />

      {/* ================= SMARTPHONE WITH QR CODE ================= */}
      <g id="phone-qr">
        {/* Phone Outer Chassis (Dark Slate) */}
        <rect
          x="28"
          y="18"
          width="40"
          height="58"
          rx="7"
          fill="#1E293B"
        />
        {/* Phone Gloss Highlight on Corner */}
        <path
          d="M32 18H62C65.5 18 68 20.5 68 24V28L32 18Z"
          fill="#334155"
        />
        {/* Phone Screen (White) */}
        <rect
          x="30.5"
          y="22.5"
          width="35"
          height="49"
          rx="4"
          fill="#FFFFFF"
        />

        {/* Top Speaker Ear-piece Notch */}
        <rect
          x="43"
          y="20"
          width="10"
          height="1.5"
          rx="0.75"
          fill="#64748B"
        />

        {/* Top Screen App Bar / Brand Header */}
        <rect
          x="30.5"
          y="22.5"
          width="35"
          height="6"
          rx="3"
          fill="#800020"
        />
        <circle cx="35" cy="25.5" r="1" fill="#FFFFFF" fillOpacity="0.8" />
        <circle cx="38" cy="25.5" r="1" fill="#FFFFFF" fillOpacity="0.8" />

        {/* QR Code Canvas Area */}
        {/* Finder Pattern Top-Left */}
        <rect x="35" y="32" width="10" height="10" rx="1.5" fill="#800020" />
        <rect x="37" y="34" width="6" height="6" rx="0.5" fill="#FFFFFF" />
        <rect x="38.5" y="35.5" width="3" height="3" fill="#800020" />

        {/* Finder Pattern Top-Right */}
        <rect x="51" y="32" width="10" height="10" rx="1.5" fill="#800020" />
        <rect x="53" y="34" width="6" height="6" rx="0.5" fill="#FFFFFF" />
        <rect x="54.5" y="35.5" width="3" height="3" fill="#800020" />

        {/* Finder Pattern Bottom-Left */}
        <rect x="35" y="48" width="10" height="10" rx="1.5" fill="#800020" />
        <rect x="37" y="50" width="6" height="6" rx="0.5" fill="#FFFFFF" />
        <rect x="38.5" y="51.5" width="3" height="3" fill="#800020" />

        {/* QR Code Data Bits (Modules) */}
        <rect x="47" y="33" width="2.5" height="2.5" fill="#800020" />
        <rect x="47" y="38" width="2.5" height="2.5" fill="#800020" />
        <rect x="47" y="44" width="2.5" height="4" fill="#800020" />
        <rect x="52" y="44" width="3" height="2.5" fill="#800020" />
        <rect x="57" y="44" width="4" height="2.5" fill="#800020" />
        <rect x="52" y="49" width="3" height="3" fill="#800020" />
        <rect x="57" y="52" width="4" height="3" fill="#800020" />
        <rect x="52" y="55" width="3" height="2.5" fill="#800020" />
        <rect x="47" y="54" width="2.5" height="3.5" fill="#800020" />

        {/* Red / Amber Scanning Laser Beam */}
        <line
          x1="32"
          y1="43"
          x2="64"
          y2="43"
          stroke="#EF4444"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="48" cy="43" r="2.2" fill="#F87171" fillOpacity="0.8" />

        {/* Phone Bottom Navigation Bar / Pill */}
        <rect
          x="44"
          y="68"
          width="8"
          height="1.5"
          rx="0.75"
          fill="#CBD5E1"
        />
      </g>

      {/* ================= FLOATING GOLD BAHT COIN ================= */}
      <g id="coin-badge" transform="translate(18, 2)">
        {/* Glow halo */}
        <circle cx="56" cy="60" r="10.5" fill="#FEF3C7" fillOpacity="0.6" />
        {/* Outer Coin Ring */}
        <circle cx="56" cy="60" r="9" fill="#F59E0B" />
        {/* Inner Coin Face */}
        <circle cx="56" cy="60" r="7.5" fill="#FBBF24" />
        {/* Embossed Ring */}
        <circle cx="56" cy="60" r="6" stroke="#FEF3C7" strokeWidth="0.8" fill="none" />
        {/* Baht Currency Symbol */}
        <text
          x="56"
          y="63.8"
          textAnchor="middle"
          fill="#B45309"
          fontWeight="900"
          fontSize="9.5"
          fontFamily="Prompt, sans-serif"
        >
          ฿
        </text>
      </g>
    </svg>
  );
}

export default PaymentQrIllustration;
