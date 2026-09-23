import React from 'react';

interface EmptyOrdersIllustrationProps {
  className?: string;
  size?: number;
}

export function EmptyOrdersIllustration({
  className = 'w-36 h-36',
  size,
}: EmptyOrdersIllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Background soft circular badge */}
      <circle cx="100" cy="106" r="54" fill="#EBF0F4" />

      {/* Floating decorative pastel dots */}
      {/* Top-left mint/teal dot */}
      <circle cx="75" cy="56" r="6.5" fill="#B4DDD6" />
      {/* Left orange dot */}
      <circle cx="63" cy="71" r="5" fill="#F49542" />
      {/* Lower-left light blue dot */}
      <circle cx="69" cy="85" r="3" fill="#CBE3EB" />
      {/* Right pale peach dot */}
      <circle cx="135" cy="76" r="3.5" fill="#FBD8AC" />

      {/* Clipboard Board (Warm honey wood / kraft tone) */}
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
      <circle cx="102" cy="53" r="2.5" fill="#EBF0F4" />

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
      <rect x="92" y="82" width="28" height="4" rx="2" fill="#E2E8F0" />

      {/* Paper Checklist Item 2 */}
      <rect x="81" y="93" width="8" height="8" rx="1.5" fill="#E2E8F0" />
      <rect x="92" y="95" width="31" height="4" rx="2" fill="#E2E8F0" />

      {/* Paper Checklist Item 3 */}
      <rect x="81" y="106" width="8" height="8" rx="1.5" fill="#E2E8F0" />
      <rect x="92" y="108" width="20" height="4" rx="2" fill="#E2E8F0" />

      {/* Tilted Pencil Writing on the Checklist */}
      {/* Pencil positioned at bottom-right, tilted at -45 degrees */}
      <g transform="translate(112, 122) rotate(-45)">
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
    </svg>
  );
}
