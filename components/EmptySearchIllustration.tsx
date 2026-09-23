import React from 'react';

interface EmptySearchIllustrationProps {
  className?: string;
  size?: number;
}

export function EmptySearchIllustration({
  className = 'w-36 h-36',
  size,
}: EmptySearchIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Pastel Periwinkle/Slate Circle */}
      <circle cx="100" cy="106" r="54" fill="#EBF0F5" />

      {/* Floating Decorative Pastel Dots */}
      {/* Top-left mint/aqua dot */}
      <circle cx="68" cy="48" r="6.5" fill="#C1E5DF" />
      {/* Left orange dot */}
      <circle cx="56" cy="62" r="5" fill="#F49542" />
      {/* Lower-left light blue dot */}
      <circle cx="61" cy="74" r="3" fill="#C9DFE6" />
      {/* Right pale peach dot */}
      <circle cx="140" cy="74" r="3.5" fill="#FBD8AC" />

      {/* Isometric Delivery Parcel / Cardboard Box */}
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
        d="M109 119 V112 M109 112 L106 115 M109 112 L112 115"
        stroke="#A57B30"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M117 114.5 V107.5 M117 107.5 L114 110.5 M117 107.5 L120 110.5"
        stroke="#A57B30"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Magnifying Glass (Search Lens) Resting in Front-Right */}
      {/* Handle of Magnifying Glass (Angled 45 deg down-right) */}
      <line
        x1="133"
        y1="129"
        x2="151"
        y2="147"
        stroke="#8F6B40"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Ferrule / Silver Joint Collar */}
      <line
        x1="131"
        y1="127"
        x2="135"
        y2="131"
        stroke="#E2E8F0"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Handle Tip Accent (Orange Eraser/Cap Tone) */}
      <circle cx="151" cy="147" r="2.5" fill="#F49542" />

      {/* Magnifying Glass Lens Frame (Teal / Mint) */}
      <circle
        cx="120"
        cy="116"
        r="17"
        fill="#E0F2FE"
        fillOpacity="0.8"
        stroke="#59B9AD"
        strokeWidth="3.8"
      />

      {/* Glass Gleam / White Reflection Arc */}
      <path
        d="M 110 109 A 12 12 0 0 1 125 105"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sparkle Glint Star Inside Lens */}
      <path
        d="M 124 117 L 125.2 120 L 128 121.2 L 125.2 122.4 L 124 125 L 122.8 122.4 L 120 121.2 L 122.8 120 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
