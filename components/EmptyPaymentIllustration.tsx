import React from 'react';

interface EmptyPaymentIllustrationProps {
  className?: string;
  size?: number;
}

export function EmptyPaymentIllustration({
  className = 'w-36 h-36',
  size,
}: EmptyPaymentIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Pastel Circle Badge */}
      <circle cx="100" cy="106" r="54" fill="#F1F5F9" />

      {/* Floating Decorative Pastel Dots & Sparkles */}
      <circle cx="68" cy="52" r="6" fill="#C1E5DF" />
      <circle cx="58" cy="70" r="4.5" fill="#F49542" />
      <circle cx="64" cy="86" r="3" fill="#C9DFE6" />
      <circle cx="144" cy="68" r="3.5" fill="#FBD8AC" />
      {/* Gold 4-point sparkle */}
      <path
        d="M142 46 L144 51 L149 53 L144 55 L142 60 L140 55 L135 53 L140 51 Z"
        fill="#F59E0B"
      />

      {/* Ground Soft Oval Shadow */}
      <ellipse cx="100" cy="148" rx="42" ry="6" fill="#CBD5E1" fillOpacity="0.45" />

      {/* ================= PAYMENT RECEIPT BILL (Back Layer) ================= */}
      <g transform="rotate(-7 96 95)">
        {/* Receipt Shadow */}
        <rect x="74" y="48" width="52" height="74" rx="4" fill="#E2E8F0" />
        {/* Receipt Body */}
        <rect x="72" y="46" width="52" height="74" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        {/* Receipt Header Strip (Teal / Mint) */}
        <rect x="72" y="46" width="52" height="12" rx="3" fill="#59B9AD" />
        {/* Checkmark in circle badge on header */}
        <circle cx="98" cy="52" r="4.5" fill="#FFFFFF" fillOpacity="0.3" />
        <path d="M96 52 L97.5 53.5 L100.5 50.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Text lines / dotted lines on receipt */}
        <line x1="78" y1="66" x2="118" y2="66" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="78" y1="73" x2="108" y2="73" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="78" y1="80" x2="114" y2="80" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="78" y1="88" x2="118" y2="88" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="78" y1="96" x2="98" y2="96" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="106" y1="96" x2="118" y2="96" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Zigzag bottom cut */}
        <path
          d="M72 120 L76 116 L80 120 L84 116 L88 120 L92 116 L96 120 L100 116 L104 120 L108 116 L112 120 L116 116 L120 120 L124 116"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* ================= CREDIT / PAYMENT CARD (Front Layer) ================= */}
      <g transform="rotate(8 108 108)">
        {/* Card Shadow */}
        <rect x="76" y="82" width="68" height="44" rx="6" fill="#000000" fillOpacity="0.08" />
        {/* Card Body - UBR Burgundy Brand Tone */}
        <rect x="74" y="80" width="68" height="44" rx="6" fill="#800020" />
        {/* Gloss Gradient Arc / Highlight */}
        <path
          d="M74 86 C86 86 112 94 122 108 L142 98 V86 C142 82.7 139.3 80 136 80 H80 C76.7 80 74 82.7 74 86 Z"
          fill="#FFFFFF"
          fillOpacity="0.12"
        />
        {/* EMV Gold Chip */}
        <rect x="82" y="94" width="11" height="9" rx="2" fill="#FCD34D" stroke="#D97706" strokeWidth="0.8" />
        <line x1="82" y1="98.5" x2="93" y2="98.5" stroke="#B45309" strokeWidth="0.6" />
        <line x1="87.5" y1="94" x2="87.5" y2="103" stroke="#B45309" strokeWidth="0.6" />
        {/* Card Numbers Mock */}
        <circle cx="84" cy="112" r="1" fill="#FFFFFF" fillOpacity="0.75" />
        <circle cx="88" cy="112" r="1" fill="#FFFFFF" fillOpacity="0.75" />
        <circle cx="92" cy="112" r="1" fill="#FFFFFF" fillOpacity="0.75" />
        <circle cx="96" cy="112" r="1" fill="#FFFFFF" fillOpacity="0.75" />
        <circle cx="102" cy="112" r="1" fill="#FFFFFF" fillOpacity="0.75" />
        <circle cx="106" cy="112" r="1" fill="#FFFFFF" fillOpacity="0.75" />
        {/* Contactless Waves */}
        <path d="M98 94 C100 96 100 98 98 100" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
        <path d="M100.5 92.5 C103.5 95.5 103.5 98.5 100.5 101.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
        {/* Card Logo / Dual Circles (Mastercard/Payment Style) */}
        <circle cx="127" cy="112" r="4.5" fill="#EF4444" fillOpacity="0.8" />
        <circle cx="132" cy="112" r="4.5" fill="#F59E0B" fillOpacity="0.8" />
      </g>

      {/* ================= GOLDEN CURRENCY COIN (฿) ================= */}
      <g>
        {/* Coin Drop Shadow */}
        <ellipse cx="68" cy="136" rx="10" ry="3" fill="#000000" fillOpacity="0.1" />
        {/* Coin Outer Base */}
        <circle cx="68" cy="128" r="14" fill="#F59E0B" />
        {/* Coin Rim Face */}
        <circle cx="68" cy="126" r="14" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2" />
        {/* Inner Dashed Ring */}
        <circle cx="68" cy="126" r="11" fill="none" stroke="#F59E0B" strokeWidth="0.9" strokeDasharray="2 1.5" />
        {/* Embossed ฿ Symbol */}
        <text
          x="68"
          y="131"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#92400E"
        >
          ฿
        </text>
      </g>
    </svg>
  );
}

export default EmptyPaymentIllustration;
