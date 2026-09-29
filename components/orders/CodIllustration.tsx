import React from 'react';

interface CodIllustrationProps {
  className?: string;
  size?: number;
}

export function CodIllustration({
  className = 'w-12 h-12',
  size,
}: CodIllustrationProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background Soft Aura Circle */}
      <circle cx="50" cy="50" r="46" fill="#EFF6FF" />
      <circle cx="50" cy="50" r="40" fill="#DBEAFE" fillOpacity="0.6" />

      {/* Floating Sparkles / Motion dots */}
      <circle cx="84" cy="24" r="2.5" fill="#3B82F6" fillOpacity="0.7" />
      <circle cx="16" cy="38" r="2" fill="#93C5FD" />
      <path
        d="M20 30L22 34L26 36L22 38L20 42L18 38L14 36L18 34L20 30Z"
        fill="#FBBF24"
      />

      {/* Ground Shadow */}
      <ellipse cx="48" cy="79" rx="34" ry="4.5" fill="#94A3B8" fillOpacity="0.35" />

      {/* Speed lines under truck */}
      <path d="M12 75H22" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 71H28" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />

      {/* ================= DELIVERY TRUCK ================= */}
      <g id="truck">
        {/* Main Cargo Container (Blue) */}
        <rect
          x="22"
          y="36"
          width="36"
          height="32"
          rx="3"
          fill="#2563EB"
        />
        {/* Cargo Box Detail Stripe */}
        <rect
          x="22"
          y="48"
          width="36"
          height="6"
          fill="#1D4ED8"
        />

        {/* Parcel Icon on the Cargo Box */}
        <rect
          x="34"
          y="40"
          width="12"
          height="11"
          rx="1.5"
          fill="#F59E0B"
        />
        {/* Parcel Tape */}
        <line x1="40" y1="40" x2="40" y2="51" stroke="#FEF3C7" strokeWidth="1.5" />
        <line x1="34" y1="45" x2="46" y2="45" stroke="#FEF3C7" strokeWidth="1.5" />

        {/* Front Cabin */}
        <path
          d="M58 44H69C72.5 44 75.5 47 76.5 50.5L78.5 58.5C79 60.5 77.5 62.5 75.5 62.5H58V44Z"
          fill="#1D4ED8"
        />
        {/* Lower Front Bumper Area */}
        <rect
          x="58"
          y="62"
          width="21"
          height="6"
          rx="1"
          fill="#1E293B"
        />

        {/* Windshield */}
        <path
          d="M60 47H68C69.8 47 71.4 48.5 72 50.2L74.2 56H60V47Z"
          fill="#BAE6FD"
        />
        {/* Windshield Reflection */}
        <path
          d="M63 48L69 48L65.5 55L61 55L63 48Z"
          fill="#FFFFFF"
          fillOpacity="0.6"
        />

        {/* Headlight (Yellow Glow) */}
        <path
          d="M78 59H80C80.8 59 81.5 59.7 81.5 60.5C81.5 61.3 80.8 62 80 62H78V59Z"
          fill="#FBBF24"
        />
        {/* Headlight beam */}
        <path
          d="M82 59.5L90 57V64L82 61.5V59.5Z"
          fill="#FEF08A"
          fillOpacity="0.4"
        />

        {/* Front Grille */}
        <line x1="77" y1="64" x2="79" y2="64" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />
        <line x1="77" y1="66" x2="79" y2="66" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />

        {/* Wheel Well Arches (Cutouts) */}
        <path
          d="M27 68C27 63.5 30.5 60 35 60C39.5 60 43 63.5 43 68H27Z"
          fill="#1E3A8A"
        />
        <path
          d="M63 68C63 63.5 66.5 60 71 60C75.5 60 79 63.5 79 68H63Z"
          fill="#1E3A8A"
        />

        {/* Rear Wheel */}
        <circle cx="35" cy="68" r="7.5" fill="#0F172A" />
        <circle cx="35" cy="68" r="4.5" fill="#94A3B8" />
        <circle cx="35" cy="68" r="2" fill="#F8FAFC" />

        {/* Front Wheel */}
        <circle cx="71" cy="68" r="7.5" fill="#0F172A" />
        <circle cx="71" cy="68" r="4.5" fill="#94A3B8" />
        <circle cx="71" cy="68" r="2" fill="#F8FAFC" />
      </g>

      {/* ================= FLOATING COD CASH / COIN BADGE ================= */}
      <g id="cash-badge" transform="translate(14, -6)">
        {/* Gold Coin Backdrop */}
        <circle cx="62" cy="28" r="10" fill="#F59E0B" />
        <circle cx="62" cy="28" r="8.5" fill="#FBBF24" />
        {/* Shiny Edge Highlight */}
        <circle cx="62" cy="28" r="7" stroke="#FEF3C7" strokeWidth="1" fill="none" />
        {/* Baht Currency / Dollar Symbol */}
        <text
          x="62"
          y="32"
          textAnchor="middle"
          fill="#B45309"
          fontWeight="900"
          fontSize="11"
          fontFamily="Prompt, sans-serif"
        >
          ฿
        </text>

        {/* Small COD Label Tag */}
        <rect
          x="44"
          y="18"
          width="20"
          height="8.5"
          rx="2.5"
          fill="#10B981"
        />
        <text
          x="54"
          y="24"
          textAnchor="middle"
          fill="#FFFFFF"
          fontWeight="900"
          fontSize="5.5"
          letterSpacing="0.8"
          fontFamily="Prompt, sans-serif"
        >
          COD
        </text>
      </g>
    </svg>
  );
}

export default CodIllustration;
