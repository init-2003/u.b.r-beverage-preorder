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

const DEFAULT_FALLBACK = '/images/ubr_beverage_logo_thumb.webp';
const SECONDARY_FALLBACK = '/images/ubr_beverage_logo.png';

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
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (failedImagesCache.has(normalizedSrc)) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      setIsLoaded(true);
    } else {
      setCurrentSrc(normalizedSrc);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [normalizedSrc, fallbackSrc]);

  const handleError = () => {
    if (src) {
      failedImagesCache.add(src);
    }
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    } else if (currentSrc !== SECONDARY_FALLBACK) {
      setCurrentSrc(SECONDARY_FALLBACK);
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

      {/* Main Image with Async Decoding and Smooth Fade-in */}
      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full ${
          objectFit === 'contain' ? 'object-contain p-2' : 'object-cover'
        } transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default ProductImage;
