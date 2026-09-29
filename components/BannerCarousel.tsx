'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideData {
  id: number;
  title: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    title: 'Test Banner 1',
  },
  {
    id: 2,
    title: 'Test Banner 2',
  },
  {
    id: 3,
    title: 'Test Banner 3',
  },
];

const SLIDE_DURATION = 5500; // ms

export function BannerCarousel() {
  // Index in extended array: [last, ...slides, first]
  // Real slide 0 starts at index 1
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Extended slides for infinite sliding:
  // [Slide 3 (clone), Slide 1, Slide 2, Slide 3, Slide 1 (clone)]
  const extendedSlides = [
    SLIDES[SLIDES.length - 1],
    ...SLIDES,
    SLIDES[0],
  ];

  // Active real slide index (0, 1, 2) for indicators
  const activeSlide =
    currentIndex === 0
      ? SLIDES.length - 1
      : currentIndex === extendedSlides.length - 1
      ? 0
      : currentIndex - 1;

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  const goToSlide = (slideIdx: number) => {
    setIsTransitioning(true);
    setCurrentIndex(slideIdx + 1);
  };

  const handleTransitionEnd = () => {
    // If reached right clone (index = 4), silently jump to real first (index = 1)
    if (currentIndex >= extendedSlides.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
    // If reached left clone (index = 0), silently jump to real last (index = 3)
    else if (currentIndex <= 0) {
      setIsTransitioning(false);
      setCurrentIndex(extendedSlides.length - 2);
    }
  };

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <div
      className="relative rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-[#6b0000] bg-[#800000] overflow-hidden select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="ป้ายโฆษณาประชาสัมพันธ์"
    >
      {/* Slides Container with Smooth Horizontal Slide */}
      <div className="relative min-h-[140px] sm:min-h-[160px] md:min-h-[170px] bg-[#800000] overflow-hidden">
        <div
          className={`flex w-full h-full ${
            isTransitioning ? 'transition-transform duration-500 ease-out' : ''
          } will-change-transform`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((slide, i) => (
            <div
              key={`${slide.id}-${i}`}
              className="w-full shrink-0 min-h-[140px] sm:min-h-[160px] md:min-h-[170px] bg-[#800000] text-slate-100 p-6 sm:p-8 flex items-center"
            >
              <div className="relative z-10 flex flex-row items-center justify-between gap-6 w-full">
                {/* Text Content */}
                <div className="max-w-2xl sm:pr-4">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    {slide.title}
                  </h2>
                </div>

                {/* Right Visual Graphic - Official Logo */}
                <div className="flex items-center justify-center shrink-0 pr-2 lg:pr-8">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 drop-shadow-xl">
                    <Image
                      src="/images/ubr_beverage_logo_transparent.png"
                      alt="U.B.R. Beverage Logo"
                      fill
                      sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 144px"
                      className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                      priority={i === 1}
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons (Previous / Next) */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 backdrop-blur-xs flex items-center justify-center transition-all duration-200 opacity-70 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
        title="สไลด์ก่อนหน้า"
        aria-label="สไลด์ก่อนหน้า"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 backdrop-blur-xs flex items-center justify-center transition-all duration-200 opacity-70 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
        title="สไลด์ถัดไป"
        aria-label="สไลด์ถัดไป"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators with Progress Bar on Active & Round Dots on Inactive */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <style>{`
          @keyframes banner-progress-scale {
            0% {
              transform: scaleX(0);
            }
            100% {
              transform: scaleX(1);
            }
          }
        `}</style>
        {SLIDES.map((slide, idx) => {
          const isActive = idx === activeSlide;

          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`relative overflow-hidden transition-all duration-300 rounded-full cursor-pointer p-0 border-0 ${
                isActive
                  ? 'w-10 sm:w-12 h-2 sm:h-2.5 bg-white/25 backdrop-blur-xs shadow-xs'
                  : 'w-2 h-2 sm:h-2.5 bg-white/40 hover:bg-white/70'
              }`}
              title={`ไปยังสไลด์ที่ ${idx + 1}`}
              aria-label={`ไปยังสไลด์ที่ ${idx + 1}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {/* Active current slide - smooth GPU-accelerated fill */}
              {isActive && (
                <span
                  key={`banner-bar-${activeSlide}`}
                  onAnimationEnd={nextSlide}
                  className="absolute inset-0 bg-white rounded-full origin-left will-change-transform shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  style={{
                    animation: `banner-progress-scale ${SLIDE_DURATION}ms linear forwards`,
                    animationPlayState: isPaused ? 'paused' : 'running',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BannerCarousel;
