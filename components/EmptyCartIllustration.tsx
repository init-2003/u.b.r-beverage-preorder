import React from 'react';

interface EmptyCartIllustrationProps {
  className?: string;
  size?: number;
}

export function EmptyCartIllustration({
  className = 'w-36 h-36',
  size,
}: EmptyCartIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Lime-Green / Olive Circle */}
      <circle cx="100" cy="106" r="54" fill="#B4D568" />

      {/* Floating Decorative Pastel Dots */}
      {/* Top-left mint/aqua dot */}
      <circle cx="68" cy="48" r="6.5" fill="#C1E5DF" />
      {/* Left orange dot */}
      <circle cx="56" cy="62" r="5" fill="#F49542" />
      {/* Lower-left light blue dot */}
      <circle cx="61" cy="74" r="3" fill="#C9DFE6" />
      {/* Right pale peach dot */}
      <circle cx="140" cy="74" r="3.5" fill="#FBD8AC" />

      {/* Shopping Bag (Warm Cream / Kraft Tone) */}
      {/* Inner Wall / Top Inside opening shadow */}
      <polygon
        points="71,76 77,72 123,72 129,76 127,81 73,81"
        fill="#E5C365"
      />

      {/* Left Gusset / Top Corner Fold */}
      <polygon points="71,76 77,72 73,81" fill="#F4D784" />
      {/* Right Gusset / Top Corner Fold */}
      <polygon points="129,76 123,72 127,81" fill="#F4D784" />

      {/* Bag Main Front Body */}
      <path
        d="M71 80 H129 V136 C129 140 126 143 122 143 H78 C74 143 71 140 71 136 V80 Z"
        fill="#FDE79F"
      />

      {/* Rope Handle Grommets (Holes) on the Bag Face */}
      <circle cx="83" cy="99" r="2.8" fill="#6A4925" />
      <circle cx="117" cy="99" r="2.8" fill="#6A4925" />

      {/* Smile Rope Handle Hanging Down */}
      <path
        d="M83 99 C83 126, 117 126, 117 99"
        stroke="#8F6B40"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Discount / Price Tag Overlapping Bottom Right of Bag */}
      {/* Tag Hanging String */}
      <path
        d="M136 140 C144 145, 155 153, 150 156 C144 159, 137 148, 136 140 Z"
        stroke="#8F6B40"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Tag Body (Pale Mint / Aqua) */}
      <path
        d="M110 126 H131 L142 136 L131 146 H110 C108.5 146 107.5 145 107.5 143.5 V128.5 C107.5 127 108.5 126 110 126 Z"
        fill="#A6D5CF"
      />

      {/* Tag Inner Dashed Border */}
      <path
        d="M111.5 128.5 H129.5 L138.5 136 L129.5 143.5 H111.5 C110.5 143.5 110 143 110 142 V130 C110 129 110.5 128.5 111.5 128.5 Z"
        stroke="#7FBAB3"
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
        fill="none"
      />

      {/* Tag Hole (Showing background circle color) */}
      <circle cx="134" cy="136" r="2.2" fill="#B4D568" stroke="#7FBAB3" strokeWidth="0.8" />

      {/* Dollar Sign $ on Tag */}
      <text
        x="120"
        y="139.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fontFamily="sans-serif"
        fill="#669D96"
      >
        $
      </text>
    </svg>
  );
}
