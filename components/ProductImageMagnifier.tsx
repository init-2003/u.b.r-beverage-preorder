'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ProductImageMagnifierProps {
  src: string;
  alt: string;
  zoomLevel?: number;
  lensSize?: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export default function ProductImageMagnifier({
  src,
  alt,
  zoomLevel = 2.5,
  lensSize = 210,
  shape = 'circle',
  className = '',
}: ProductImageMagnifierProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imgSrc, setImgSrc] = useState(src || '/images/ubr_beverage_logo.png');

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImgSrc(src || '/images/ubr_beverage_logo.png');
  }, [src]);

  const lensRadius = lensSize / 2;

  const handleMouseEnter = useCallback(() => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imgRef.current) return;

      const rect = imgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Keep within bounds
      const clampedX = Math.max(0, Math.min(x, rect.width));
      const clampedY = Math.max(0, Math.min(y, rect.height));

      setMousePos({ x: clampedX, y: clampedY });
      setDimensions({ width: rect.width, height: rect.height });
    },
    []
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`relative inline-flex items-center justify-center cursor-crosshair select-none overflow-visible ${className}`}
    >
      {/* Base Product Image */}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        className={`max-h-[360px] sm:max-h-[440px] w-auto h-auto object-contain transition-opacity duration-200 ${
          isHovering ? 'opacity-40' : 'opacity-100'
        }`}
        onError={() => {
          setImgSrc('/images/ubr_beverage_logo.png');
        }}
      />

      {/* Magnifying Glass Loupe (Circular Lens / Square Lens) */}
      {isHovering && dimensions.width > 0 && dimensions.height > 0 && (
        <div
          className={`absolute pointer-events-none ${
            shape === 'square' ? 'rounded-none' : 'rounded-full'
          } overflow-hidden z-30 transition-transform duration-75 ease-out animate-in fade-in zoom-in-75 duration-150`}
          style={{
            width: `${lensSize}px`,
            height: `${lensSize}px`,
            left: `${mousePos.x - lensRadius}px`,
            top: `${mousePos.y - lensRadius}px`,
            boxShadow:
              '0 14px 40px rgba(0, 0, 0, 0.45), 0 0 0 2.5px rgba(255, 255, 255, 0.95), inset 0 0 20px rgba(0, 0, 0, 0.25)',
            backgroundImage: `url(${imgSrc})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${dimensions.width * zoomLevel}px ${dimensions.height * zoomLevel}px`,
            backgroundPosition: `${-(mousePos.x * zoomLevel - lensRadius)}px ${-(mousePos.y * zoomLevel - lensRadius)}px`,
            backgroundColor: '#ffffff',
          }}
        />
      )}
    </div>
  );
}
