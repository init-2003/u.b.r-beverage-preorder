import React from 'react';

interface EmptyCartIllustrationProps {
  className?: string;
  size?: number;
}

/**
 * Animated Illustration for Empty Cart ("ไม่มีสินค้าในตะกร้า")
 * Features a warm kraft shopping bag floating gently, a price tag with Thai Baht ฿ swaying softly,
 * pastel bubbles rising, and twinkling sparkles.
 */
export function EmptyCartIllustration({
  className = 'w-36 h-36',
  size,
}: EmptyCartIllustrationProps) {
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
        <style>{`
          @keyframes emptyBagFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          @keyframes tagSway {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-5deg); }
          }
          @keyframes sparkleTwinkle {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50% { transform: scale(1.25); opacity: 1; }
          }
          @keyframes bubbleRise {
            0%, 100% { transform: translateY(0px); opacity: 0.7; }
            50% { transform: translateY(-3px); opacity: 1; }
          }
          .empty-bag-group {
            animation: emptyBagFloat 3.2s ease-in-out infinite;
            transform-origin: center center;
          }
          .empty-tag-group {
            animation: tagSway 2.8s ease-in-out infinite;
            transform-origin: 136px 140px;
          }
          .cart-sparkle-1 {
            animation: sparkleTwinkle 2.2s ease-in-out infinite;
            transform-origin: 142px 64px;
          }
          .cart-sparkle-2 {
            animation: sparkleTwinkle 2.8s ease-in-out infinite 0.7s;
            transform-origin: 58px 84px;
          }
          .cart-bubble {
            animation: bubbleRise 3s ease-in-out infinite;
          }
        `}</style>

        {/* 1. Background Soft Pastel Periwinkle/Slate Circle */}
        <circle cx="100" cy="106" r="54" fill="#EBF0F5" />

        {/* 2. Floating Decorative Pastel Dots & Bubbles */}
        {/* Top-left mint/aqua dot */}
        <circle cx="68" cy="48" r="6.5" fill="#C1E5DF" />
        {/* Left orange dot */}
        <circle cx="56" cy="62" r="5" fill="#F49542" />
        {/* Lower-left light blue bubble */}
        <circle cx="61" cy="74" r="3" fill="#C9DFE6" className="cart-bubble" />
        {/* Right pale peach dot */}
        <circle cx="140" cy="74" r="3.5" fill="#FBD8AC" />
        {/* Far-right soft burgundy accent dot */}
        <circle cx="148" cy="92" r="3" fill="#FDA4AF" />

        {/* 3. Main Shopping Bag & Tag Group */}
        <g className="empty-bag-group">
          {/* Ground Shadow Underneath Bag */}
          <ellipse cx="100" cy="146" rx="38" ry="6" fill="#CBD5E1" fillOpacity="0.45" />

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

          {/* Subtle bottom shadow on bag */}
          <path
            d="M71 138 C71 141.3 73.7 143 78 143 H122 C126.3 143 129 141.3 129 138 V136 H71 V138 Z"
            fill="#F0D57E"
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

          {/* 4. Discount / Currency Tag Swaying Gently */}
          <g className="empty-tag-group">
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

            {/* Tag Hole */}
            <circle cx="134" cy="136" r="2.2" fill="#EBF0F5" stroke="#7FBAB3" strokeWidth="0.8" />

            {/* Thai Baht Symbol (฿) on Tag */}
            <text
              x="120"
              y="139.5"
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fontFamily="system-ui, -apple-system, sans-serif"
              fill="#38746D"
            >
              ฿
            </text>
          </g>
        </g>

        {/* 5. Twinkling Sparkle Stars */}
        <g className="cart-sparkle-1">
          <path
            d="M 142 60 L 143.2 62.8 L 146 64 L 143.2 65.2 L 142 68 L 140.8 65.2 L 138 64 L 140.8 62.8 Z"
            fill="#F59E0B"
          />
        </g>
        <g className="cart-sparkle-2">
          <path
            d="M 58 81 L 59 83.5 L 61.5 84.5 L 59 85.5 L 58 88 L 57 85.5 L 54.5 84.5 L 57 83.5 Z"
            fill="#59B9AD"
          />
        </g>
      </svg>
    </div>
  );
}

export default EmptyCartIllustration;
