'use client';

import React from 'react';

/**
 * Category Sidebar Skeleton matching CategorySidebar geometry and styling.
 */
export function CategorySidebarSkeleton() {
  const mockCategories = [
    { nameWidth: 'w-24', submenus: ['w-20', 'w-24', 'w-18'] },
    { nameWidth: 'w-20', submenus: ['w-22', 'w-16'] },
    { nameWidth: 'w-28', submenus: ['w-24', 'w-20', 'w-28', 'w-16'] },
    { nameWidth: 'w-22', submenus: ['w-18', 'w-20', 'w-24'] },
    { nameWidth: 'w-26', submenus: [] },
    { nameWidth: 'w-18', submenus: [] },
    { nameWidth: 'w-24', submenus: ['w-20', 'w-16'] },
    { nameWidth: 'w-20', submenus: [] },
  ];

  return (
    <div className="space-y-3.5 pt-1 select-none pointer-events-none">
      {mockCategories.map((cat, idx) => (
        <div key={idx} className="space-y-2">
          {/* Main Category Header Row */}
          <div className="flex items-center justify-between gap-2 py-0.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-3.5 h-3.5 rounded-xs skeleton-shimmer shrink-0" />
              <div className={`h-4 ${cat.nameWidth} rounded-xs skeleton-shimmer`} />
            </div>
            {cat.submenus.length > 0 && (
              <div className="w-3.5 h-3.5 rounded-xs skeleton-shimmer shrink-0 opacity-60" />
            )}
          </div>

          {/* Indented Submenus (if expanded) */}
          {cat.submenus.length > 0 && (
            <div className="pl-5.5 space-y-1.5 border-l border-slate-100 ml-1.5">
              {cat.submenus.map((subW, sIdx) => (
                <div key={sIdx} className="flex items-center gap-2 py-0.5">
                  <div className={`h-3.5 ${subW} rounded-xs skeleton-shimmer opacity-85`} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Banner Carousel Skeleton matching BannerCarousel geometry and styling.
 */
export function BannerCarouselSkeleton() {
  return (
    <div
      className="relative rounded-none shadow-sm border border-t-0 border-slate-200/80 bg-slate-950 overflow-hidden select-none pointer-events-none w-full aspect-[1440/586] shrink-0"
      aria-hidden="true"
    >
      {/* Dark Animated Shimmer Background */}
      <div className="absolute inset-0 skeleton-shimmer-dark" />

      {/* Subtle Bottom Vignette Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-12 sm:h-16 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Top-Right Logo Emblem Placeholder */}
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10 h-7 w-20 sm:h-9 sm:w-28 rounded-md bg-white/10 skeleton-shimmer backdrop-blur-xs shadow-xs" />

      {/* Bottom Center Slide Indicator Placeholders */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
        <div className="w-8 sm:w-12 h-1.5 sm:h-2 rounded-full bg-white/40 skeleton-shimmer" />
        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white/20" />
        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

/**
 * Skeleton card matching the exact structure and geometry of product catalog cards.
 */
export function ProductCardSkeleton({ hasDepositBadge = true }: { hasDepositBadge?: boolean }) {
  return (
    <div className="apple-squircle-card bg-white border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden h-full select-none pointer-events-none">
      {/* Product Image Box (Aspect Square Full Bleed) */}
      <div className="w-full aspect-square skeleton-shimmer shrink-0 relative overflow-hidden bg-slate-100">
        {/* PRE-ORDER Badge at Top-Left Corner */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 h-5 w-20 sm:w-22 rounded-xs bg-slate-200/90 skeleton-shimmer shadow-2xs" />

        {/* Deposit Sticker Badge at Top-Right Corner */}
        {hasDepositBadge && (
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 h-8 w-9 rounded-xs bg-slate-200/90 skeleton-shimmer shadow-2xs" />
        )}
      </div>

      {/* Content Area (Padded: ชื่อสินค้า, ราคา, ปุ่มกด) */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between">
        {/* Product Name Placeholder (Clean 2 lines matching min-h) */}
        <div className="space-y-1.5 mb-2 min-h-[36px] sm:min-h-[40px]">
          <div className="h-3.5 w-5/6 rounded-xs skeleton-shimmer" />
          <div className="h-3.5 w-3/5 rounded-xs skeleton-shimmer" />
        </div>

        {/* Bottom Section: Price, Deposit & Action Buttons */}
        <div className="pt-1 space-y-2">
          <div>
            {/* Price Tag */}
            <div className="h-5 w-24 rounded-xs skeleton-shimmer" />
            {/* Deposit Tag */}
            <div className="h-3.5 w-28 rounded-xs skeleton-shimmer mt-1.5" />
          </div>

          {/* Action Buttons: Add to Cart (Circle 38px) + Buy Button (Pill 38px) */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="h-9.5 w-9.5 rounded-full skeleton-shimmer shrink-0" />
            <div className="h-9.5 flex-1 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards matching the 4-column (or 5-column) responsive layout.
 */
export function ProductGridSkeleton({
  count,
  isSidebarCollapsed = false,
}: {
  count?: number;
  isSidebarCollapsed?: boolean;
}) {
  const finalCount = count ?? (isSidebarCollapsed ? 10 : 8);
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${
        isSidebarCollapsed
          ? 'lg:grid-cols-4 xl:grid-cols-5'
          : 'lg:grid-cols-3 xl:grid-cols-4'
      } gap-3.5 sm:gap-4 lg:gap-5`}
    >
      {Array.from({ length: finalCount }).map((_, idx) => (
        <ProductCardSkeleton key={idx} hasDepositBadge={idx % 2 === 0} />
      ))}
    </div>
  );
}

/**
 * Full Homepage Skeleton (Sidebar + Banner + Product Grid) for Suspense fallback and initial page load.
 * Supports both Open (w-60, 4-col grid) and Collapsed (w-0, 5-col grid) states.
 */
export function HomeSkeleton({
  isSidebarCollapsed: propCollapsed = false,
  showBanner = true,
}: {
  isSidebarCollapsed?: boolean;
  showBanner?: boolean;
} = {}) {
  const [collapsed, setCollapsed] = React.useState<boolean>(propCollapsed);

  React.useEffect(() => {
    setCollapsed(propCollapsed);
  }, [propCollapsed]);

  return (
    <div className="flex-1 flex flex-col w-full bg-white select-none">
      <div className="max-w-[1600px] mx-auto w-full px-2 sm:px-6 lg:px-8 pt-0 pb-12 flex-1 flex flex-col">
        {/* Main Layout Skeleton: Left Category Sidebar + Right (Banner + Product Grid) */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4 lg:gap-6 items-start w-full">
          {/* Left Category Sidebar Skeleton (Supports both Open and Collapsed states) */}
          <aside
            className={`hidden sm:block shrink-0 sticky top-[115px] self-start z-30 transition-[width,margin,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              collapsed
                ? 'w-0 -mr-4 lg:-mr-6 overflow-hidden opacity-0 pointer-events-none'
                : 'w-60 xl:w-64 opacity-100'
            }`}
            aria-label="เมนูหมวดหมู่สินค้า (กำลังโหลด)"
            aria-hidden={collapsed}
          >
            <div className="w-60 xl:w-64 bg-white rounded-[14px] apple-squircle-card overflow-hidden flex flex-col p-4 sm:p-5 max-h-[calc(100vh-135px)]">
              {/* Top Pinned Option: "ทั้งหมด" + Collapse Button Placeholder */}
              <div className="shrink-0 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between gap-1">
                <div className="h-5 w-14 rounded-xs skeleton-shimmer" />
                <div className="w-6 h-6 rounded-md skeleton-shimmer" />
              </div>

              {/* Scrollable Area Skeleton */}
              <div className="flex-1 min-h-0 overflow-hidden pr-1 space-y-3 pt-1 pb-1">
                <CategorySidebarSkeleton />
              </div>
            </div>
          </aside>

          {/* Right Content Area Skeleton: Banner + Product Grid */}
          <div className={`flex-1 min-w-0 w-full flex flex-col ${!showBanner ? 'pt-4 sm:pt-5' : ''} space-y-6`}>
            {/* Top Banner Carousel Skeleton (Shown only when "ทั้งหมด" is active) */}
            {showBanner && <BannerCarouselSkeleton />}

            {/* Product Grid Skeleton (10 cards in 5 cols when collapsed, 8 cards in 4 cols when open) */}
            <ProductGridSkeleton
              count={collapsed ? 10 : 8}
              isSidebarCollapsed={collapsed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeSkeleton;
