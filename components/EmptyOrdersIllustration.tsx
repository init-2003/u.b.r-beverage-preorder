import React from 'react';

interface EmptyOrdersIllustrationProps {
  className?: string;
  size?: number;
}

/**
 * Animated Illustration for Empty Orders History ("ยังไม่มีประวัติการสั่งจองสินค้า")
 * Features a honey-wood clipboard floating smoothly, a mint pencil gently wiggling/writing,
 * sparkling stars, and rising pastel bubbles.
 */
export function EmptyOrdersIllustration({
  className = 'w-36 h-36',
  size,
}: EmptyOrdersIllustrationProps) {
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
          @keyframes emptyOrdersFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          @keyframes pencilWiggle {
            0%, 100% { transform: translate(112px, 122px) rotate(-45deg); }
            35% { transform: translate(111px, 120px) rotate(-43deg); }
            70% { transform: translate(113px, 123px) rotate(-47deg); }
          }
          @keyframes sparkleTwinkle {
            0%, 100% { transform: scale(1); opacity: 0.85; }
            50% { transform: scale(1.25); opacity: 1; }
          }
          @keyframes bubbleRise {
            0%, 100% { transform: translateY(0px); opacity: 0.7; }
            50% { transform: translateY(-3px); opacity: 1; }
          }
          .empty-orders-group {
            animation: emptyOrdersFloat 3.2s ease-in-out infinite;
            transform-origin: center center;
          }
          .pencil-group {
            animation: pencilWiggle 2.6s ease-in-out infinite;
            transform-origin: 0px 0px;
          }
          .orders-sparkle-1 {
            animation: sparkleTwinkle 2.2s ease-in-out infinite;
            transform-origin: 142px 64px;
          }
          .orders-sparkle-2 {
            animation: sparkleTwinkle 2.8s ease-in-out infinite 0.7s;
            transform-origin: 58px 84px;
          }
          .orders-bubble {
            animation: bubbleRise 3s ease-in-out infinite;
          }
        `}</style>

        {/* 1. Background Soft Pastel Periwinkle/Slate Circle */}
        <circle cx="100" cy="106" r="54" fill="#EBF0F5" />

        {/* 2. Floating Decorative Pastel Dots & Bubbles */}
        {/* Top-left mint dot */}
        <circle cx="75" cy="54" r="6.5" fill="#B4DDD6" />
        {/* Left orange dot */}
        <circle cx="60" cy="68" r="5" fill="#F49542" />
        {/* Lower-left light blue bubble */}
        <circle cx="66" cy="82" r="3" fill="#CBE3EB" className="orders-bubble" />
        {/* Right pale peach dot */}
        <circle cx="138" cy="74" r="3.5" fill="#FBD8AC" />
        {/* Far-right soft rose dot */}
        <circle cx="146" cy="90" r="3.5" fill="#FDA4AF" />

        {/* 3. Main Clipboard Group */}
        <g className="empty-orders-group">
          {/* Ground Soft Oval Shadow */}
          <ellipse cx="100" cy="146" rx="38" ry="6" fill="#CBD5E1" fillOpacity="0.45" />

          {/* Clipboard Board (Warm Honey Wood / Kraft Tone) */}
          <rect
            x="72"
            y="62"
            width="60"
            height="80"
            rx="8"
            fill="#E4BD70"
          />
          {/* Subtle bottom rim shadow on board */}
          <path
            d="M72 134 C72 138.4 75.6 142 80 142 H124 C128.4 142 132 138.4 132 134 V132 H72 V134 Z"
            fill="#D6AA59"
          />

          {/* Clipboard Clip Loop / Arch */}
          <path
            d="M93 62 V55 C93 50.5 97 47 102 47 C107 47 111 50.5 111 55 V62"
            stroke="#59B9AD"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Hanging hole in top arch */}
          <circle cx="102" cy="53" r="2.5" fill="#EBF0F5" />

          {/* Clipboard Main Clamp (Teal / Mint) */}
          <rect
            x="77"
            y="60"
            width="50"
            height="13"
            rx="4.5"
            fill="#59B9AD"
          />
          {/* Clip subtle inner shadow/groove */}
          <rect
            x="88"
            y="64"
            width="28"
            height="5"
            rx="2"
            fill="#49A499"
          />

          {/* White Paper Sheet */}
          <rect
            x="76"
            y="71"
            width="52"
            height="64"
            rx="3"
            fill="#FFFFFF"
          />

          {/* Paper Checklist Item 1 */}
          <rect x="81" y="80" width="8" height="8" rx="1.5" fill="#E2E8F0" />
          <rect x="92" y="82" width="28" height="4" rx="2" fill="#CBD5E1" />

          {/* Paper Checklist Item 2 */}
          <rect x="81" y="93" width="8" height="8" rx="1.5" fill="#E2E8F0" />
          <rect x="92" y="95" width="31" height="4" rx="2" fill="#CBD5E1" />

          {/* Paper Checklist Item 3 */}
          <rect x="81" y="106" width="8" height="8" rx="1.5" fill="#E2E8F0" />
          <rect x="92" y="108" width="20" height="4" rx="2" fill="#E2E8F0" />

          {/* 4. Tilted Pencil with Gentle Wiggle / Writing Motion */}
          <g className="pencil-group">
            {/* Pencil Tip / Lead Point (Graphite) */}
            <polygon points="0,-18 -2.5,-13 2.5,-13" fill="#475569" />
            {/* Sharpened Wood Collar */}
            <polygon points="-4,-7 4,-7 2.5,-13 -2.5,-13" fill="#F8E0BC" />
            {/* Teal Pencil Barrel */}
            <rect x="-4" y="-7" width="8" height="24" rx="0.5" fill="#59B9AD" />
            {/* Ferrule / Silver Band */}
            <rect x="-4" y="17" width="8" height="3" fill="#E2E8F0" />
            {/* Eraser (Peach / Orange) */}
            <rect x="-4" y="20" width="8" height="6" rx="2.5" fill="#F49542" />
          </g>
        </g>

        {/* 5. Twinkling Sparkle Stars */}
        <g className="orders-sparkle-1">
          <path
            d="M 142 58 L 143.2 60.8 L 146 62 L 143.2 63.2 L 142 66 L 140.8 63.2 L 138 62 L 140.8 60.8 Z"
            fill="#F59E0B"
          />
        </g>
        <g className="orders-sparkle-2">
          <path
            d="M 58 80 L 59 82.5 L 61.5 83.5 L 59 84.5 L 58 87 L 57 84.5 L 54.5 83.5 L 57 82.5 Z"
            fill="#59B9AD"
          />
        </g>
      </svg>
    </div>
  );
}

export default EmptyOrdersIllustration;
