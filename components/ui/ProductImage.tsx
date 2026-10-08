'use client';

import React, { useState, useEffect } from 'react';

// In-memory cache of broken image URLs across the browser session
// to completely prevent repeated 404 network attempts
const failedImagesCache = new Set<string>();

export interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain';
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = '/images/ubr_beverage_logo.png';

export function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
  objectFit = 'cover',
  fallbackSrc = DEFAULT_FALLBACK,
}: ProductImageProps) {
  // Normalize path
  const normalizedSrc = React.useMemo(() => {
    if (!src || !src.trim()) return fallbackSrc;
    const clean = src.trim();
    if (failedImagesCache.has(clean)) return fallbackSrc;
    return clean.startsWith('/') || clean.startsWith('http') ? clean : `/${clean}`;
  }, [src, fallbackSrc]);

  const [currentSrc, setCurrentSrc] = useState<string>(normalizedSrc);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (failedImagesCache.has(normalizedSrc)) {
      setCurrentSrc(fallbackSrc);
      setIsLoaded(true);
    } else {
      setCurrentSrc(normalizedSrc);
      if (imgRef.current && imgRef.current.complete) {
        setIsLoaded(true);
      }
    }
  }, [normalizedSrc, fallbackSrc]);

  const handleError = () => {
    if (src) failedImagesCache.add(src);
    if (normalizedSrc) failedImagesCache.add(normalizedSrc);
    if (currentSrc) failedImagesCache.add(currentSrc);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else if (currentSrc !== '/images/ubr_beverage_logo.png') {
      setCurrentSrc('/images/ubr_beverage_logo.png');
    }
    setIsLoaded(true);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-50 ${className}`}>
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
        className={`w-full h-full ${
          objectFit === 'contain' ? 'object-contain' : 'object-cover'
        } block`}
      />
    </div>
  );
}

export default ProductImage;
