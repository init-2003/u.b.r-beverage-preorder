'use client';

import React from 'react';

/**
 * Skeleton card matching the exact structure and geometry of product catalog cards.
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-sm bg-white border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden h-full select-none pointer-events-none">
      {/* Product Image Box (Aspect Square Full Bleed) */}
      <div className="w-full aspect-square skeleton-shimmer shrink-0 relative overflow-hidden" />

      {/* Content Area (Padded: ชื่อสินค้า, ราคา, ปุ่มกด) */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between space-y-3">
        {/* Product Name Placeholder (2 lines) */}
        <div className="space-y-1.5 mb-2">
          <div className="h-3.5 w-5/6 rounded-xs skeleton-shimmer" />
          <div className="h-3.5 w-3/5 rounded-xs skeleton-shimmer" />
        </div>

        {/* Bottom Section: Price, Deposit & Action Buttons */}
        <div className="pt-1 space-y-2">
          <div>
            {/* Price Tag */}
            <div className="h-5 w-24 rounded-xs skeleton-shimmer" />
            {/* Deposit Tag */}
            <div className="h-3 w-28 rounded-xs skeleton-shimmer mt-1.5" />
          </div>

          {/* Action Buttons: Add to Cart (Circle 36px) + Buy Button (Pill 36px) */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="h-9 w-9 rounded-full skeleton-shimmer shrink-0" />
            <div className="h-9 flex-1 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards matching the 5-column responsive layout.
 */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * Full Homepage Skeleton (Banner + Product Grid) for Suspense fallback and initial load.
 */
export function HomeSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 pb-12 flex-1 flex flex-col space-y-8">
      {/* Top Banner Carousel Skeleton */}
      <div className="relative w-full h-[150px] sm:h-[200px] md:h-[240px] lg:h-[280px] xl:h-[300px] rounded-lg shadow-sm border border-slate-200/80 overflow-hidden skeleton-shimmer shrink-0" />

      {/* Product Cards Grid Skeleton */}
      <ProductGridSkeleton count={10} />
    </div>
  );
}

export default HomeSkeleton;
