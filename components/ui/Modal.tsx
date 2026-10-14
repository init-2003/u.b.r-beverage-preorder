'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  titleId?: string;
  className?: string;
  padding?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-[450px]',
  showCloseButton = true,
  titleId,
  className = '',
  padding = 'p-8 sm:p-9',
}: ModalProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setMounted(true);
      setIsClosing(false);
    } else if (mounted) {
      setIsClosing(true);
      timerRef.current = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
        timerRef.current = null;
      }, 190);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, mounted]);

  // Handle Escape key, scroll navigation keys, and lock background scrolling when modal is open
  useEffect(() => {
    if (!mounted || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Block background scrolling via keyboard navigation keys
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.includes(e.key)) {
        const target = e.target as HTMLElement | null;
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (!isInput) {
          const scrollable = target?.closest('.overflow-y-auto, .overflow-auto');
          if (!scrollable) {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Intercept wheel events
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.overflow-y-auto, .overflow-auto') as HTMLElement | null;
      if (!scrollable || scrollable === backdropRef.current) {
        if (e.cancelable) e.preventDefault();
      } else {
        const { scrollTop, scrollHeight, clientHeight } = scrollable;
        if (
          (e.deltaY < 0 && scrollTop <= 0) ||
          (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1)
        ) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    // Intercept touchmove events on mobile devices (non-invasive scroll lock)
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.overflow-y-auto, .overflow-auto') as HTMLElement | null;
      if (!scrollable || scrollable === backdropRef.current) {
        if (e.cancelable) e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);

      // Force viewport resync to prevent mobile Safari viewport freeze/displacement
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: window.scrollY, left: window.scrollX, behavior: 'instant' });
      }
    };
  }, [mounted, isClosing, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 overflow-y-auto overscroll-contain select-none sm:select-auto ${
        isClosing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
      }`}
      onClick={(e) => {
        if (!isClosing && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`bg-white apple-squircle-modal ${padding} w-full ${maxWidth} shadow-2xl relative border border-slate-100/80 text-slate-800 ${
          isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
        } ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (✕) */}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            disabled={isClosing}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 active:scale-[0.95] transition-all cursor-pointer"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;

