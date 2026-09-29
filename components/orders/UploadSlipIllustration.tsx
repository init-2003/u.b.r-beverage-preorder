import React from 'react';

interface UploadSlipIllustrationProps {
  className?: string;
  size?: number;
}

export function UploadSlipIllustration({
  className = 'w-12 h-12',
  size,
}: UploadSlipIllustrationProps) {
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
      <circle cx="50" cy="50" r="46" fill="#F8FAFC" />
      <circle cx="50" cy="50" r="38" fill="#F1F5F9" fillOpacity="0.85" />

      {/* Ground Soft Oval Shadow */}
      <ellipse cx="50" cy="80" rx="26" ry="4" fill="#94A3B8" fillOpacity="0.25" />

      {/* Floating Accent Dots / Sparkles */}
      <circle cx="78" cy="28" r="2.2" fill="#3B82F6" fillOpacity="0.75" />
      <circle cx="21" cy="42" r="1.8" fill="#F59E0B" fillOpacity="0.8" />
      <path
        d="M74 46L75.5 49L78.5 50.5L75.5 52L74 55L72.5 52L69.5 50.5L72.5 49Z"
        fill="#60A5FA"
      />
      <circle cx="28" cy="24" r="1.5" fill="#94A3B8" />

      {/* ================= PAYMENT SLIP / RECEIPT CARD ================= */}
      <g id="slip-card">
        {/* Card Body */}
        <rect
          x="30"
          y="18"
          width="36"
          height="50"
          rx="4"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1.2"
        />

        {/* Card Header Stripe (Slate/Blue) */}
        <rect x="35" y="24" width="18" height="3" rx="1.5" fill="#3B82F6" />
        <circle cx="58" cy="25.5" r="1.5" fill="#94A3B8" />

        {/* Receipt Detail Placeholder Lines */}
        <rect x="35" y="32" width="26" height="2" rx="1" fill="#E2E8F0" />
        <rect x="35" y="37" width="20" height="2" rx="1" fill="#E2E8F0" />
        <rect x="35" y="42" width="24" height="2" rx="1" fill="#E2E8F0" />

        {/* Mini QR / Image Box on Receipt */}
        <rect
          x="35"
          y="48"
          width="13"
          height="13"
          rx="2"
          fill="#F8FAFC"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />
        <rect x="37" y="50" width="3" height="3" rx="0.5" fill="#94A3B8" />
        <rect x="43" y="50" width="3" height="3" rx="0.5" fill="#94A3B8" />
        <rect x="37" y="56" width="3" height="3" rx="0.5" fill="#94A3B8" />
      </g>

      {/* ================= UPLOAD BADGE & ARROW ================= */}
      <g id="upload-badge">
        {/* Soft Glow */}
        <circle cx="58" cy="58" r="15" fill="#EFF6FF" fillOpacity="0.9" />

        {/* Outer Circle */}
        <circle cx="58" cy="58" r="13" fill="#2563EB" />
        {/* Inner Circle Highlight */}
        <circle cx="58" cy="58" r="11.5" fill="#3B82F6" />

        {/* Upward Upload Arrow */}
        <path
          d="M58 64V51M53 55L58 50L63 55"
          stroke="#FFFFFF"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default UploadSlipIllustration;
