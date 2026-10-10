'use client';

import React, { useEffect, useState, useRef } from 'react';
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

  // Handle Escape key and lock body scroll when modal is open
  useEffect(() => {
    if (!mounted || isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, isClosing, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto ${
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
        className={`bg-white rounded-lg ${padding} w-full ${maxWidth} shadow-2xl relative border border-slate-100/80 text-slate-800 ${
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
            className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {children}
      </div>
    </div>
  );
}

export default Modal;

