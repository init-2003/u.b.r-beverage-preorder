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
  // Lens anchor point, relative to the container (so the lens center always sits on the cursor)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  // Cursor point relative to the image itself (clamped to image bounds) — used for zoom math
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState(true);
  const [imgSrc, setImgSrc] = useState(src || '/images/ubr_beverage_logo.png');
  // Drives the cursor: normal arrow until the magnifier is armed, crosshair after that
  const [isArmed, setIsArmed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // The magnifier must NOT start working right after the page loads (or right after a
  // client-side navigation) when the pointer happens to already rest on the image.
  // It only arms once the pointer has been seen outside the image — pointing at the image
  // again afterwards activates it normally.
  const armedRef = useRef(false);

  const arm = useCallback(() => {
    if (armedRef.current) return;
    armedRef.current = true;
    setIsArmed(true);
  }, []);

  useEffect(() => {
    const target = src || '/images/ubr_beverage_logo.png';
    setImgSrc(target);
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  // Watch the pointer from mount: as soon as it is seen outside the image, the magnifier is armed.
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      const target = imgRef.current || containerRef.current;
      if (!target) return;

      const r = target.getBoundingClientRect();
      const outside =
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom;

      if (outside) {
        arm();
        window.removeEventListener('mousemove', handlePointerMove);
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, [arm]);

  const lensRadius = lensSize / 2;

  const updatePosition = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return false;

    const cRect = container.getBoundingClientRect();
    const iRect = img.getBoundingClientRect();

    const rawX = e.clientX - iRect.left;
    const rawY = e.clientY - iRect.top;
    const insideImage =
      rawX >= 0 && rawX <= iRect.width && rawY >= 0 && rawY <= iRect.height;

    // Cursor relative to the image, clamped inside the image (drives the zoomed background)
    const ix = Math.max(0, Math.min(rawX, iRect.width));
    const iy = Math.max(0, Math.min(rawY, iRect.height));

    // Cursor relative to the container (the lens' positioned parent) — keeps the lens centered on the cursor
    setMousePos({ x: e.clientX - cRect.left, y: e.clientY - cRect.top });
    setImgPos({ x: ix, y: iy });
    setDimensions({ width: iRect.width, height: iRect.height });

    return insideImage;
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const insideImage = updatePosition(e);
      setIsHovering(armedRef.current && insideImage);
    },
    [updatePosition]
  );

  const handleMouseLeave = useCallback(() => {
    arm();
    setIsHovering(false);
  }, [arm]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const insideImage = updatePosition(e);
      setIsHovering(armedRef.current && insideImage);
    },
    [updatePosition]
  );

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`relative inline-flex items-center justify-center ${isArmed ? 'cursor-crosshair' : 'cursor-default'} select-none overflow-visible min-h-[300px] w-full ${className}`}
    >
      {/* Shimmer skeleton while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 max-h-[360px] sm:max-h-[440px] max-w-[360px] bg-slate-100 animate-pulse rounded-md mx-auto pointer-events-none" />
      )}

      {/* Base Product Image */}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`max-h-[360px] sm:max-h-[440px] w-auto h-auto object-contain transition-opacity duration-200 ${isHovering ? 'opacity-40' : 'opacity-100'
          }`}
        onError={() => {
          setImgSrc('/images/ubr_beverage_logo.png');
          setIsLoaded(true);
        }}
      />

      {/* Magnifying Glass Loupe (Circular Lens / Square Lens) */}
      {isHovering && dimensions.width > 0 && dimensions.height > 0 && (
        <div
          className={`absolute pointer-events-none ${shape === 'square' ? 'rounded-none' : 'rounded-full'
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
            backgroundPosition: `${-(imgPos.x * zoomLevel - lensRadius)}px ${-(imgPos.y * zoomLevel - lensRadius)}px`,
            backgroundColor: '#ffffff',
          }}
        />
      )}
    </div>
  );
}
