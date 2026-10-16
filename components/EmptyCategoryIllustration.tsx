import React from 'react';

interface EmptyCategoryIllustrationProps {
  className?: string;
  size?: number;
}

/**
 * Dedicated Illustration for Empty Categories ("ยังไม่มีสินค้าในหมวดหมู่นี้")
 * Features an isometric product parcel box with a clean, friendly red cross mark (กากบาท) badge,
 * pastel background circle, and subtle floating animation.
 */
export function EmptyCategoryIllustration({
  className = 'w-36 h-36',
  size,
}: EmptyCategoryIllustrationProps) {
  return (
    <div className="relative flex items-center justify-center select-none pointer-events-none">
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
        aria-hidden="true"
      >
        <defs>
          {/* Linear gradient for red cross badge */}
          <linearGradient id="crossBadgeGrad" x1="108" y1="102" x2="132" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>
          {/* Subtle badge inner glow */}
          <linearGradient id="crossHighlightGrad" x1="110" y1="104" x2="130" y2="124" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes emptyCategoryBoxFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          @keyframes crossBadgePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes sparkleTwinkle {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50% { transform: scale(1.25); opacity: 1; }
          }
          .empty-category-box-group {
            animation: emptyCategoryBoxFloat 3.2s ease-in-out infinite;
            transform-origin: center center;
          }
          .cross-badge-group {
            animation: crossBadgePulse 2.8s ease-in-out infinite;
            transform-origin: 121px 116px;
          }
          .category-sparkle {
            animation: sparkleTwinkle 2.2s ease-in-out infinite;
            transform-origin: 140px 96px;
          }
        `}</style>

        {/* 1. Background Soft Pastel Periwinkle/Slate Circle */}
        <circle cx="100" cy="106" r="54" fill="#EBF0F5" />

        {/* 2. Floating Decorative Pastel Dots */}
        {/* Top-left mint dot */}
        <circle cx="68" cy="48" r="6.5" fill="#C1E5DF" />
        {/* Left warm amber/orange dot */}
        <circle cx="56" cy="62" r="5" fill="#F49542" />
        {/* Lower-left soft blue bubble */}
        <circle cx="61" cy="74" r="3" fill="#C9DFE6" />
        {/* Right pale peach dot */}
        <circle cx="140" cy="74" r="3.5" fill="#FBD8AC" />
        {/* Far-right soft rose dot */}
        <circle cx="147" cy="88" r="4" fill="#FDA4AF" />

        {/* 3. Main Floating Group: Product Box + Cross Mark Badge */}
        <g className="empty-category-box-group">
          {/* Ground Shadow Underneath Box */}
          <ellipse cx="100" cy="144" rx="42" ry="7" fill="#CBD5E1" fillOpacity="0.45" />

          {/* Isometric Delivery Parcel / Cardboard Product Box */}
          {/* Top Face (Light Kraft Tone) */}
          <polygon
            points="100,70 130,87 100,104 70,87"
            fill="#F6D38B"
          />

          {/* Diagonal Teal Packing Tape Across Top Face */}
          <polygon
            points="82,80 88,76.5 118,94 112,97.5"
            fill="#59B9AD"
          />
          {/* Tape Flap Folding Down on Left Face */}
          <polygon
            points="82,80 88,76.5 88,84 82,87.5"
            fill="#49A499"
          />

          {/* Left Face of Box (Medium Kraft Shadow) */}
          <polygon
            points="70,87 100,104 100,140 70,123"
            fill="#E4BD70"
          />

          {/* Right Face of Box (Deeper Kraft Shadow) */}
          <polygon
            points="100,104 130,87 130,123 100,140"
            fill="#D2A756"
          />

          {/* White Shipping Label / Barcode Sticker on Left Face */}
          <polygon
            points="75,98 92,107.5 92,123 75,113.5"
            fill="#FFFFFF"
          />
          {/* Lines on Shipping Label */}
          <line x1="78" y1="103" x2="89" y2="109.5" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="78" y1="108" x2="89" y2="114.5" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="78" y1="113" x2="85" y2="117" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />

          {/* Up Arrows (Fragile / This Way Up) on Right Face */}
          <path
            d="M107 122 V115 M107 115 L104 118 M107 115 L110 118"
            stroke="#A57B30"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 4. Cross Mark Badge (กากบาท) Resting at Front-Right of Box */}
          <g className="cross-badge-group">
            {/* Soft Shadow behind Cross Badge */}
            <ellipse cx="121" cy="133" rx="14" ry="4" fill="#64748B" fillOpacity="0.25" />

            {/* Crisp White Outer Border Ring */}
            <circle cx="121" cy="116" r="18.5" fill="#FFFFFF" />

            {/* Vibrant Rose/Red Circular Badge Body */}
            <circle cx="121" cy="116" r="16" fill="url(#crossBadgeGrad)" />

            {/* Top Gloss Highlight Arc */}
            <path
              d="M 111 112 A 11 11 0 0 1 127 106"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeOpacity="0.6"
              fill="none"
            />

            {/* Bold Crisp White Cross Mark (กากบาท ✕) */}
            {/* Diagonal Stroke 1: Top-Left to Bottom-Right */}
            <line
              x1="114"
              y1="109"
              x2="128"
              y2="123"
              stroke="#FFFFFF"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            {/* Diagonal Stroke 2: Top-Right to Bottom-Left */}
            <line
              x1="128"
              y1="109"
              x2="114"
              y2="123"
              stroke="#FFFFFF"
              strokeWidth="3.6"
              strokeLinecap="round"
            />

            {/* Center Subtle Dot / Accent inside Cross for Extra Crispness */}
            <circle cx="121" cy="116" r="1.2" fill="#BE123C" fillOpacity="0.3" />
          </g>
        </g>

        {/* 5. Twinkling Sparkle Star near the badge */}
        <g className="category-sparkle">
          <path
            d="M 141 93 L 142.2 95.8 L 145 97 L 142.2 98.2 L 141 101 L 139.8 98.2 L 137 97 L 139.8 95.8 Z"
            fill="#F43F5E"
          />
        </g>
      </svg>
    </div>
  );
}

export default EmptyCategoryIllustration;
