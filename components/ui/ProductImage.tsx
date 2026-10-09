'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// In-memory cache of broken image URLs across the browser session
// to completely prevent repeated 404 network attempts
const failedImagesCache = new Set<string>();

// Known placeholder product IDs where ubonrr.com returns the 746x660 UBR logo
export const KNOWN_PLACEHOLDER_IDS = new Set<string>([
  '4654131321', '0212321321', '3213155131', '26251351513',
  '02132135', '1313513513', '213513515', '21351351',
  '31321321321', '13213212', '132153132', '321312321',
  '2131561', '1254512', '3321313513', '1313215135',
  '2313131', '23513514', '31431312', '221321321',
  '321315', '215135135158', '153135135', '173'
]);

export const knownPlaceholderCache = new Set<string>([
  '/images/ubr_beverage_logo.png',
  'ubr_beverage_logo',
]);

export function isPlaceholderUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return true;
  const clean = url.trim();
  if (knownPlaceholderCache.has(clean)) return true;
  if (clean.includes('ubr_beverage_logo')) return true;
  for (const id of KNOWN_PLACEHOLDER_IDS) {
    if (clean.includes(id)) return true;
  }
  return false;
}

export interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'auto';
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = '/images/ubr_beverage_logo.png';

export function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
  objectFit = 'auto',
  fallbackSrc = DEFAULT_FALLBACK,
}: ProductImageProps) {
  // Normalize path
  const normalizedSrc = useMemo(() => {
    if (!src || !src.trim()) return fallbackSrc;
    const clean = src.trim();
    if (failedImagesCache.has(clean)) return fallbackSrc;
    return clean.startsWith('/') || clean.startsWith('http') ? clean : `/${clean}`;
  }, [src, fallbackSrc]);

  const [prevNormalizedSrc, setPrevNormalizedSrc] = useState(normalizedSrc);
  const [currentSrc, setCurrentSrc] = useState<string>(normalizedSrc);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const [isLogoDetected, setIsLogoDetected] = useState<boolean>(() => {
    return isPlaceholderUrl(src) || isPlaceholderUrl(normalizedSrc);
  });
  const imgRef = useRef<HTMLImageElement>(null);

  if (prevNormalizedSrc !== normalizedSrc) {
    setPrevNormalizedSrc(normalizedSrc);
    if (failedImagesCache.has(normalizedSrc)) {
      setCurrentSrc(fallbackSrc);
      setIsLogoDetected(true);
      setIsLoaded(true);
    } else {
      setCurrentSrc(normalizedSrc);
      if (isPlaceholderUrl(normalizedSrc)) {
        setIsLogoDetected(true);
      }
    }
  }

  const checkLogoDims = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    const isLogoDims =
      (img.naturalWidth === 746 && img.naturalHeight === 660) ||
      (img.naturalWidth === 1024 && img.naturalHeight === 1024) ||
      (img.naturalWidth > 0 && Math.abs(img.naturalWidth / img.naturalHeight - 1.13) < 0.05) ||
      (img.naturalWidth > 0 && Math.abs(img.naturalWidth / img.naturalHeight - 1.0) < 0.05 && img.naturalWidth >= 400);

    if (isLogoDims) {
      knownPlaceholderCache.add(currentSrc);
      if (src) knownPlaceholderCache.add(src);
      setIsLogoDetected(true);
    }
  }, [currentSrc, src]);

  const isFallbackImage = useMemo(() => {
    return (
      !src ||
      !src.trim() ||
      failedImagesCache.has(src.trim()) ||
      currentSrc.includes('ubr_beverage_logo') ||
      normalizedSrc.includes('ubr_beverage_logo') ||
      isPlaceholderUrl(src) ||
      isPlaceholderUrl(currentSrc) ||
      isPlaceholderUrl(normalizedSrc) ||
      isLogoDetected
    );
  }, [src, currentSrc, normalizedSrc, isLogoDetected]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      checkLogoDims(imgRef.current);
    }
  }, [checkLogoDims]);

  const handleError = () => {
    if (src) failedImagesCache.add(src);
    if (normalizedSrc) failedImagesCache.add(normalizedSrc);
    if (currentSrc) failedImagesCache.add(currentSrc);
    setCurrentSrc(fallbackSrc || DEFAULT_FALLBACK);
    setIsLogoDetected(true);
    setIsLoaded(true);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    checkLogoDims(e.currentTarget);
    setIsLoaded(true);
  };

  const isLogo = isFallbackImage || isLogoDetected;

  // กฎ: ภาพ logo ในสินค้าที่ยังไม่มีภาพสินค้า ให้ใส่เต็มกรอบสี่เหลี่ยม (object-cover p-0) เสมอ ไม่มีช่องว่างสีขาว
  // ส่วนสินค้าจริง ให้ใช้ object-contain p-2 หรือ p-2.5 เพื่อให้เห็นสินค้าเต็มขวด/เต็มชิ้นโดยไม่ถูกครอบ
  const computedFit = isLogo
    ? 'object-cover p-0'
    : objectFit === 'cover'
    ? 'object-cover p-0'
    : 'object-contain p-2 sm:p-2.5';

  // ถ้าเป็นรูปโลโก้ ตัด padding utility classes จาก caller ออก เพื่อให้เต็มกรอบสี่เหลี่ยม 100%
  const cleanedClassName = isLogo
    ? className.replace(/\bp-\S+/g, '').replace(/\bpx-\S+/g, '').replace(/\bpy-\S+/g, '')
    : className;

  return (
    <div className={`relative w-full h-full overflow-hidden ${cleanedClassName}`}>
      {/* Shimmer Placeholder Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse pointer-events-none z-0" />
      )}

      {/* Main Image with Async Decoding */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full ${computedFit} block`}
      />
    </div>
  );
}

export default ProductImage;
