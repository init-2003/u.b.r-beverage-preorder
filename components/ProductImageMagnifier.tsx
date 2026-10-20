'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus } from 'lucide-react';
import { isPlaceholderUrl } from '@/components/ui/ProductImage';

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
  const normalizeImgSrc = (s?: string) => {
    if (!s || !s.trim()) return '/images/ubr_beverage_logo.png';
    const clean = s.trim();
    return clean.startsWith('/') || clean.startsWith('http') || clean.startsWith('data:') ? clean : `/${clean}`;
  };

  const [isLoaded, setIsLoaded] = useState(true);
  const [imgSrc, setImgSrc] = useState(() => normalizeImgSrc(src));
  const [isLogoDetected, setIsLogoDetected] = useState<boolean>(() => {
    return isPlaceholderUrl(src) || isPlaceholderUrl(normalizeImgSrc(src));
  });
  // Drives the cursor: normal arrow until the magnifier is armed, crosshair after that
  const [isArmed, setIsArmed] = useState(false);

  // Full-Screen Lightbox modal states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const touchStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Lightbox Zoom & Pan states
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDraggingLightbox, setIsDraggingLightbox] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset zoom & pan when opening or closing lightbox
  useEffect(() => {
    if (!isLightboxOpen) {
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
      setIsDraggingLightbox(false);
    }
  }, [isLightboxOpen]);

  const handleLightboxZoomIn = useCallback(() => {
    setLightboxZoom((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 4));
  }, []);

  const handleLightboxZoomOut = useCallback(() => {
    setLightboxZoom((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1);
      if (next === 1) {
        setLightboxPan({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  // Lock background scroll and listen to ESC and zoom keys when Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === '+' || e.key === '=') {
        handleLightboxZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleLightboxZoomOut();
      } else if (e.key === '0') {
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, handleLightboxZoomIn, handleLightboxZoomOut]);

  // Mouse drag handlers for panning zoomed image
  const handleLightboxMouseDown = useCallback((e: React.MouseEvent) => {
    if (lightboxZoom <= 1) return;
    setIsDraggingLightbox(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: lightboxPan.x,
      panY: lightboxPan.y,
    };
  }, [lightboxZoom, lightboxPan]);

  const handleLightboxMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingLightbox || lightboxZoom <= 1) return;
    const dx = (e.clientX - dragStartRef.current.x) / lightboxZoom;
    const dy = (e.clientY - dragStartRef.current.y) / lightboxZoom;
    setLightboxPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  }, [isDraggingLightbox, lightboxZoom]);

  const handleLightboxMouseUp = useCallback(() => {
    setIsDraggingLightbox(false);
  }, []);

  // Touch drag handlers for mobile panning zoomed image
  const handleLightboxTouchStart = useCallback((e: React.TouchEvent) => {
    if (lightboxZoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDraggingLightbox(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: lightboxPan.x,
        panY: lightboxPan.y,
      };
    }
  }, [lightboxZoom, lightboxPan]);

  const handleLightboxTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingLightbox || lightboxZoom <= 1 || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = (touch.clientX - dragStartRef.current.x) / lightboxZoom;
    const dy = (touch.clientY - dragStartRef.current.y) / lightboxZoom;
    setLightboxPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  }, [isDraggingLightbox, lightboxZoom]);

  const handleLightboxTouchEnd = useCallback(() => {
    setIsDraggingLightbox(false);
  }, []);

  // Wheel zoom in/out
  const handleLightboxWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setLightboxZoom((prev) => Math.min(Number((prev + 0.3).toFixed(1)), 4));
    } else {
      setLightboxZoom((prev) => {
        const next = Math.max(Number((prev - 0.3).toFixed(1)), 1);
        if (next === 1) {
          setLightboxPan({ x: 0, y: 0 });
        }
        return next;
      });
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const checkLogoDims = (img: HTMLImageElement) => {
    if (!img) return;
    const isLogoDims =
      (img.naturalWidth === 746 && img.naturalHeight === 660) ||
      (img.naturalWidth > 0 && Math.abs(img.naturalWidth / img.naturalHeight - 1.13) < 0.02);

    if (isLogoDims) {
      setIsLogoDetected(true);
    }
  };

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
    const target = normalizeImgSrc(src);
    setImgSrc(target);
    if (isPlaceholderUrl(target)) {
      setIsLogoDetected(true);
    }
    if (imgRef.current && imgRef.current.complete) {
      checkLogoDims(imgRef.current);
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
      if (typeof window !== 'undefined' && window.innerWidth < 640) return;
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
      if (typeof window !== 'undefined' && window.innerWidth < 640) return;
      const insideImage = updatePosition(e);
      setIsHovering(armedRef.current && insideImage);
    },
    [updatePosition]
  );

  const handleClick = useCallback(() => {
    setIsLightboxOpen(true);
    setIsHovering(false);
  }, []);

  // On Mobile: Tap opens Lightbox directly without magnifying glass
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartPosRef.current && e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const dist = Math.hypot(
          touch.clientX - touchStartPosRef.current.x,
          touch.clientY - touchStartPosRef.current.y
        );
        const duration = Date.now() - touchStartPosRef.current.time;
        // Clean tap: moved less than 15px within 450ms
        if (dist < 15 && duration < 450) {
          setIsLightboxOpen(true);
        }
      }
      touchStartPosRef.current = null;
    },
    []
  );

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative inline-flex items-center justify-center cursor-pointer ${
        isArmed ? 'sm:cursor-zoom-in' : 'sm:cursor-default'
      } select-none overflow-visible min-h-[300px] w-full touch-pan-y ${className}`}
      title="คลิกเพื่อดูภาพขยายเต็มจอ"
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
        draggable={false}
        onLoad={(e) => {
          checkLogoDims(e.currentTarget);
          setIsLoaded(true);
        }}
        className={
          imgSrc.includes('ubr_beverage_logo') || isPlaceholderUrl(imgSrc) || isLogoDetected
            ? `max-h-[320px] sm:max-h-[380px] w-auto h-auto object-contain transition-opacity duration-200 border-0 shadow-none outline-none ${
                isHovering ? 'sm:opacity-40' : 'opacity-100'
              }`
            : `max-h-[380px] sm:max-h-[440px] w-auto h-auto object-contain transition-opacity duration-200 border-0 shadow-none outline-none ${
                isHovering ? 'sm:opacity-40' : 'opacity-100'
              }`
        }
        onError={() => {
          setImgSrc('/images/ubr_beverage_logo.png');
          setIsLogoDetected(true);
          setIsLoaded(true);
        }}
      />

      {/* Magnifying Glass Loupe (Circular Lens / Square Lens) - Desktop Only */}
      {isHovering && dimensions.width > 0 && dimensions.height > 0 && (
        <div
          className={`hidden sm:block absolute pointer-events-none ${
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
            backgroundPosition: `${-(imgPos.x * zoomLevel - lensRadius)}px ${-(imgPos.y * zoomLevel - lensRadius)}px`,
            backgroundColor: '#ffffff',
          }}
        />
      )}

      {/* Full-Screen Image Lightbox Viewer (Matching User Reference Image 2 & Zoom Controls) */}
      {mounted &&
        isLightboxOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-4 sm:p-8 select-none animate-in fade-in duration-200 cursor-zoom-out"
            onClick={() => setIsLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="ดูภาพสินค้าขยายเต็มจอ"
          >
            {/* Top-Left Sleek Zoom Controls (+ / -) matching user specification */}
            <div
              className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col items-center gap-1.5 sm:gap-2 z-50 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Zoom In (+) */}
              <button
                type="button"
                onClick={handleLightboxZoomIn}
                disabled={lightboxZoom >= 4}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none"
                title="ขยายภาพ (+)"
                aria-label="ขยายภาพ"
              >
                <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.25]" />
              </button>

              {/* Zoom Out (-) — Minimum is strictly 1.0 (Initial image size) */}
              <button
                type="button"
                onClick={handleLightboxZoomOut}
                disabled={lightboxZoom <= 1}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer focus:outline-none"
                title="ย่อภาพ (- ภาพขนาดตั้งต้น)"
                aria-label="ย่อภาพ"
              >
                <Minus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.25]" />
              </button>
            </div>

            {/* Top-Right Sleek Close Button matching user Image 2 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200 active:scale-95 transition-all cursor-pointer z-50 focus:outline-none"
              title="ปิด (Esc)"
              aria-label="ปิดภาพขยาย"
            >
              <X className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.25]" />
            </button>

            {/* Centered Large Image with Zoom & Pan */}
            <div
              className="relative w-full h-full flex items-center justify-center max-w-[92vw] max-h-[85vh] sm:max-h-[88vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleLightboxMouseDown}
              onMouseMove={handleLightboxMouseMove}
              onMouseUp={handleLightboxMouseUp}
              onTouchStart={handleLightboxTouchStart}
              onTouchMove={handleLightboxTouchMove}
              onTouchEnd={handleLightboxTouchEnd}
              onWheel={handleLightboxWheel}
              style={{
                cursor: lightboxZoom > 1 ? (isDraggingLightbox ? 'grabbing' : 'grab') : 'default',
              }}
            >
              <img
                src={imgSrc}
                alt={alt}
                draggable={false}
                style={{
                  transform: `scale(${lightboxZoom}) translate(${lightboxPan.x}px, ${lightboxPan.y}px)`,
                  transformOrigin: 'center center',
                  transition: isDraggingLightbox ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="max-h-full max-w-full object-contain select-none pointer-events-auto will-change-transform"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
