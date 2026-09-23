import React from 'react';

interface EmptyCheckoutIllustrationProps {
  className?: string;
  size?: number;
}

export function EmptyCheckoutIllustration({
  className = 'w-36 h-36',
  size,
}: EmptyCheckoutIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Pastel Peach/Apricot Circle */}
      <circle cx="100" cy="106" r="54" fill="#FDE8D7" />

      {/* Floating Decorative Pastel Dots */}
      {/* Top-left mint/aqua dot */}
      <circle cx="68" cy="48" r="6.5" fill="#C1E5DF" />
      {/* Left orange dot */}
      <circle cx="56" cy="62" r="5" fill="#F49542" />
      {/* Lower-left light blue dot */}
      <circle cx="61" cy="74" r="3" fill="#C9DFE6" />
      {/* Right pale peach dot */}
      <circle cx="140" cy="74" r="3.5" fill="#FBD8AC" />

      {/* Checkout Order Receipt Bill Emerging from the Bag */}
      <g transform="rotate(-6 100 78)">
        {/* White Receipt Sheet */}
        <rect
          x="78"
          y="50"
          width="44"
          height="46"
          rx="3"
          fill="#FFFFFF"
        />
        {/* Receipt Top Header Strip (Teal / Mint) */}
        <rect
          x="78"
          y="50"
          width="44"
          height="8"
          rx="2"
          fill="#59B9AD"
        />
        {/* Receipt Checklist/Item Lines */}
        <line x1="84" y1="65" x2="114" y2="65" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="84" y1="71" x2="108" y2="71" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="84" y1="77" x2="114" y2="77" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <line x1="84" y1="83" x2="102" y2="83" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        {/* Serrated / Zigzag Bottom Cut on Receipt */}
        <path
          d="M78 96 L82 93 L86 96 L90 93 L94 96 L98 93 L102 96 L106 93 L110 96 L114 93 L118 96 L122 93"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Checkmark Badge on Top Right of Receipt */}
        <circle cx="120" cy="50" r="6" fill="#48B3A7" />
        <path
          d="M117 50 L119 52 L123 48"
          stroke="#FFFFFF"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Shopping Bag (Warm Sunny Kraft Tone) */}
      {/* Inner Bag Opening Shadow */}
      <polygon
        points="68,80 74,76 126,76 132,80 128,84 72,84"
        fill="#E5C365"
      />

      {/* Bag Main Front Body */}
      <path
        d="M68 82 H132 V136 C132 140.4 128.4 144 124 144 H76 C71.6 144 68 140.4 68 136 V82 Z"
        fill="#FDE79F"
      />

      {/* Subtle bottom shadow on bag */}
      <path
        d="M68 138 C68 141.3 70.7 144 74 144 H126 C129.3 144 132 141.3 132 138 V136 H68 V138 Z"
        fill="#F0D57E"
      />

      {/* Rope Handle Grommets */}
      <circle cx="82" cy="100" r="2.8" fill="#6A4925" />
      <circle cx="118" cy="100" r="2.8" fill="#6A4925" />

      {/* Smile Rope Handle */}
      <path
        d="M82 100 C82 126, 118 126, 118 100"
        stroke="#8F6B40"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Golden Currency Coin (฿) Overlapping Bottom Right */}
      <circle cx="132" cy="132" r="14" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
      <circle cx="132" cy="132" r="11" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2.5 1.5" />
      {/* Embossed ฿ Symbol */}
      <text
        x="132"
        y="137"
        textAnchor="middle"
        fontSize="13"
        fontWeight="bold"
        fontFamily="sans-serif"
        fill="#92400E"
      >
        ฿
      </text>
    </svg>
  );
}
