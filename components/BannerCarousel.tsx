'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideData {
  id: number;
  title: string;
  image: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    title: 'Johnnie Walker Blue Label',
    image: '/images/banners/banner1.jpg',
  },
  {
    id: 2,
    title: 'Oak Cask Reserve Cellar',
    image: '/images/banners/banner2.jpg',
  },
  {
    id: 3,
    title: 'Craft Beer & Premium Beverages',
    image: '/images/banners/banner3.jpg',
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
      className="relative rounded-lg shadow-sm border border-slate-200/80 bg-black overflow-hidden select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="ป้ายโฆษณาประชาสัมพันธ์"
    >
      {/* Slides Container with Smooth Horizontal Slide */}
      <div className="relative w-full h-[150px] sm:h-[200px] md:h-[240px] lg:h-[280px] xl:h-[300px] overflow-hidden bg-slate-950">
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
              className="relative w-full h-full shrink-0 overflow-hidden bg-slate-950"
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="(max-width: 1600px) 100vw, 1600px"
                className="object-cover object-center w-full h-full select-none pointer-events-none"
                priority={slide.id === 1}
                loading="eager"
              />
              {/* Subtle bottom shadow overlay to ensure indicator dots and controls stand out */}
              <div className="absolute inset-x-0 bottom-0 h-12 sm:h-16 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons (Previous / Next) */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white/90 hover:text-white border border-white/20 backdrop-blur-xs flex items-center justify-center transition-all duration-200 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
        title="สไลด์ก่อนหน้า"
        aria-label="สไลด์ก่อนหน้า"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white/90 hover:text-white border border-white/20 backdrop-blur-xs flex items-center justify-center transition-all duration-200 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
        title="สไลด์ถัดไป"
        aria-label="สไลด์ถัดไป"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Slide Indicators with Progress Bar on Active & Round Dots on Inactive */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
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
                  ? 'w-8 sm:w-12 h-1.5 sm:h-2 bg-white/30 backdrop-blur-xs shadow-xs'
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
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
