'use client';

import React from 'react';
import { BouncingDots } from '@/components/loading-ui/bouncing-dots';
import { cn } from '@/lib/utils';

export interface WineLoadingProps {
  /** Text to display below the bouncing dots (optional) */
  text?: string;
  /** Sub-text or explanation (optional) */
  subtext?: string;
  /** Overall size variation */
  size?: 'sm' | 'md' | 'lg';
  /** Additional container classes */
  className?: string;
  /** Custom color class for bouncing dots (defaults to text-[#800020]) */
  dotsColor?: string;
}

export function WineBottleGraphic({
  className = 'w-16 h-28',
}: {
  className?: string;
}) {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        viewBox="0 0 100 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none pointer-events-none"
      >
        <defs>
          {/* Bottle glass gradient - deep burgundy */}
          <linearGradient id="wineBottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a0012" />
            <stop offset="25%" stopColor="#800020" />
            <stop offset="60%" stopColor="#9e1136" />
            <stop offset="85%" stopColor="#800020" />
            <stop offset="100%" stopColor="#4a0012" />
          </linearGradient>

          {/* Liquid inside gradient */}
          <linearGradient id="wineLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a31638" />
            <stop offset="100%" stopColor="#4d0014" />
          </linearGradient>

          {/* Gold capsule/foil gradient */}
          <linearGradient id="wineGoldFoil" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#fef3c7" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          {/* Label gradient */}
          <linearGradient id="wineLabelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fdfbf7" />
          </linearGradient>

          {/* Glass vertical highlight reflection */}
          <linearGradient id="glassSheen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Floating shadow under bottle */}
        <ellipse cx="50" cy="214" rx="28" ry="4.5" fill="#000000" fillOpacity="0.15" />

        {/* Bottle Body & Neck Silhouette */}
        <path
          d="M 44 26 
             L 44 60 
             C 44 80, 20 95, 20 120 
             L 20 200 
             C 20 207, 26 210, 34 210 
             L 66 210 
             C 74 210, 80 207, 80 200 
             L 80 120 
             C 80 95, 56 80, 56 60 
             L 56 26 
             Z"
          fill="url(#wineBottleGrad)"
          stroke="#3d000f"
          strokeWidth="1.5"
        />

        {/* Wine Liquid fill level indicator (inside translucent bottle) */}
        <path
          d="M 22 135 
             C 32 138, 68 132, 78 135 
             L 78 200 
             C 78 206, 73 208, 66 208 
             L 34 208 
             C 27 208, 22 206, 22 200 
             Z"
          fill="url(#wineLiquidGrad)"
          opacity="0.85"
        />

        {/* Bubbles in wine liquid */}
        <circle cx="36" cy="180" r="2" fill="#fca5a5" opacity="0.6">
          <animate attributeName="cy" values="195;140" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.7;0" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="58" cy="170" r="1.5" fill="#fca5a5" opacity="0.5">
          <animate attributeName="cy" values="200;145" dur="1.8s" begin="0.7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0" dur="1.8s" begin="0.7s" repeatCount="indefinite" />
        </circle>
        <circle cx="48" cy="190" r="2.5" fill="#fca5a5" opacity="0.6">
          <animate attributeName="cy" values="202;142" dur="2.6s" begin="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.9;0" dur="2.6s" begin="1.2s" repeatCount="indefinite" />
        </circle>

        {/* Elegant Wine Label */}
        <rect
          x="26"
          y="136"
          width="48"
          height="52"
          rx="2.5"
          fill="url(#wineLabelGrad)"
          stroke="#d4af37"
          strokeWidth="1"
        />
        {/* Label Inner Golden Border */}
        <rect
          x="28.5"
          y="138.5"
          width="43"
          height="47"
          rx="1.5"
          fill="none"
          stroke="#eab308"
          strokeWidth="0.6"
          strokeDasharray="2 1"
          opacity="0.7"
        />
        {/* Label Crest / Grape Emblem */}
        <path
          d="M 50 144 L 53 148 L 50 152 L 47 148 Z"
          fill="#800020"
        />
        <circle cx="48" cy="154" r="1.3" fill="#800020" />
        <circle cx="52" cy="154" r="1.3" fill="#800020" />
        <circle cx="50" cy="156.5" r="1.3" fill="#800020" />
        {/* Label Lines */}
        <rect x="33" y="163" width="34" height="2" rx="1" fill="#800020" opacity="0.85" />
        <rect x="36" y="169" width="28" height="1.2" rx="0.6" fill="#78350f" opacity="0.7" />
        <rect x="40" y="174" width="20" height="1" rx="0.5" fill="#b45309" opacity="0.6" />
        {/* Vintage Year */}
        <text
          x="50"
          y="182"
          fontSize="4.2"
          fontWeight="bold"
          fontFamily="serif"
          textAnchor="middle"
          fill="#800020"
          letterSpacing="0.8"
        >
          PRE-ORDER
        </text>

        {/* Curved Glass Reflection / Sheen on left */}
        <path
          d="M 25 118 
             C 25 98, 44 86, 46 64 
             L 46 28 
             L 49 28 
             L 49 63 
             C 47 84, 29 97, 29 118 
             L 29 198 
             L 25 198 
             Z"
          fill="url(#glassSheen)"
        />

        {/* Subtle Right edge specular highlight */}
        <path
          d="M 75 122 L 75 198 L 77 198 L 77 122 Z"
          fill="#ffffff"
          opacity="0.18"
        />

        {/* Neck Band / Collar Ring */}
        <rect
          x="42"
          y="48"
          width="16"
          height="3"
          rx="1"
          fill="url(#wineGoldFoil)"
          stroke="#92400e"
          strokeWidth="0.5"
        />

        {/* Gold Capsule / Foil Top */}
        <path
          d="M 43.5 12 
             L 56.5 12 
             L 56.5 42 
             L 43.5 42 
             Z"
          fill="url(#wineGoldFoil)"
          stroke="#78350f"
          strokeWidth="0.8"
        />
        {/* Foil Highlight */}
        <rect x="48.5" y="12" width="2.5" height="30" fill="#ffffff" opacity="0.35" />

        {/* Bottle Lip / Cork Top Ring */}
        <ellipse
          cx="50"
          cy="12"
          rx="7.5"
          ry="3"
          fill="url(#wineGoldFoil)"
          stroke="#78350f"
          strokeWidth="0.8"
        />
        <ellipse
          cx="50"
          cy="11.5"
          rx="5"
          ry="1.8"
          fill="#451a03"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

export function WineLoading({
  size = 'md',
  className,
  dotsColor = 'text-[#800020]',
}: WineLoadingProps) {
  // Size-specific adjustments
  const bottleSizes = {
    sm: 'w-12 h-20',
    md: 'w-16 h-28',
    lg: 'w-20 h-36',
  };

  const dotsSizes = {
    sm: 'w-12',
    md: 'w-16',
    lg: 'w-20',
  };

  return (
    <>
      <style>{`
        @keyframes wine-float-anim {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(-1deg);
          }
        }
      `}</style>
      <div
        className={cn(
          'flex flex-col items-center justify-center text-center select-none',
          className
        )}
      >
        {/* Floating Wine Bottle */}
        <div
          style={{
            animation: 'wine-float-anim 2.6s ease-in-out infinite',
          }}
          className="relative transition-transform"
        >
          <WineBottleGraphic className={bottleSizes[size]} />
        </div>

        {/* Bouncing Dots directly under the wine bottle */}
        <div className="mt-2.5 flex items-center justify-center">
          <BouncingDots className={cn(dotsSizes[size], dotsColor)} />
        </div>
      </div>
    </>
  );
}

export default WineLoading;
