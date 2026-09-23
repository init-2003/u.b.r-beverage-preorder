'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

interface DraggableCartButtonProps {
  totalQty: number;
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface Position {
  x: number;
  y: number;
}

const CORNER_STORAGE_KEY = 'ubr_floating_cart_corner';
const OLD_STORAGE_KEY = 'ubr_floating_cart_pos';
const CORNER_MARGIN = 20; // 20px clean margin from screen corner

export default function DraggableCartButton({ totalQty }: DraggableCartButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  // Active docked corner (default: bottom-right)
  const [corner, setCorner] = useState<Corner>('bottom-right');
  // Temporary coordinates while dragging or snapping
  const [dragPos, setDragPos] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const dragRef = useRef<{
    isPointerDown: boolean;
    pointerStartX: number;
    pointerStartY: number;
    btnStartX: number;
    btnStartY: number;
    btnWidth: number;
    btnHeight: number;
    currentX: number;
    currentY: number;
    hasMoved: boolean;
  }>({
    isPointerDown: false,
    pointerStartX: 0,
    pointerStartY: 0,
    btnStartX: 0,
    btnStartY: 0,
    btnWidth: 0,
    btnHeight: 0,
    currentX: 0,
    currentY: 0,
    hasMoved: false,
  });

  // Calculate safe docked position for each corner
  const getDockedStyle = useCallback((c: Corner): React.CSSProperties => {
    if (typeof window === 'undefined') {
      return { bottom: `${CORNER_MARGIN}px`, right: `${CORNER_MARGIN}px` };
    }
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : (window.innerWidth >= 640 ? 80 : 64);
    const topMargin = headerHeight + CORNER_MARGIN;

    switch (c) {
      case 'top-left':
        return { top: `${topMargin}px`, left: `${CORNER_MARGIN}px`, right: 'auto', bottom: 'auto' };
      case 'top-right':
        return { top: `${topMargin}px`, right: `${CORNER_MARGIN}px`, left: 'auto', bottom: 'auto' };
      case 'bottom-left':
        return { bottom: `${CORNER_MARGIN}px`, left: `${CORNER_MARGIN}px`, top: 'auto', right: 'auto' };
      case 'bottom-right':
      default:
        return { bottom: `${CORNER_MARGIN}px`, right: `${CORNER_MARGIN}px`, top: 'auto', left: 'auto' };
    }
  }, []);

  // Initialize corner from localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCorner = localStorage.getItem(CORNER_STORAGE_KEY) as Corner | null;
      if (savedCorner && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(savedCorner)) {
        setCorner(savedCorner);
      } else {
        // Migrate from old pixel position if present
        const oldPos = localStorage.getItem(OLD_STORAGE_KEY);
        if (oldPos) {
          const parsed = JSON.parse(oldPos);
          const isLeft = parsed.x < window.innerWidth / 2;
          const isTop = parsed.y < window.innerHeight / 2;
          const c: Corner = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Corner;
          setCorner(c);
          localStorage.removeItem(OLD_STORAGE_KEY);
          localStorage.setItem(CORNER_STORAGE_KEY, c);
        }
      }
    } catch {}
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    dragRef.current = {
      isPointerDown: true,
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
      btnStartX: rect.left,
      btnStartY: rect.top,
      btnWidth: rect.width,
      btnHeight: rect.height,
      currentX: rect.left,
      currentY: rect.top,
      hasMoved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isPointerDown) return;

    const dx = e.clientX - dragRef.current.pointerStartX;
    const dy = e.clientY - dragRef.current.pointerStartY;
    const distance = Math.hypot(dx, dy);

    // Require movement > 6px to initiate dragging mode
    if (!dragRef.current.hasMoved && distance > 6) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
      setIsSnapping(false);
    }

    if (dragRef.current.hasMoved) {
      const nextX = dragRef.current.btnStartX + dx;
      const nextY = dragRef.current.btnStartY + dy;

      // Safe viewport boundaries
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : (window.innerWidth >= 640 ? 80 : 64);
      const minY = headerHeight + CORNER_MARGIN;
      const minX = CORNER_MARGIN;
      const maxX = Math.max(minX, window.innerWidth - dragRef.current.btnWidth - CORNER_MARGIN);
      const maxY = Math.max(minY, window.innerHeight - dragRef.current.btnHeight - CORNER_MARGIN);

      const clampedX = Math.min(Math.max(minX, nextX), maxX);
      const clampedY = Math.min(Math.max(minY, nextY), maxY);

      dragRef.current.currentX = clampedX;
      dragRef.current.currentY = clampedY;
      setDragPos({ x: clampedX, y: clampedY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isPointerDown) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const wasDragged = dragRef.current.hasMoved;
    const { currentX, currentY, btnWidth, btnHeight } = dragRef.current;

    dragRef.current.isPointerDown = false;
    dragRef.current.hasMoved = false;
    setIsDragging(false);

    if (wasDragged) {
      // Calculate nearest quadrant corner
      const centerX = currentX + btnWidth / 2;
      const centerY = currentY + btnHeight / 2;
      const midX = window.innerWidth / 2;
      const midY = window.innerHeight / 2;

      const isLeft = centerX < midX;
      const isTop = centerY < midY;
      const targetCorner: Corner = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Corner;

      // Target coordinate for the bounce animation
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : (window.innerWidth >= 640 ? 80 : 64);
      const targetX = isLeft ? CORNER_MARGIN : window.innerWidth - btnWidth - CORNER_MARGIN;
      const targetY = isTop ? (headerHeight + CORNER_MARGIN) : window.innerHeight - btnHeight - CORNER_MARGIN;

      // Animate spring bounce to the target corner
      setIsSnapping(true);
      setDragPos({ x: targetX, y: targetY });

      // After bounce animation completes, dock with pure CSS corner positioning
      setTimeout(() => {
        setCorner(targetCorner);
        setDragPos(null);
        setIsSnapping(false);
        try {
          localStorage.setItem(CORNER_STORAGE_KEY, targetCorner);
        } catch {}
      }, 400);
    } else {
      // Clean click: navigate to cart
      router.push('/cart');
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (dragRef.current.isPointerDown && dragRef.current.hasMoved) {
      const { currentX, currentY, btnWidth, btnHeight } = dragRef.current;
      const isLeft = (currentX + btnWidth / 2) < window.innerWidth / 2;
      const isTop = (currentY + btnHeight / 2) < window.innerHeight / 2;
      const targetCorner: Corner = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}` as Corner;
      setCorner(targetCorner);
      setDragPos(null);
      try {
        localStorage.setItem(CORNER_STORAGE_KEY, targetCorner);
      } catch {}
    }
    dragRef.current.isPointerDown = false;
    dragRef.current.hasMoved = false;
    setIsDragging(false);
    setIsSnapping(false);
  };

  if (!isMounted || totalQty <= 0) return null;

  // Dynamic style: while dragging/snapping use translate3d, when docked use CSS corner positioning
  const containerStyle: React.CSSProperties = dragPos
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 'auto',
        bottom: 'auto',
        transform: `translate3d(${dragPos.x}px, ${dragPos.y}px, 0)`,
        touchAction: 'none',
        transition: isDragging
          ? 'none'
          : isSnapping
          ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'none',
      }
    : {
        position: 'fixed',
        ...getDockedStyle(corner),
        transform: 'none',
        touchAction: 'none',
        transition: 'none',
      };

  return (
    <div
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={containerStyle}
      className={`z-30 select-none cursor-grab active:cursor-grabbing rounded-full ${
        isDragging
          ? 'scale-105 shadow-2xl opacity-95 ring-2 ring-neutral-400/40'
          : 'scale-100 shadow-xl'
      }`}
      title="ลากเพื่อย้ายตำแหน่ง (จะเด้งล็อคเข้ามุมอัตโนมัติ) หรือคลิกเพื่อดูตะกร้าสั่งจอง"
    >
      <div className="bg-black hover:bg-neutral-900 text-white px-5 py-3 sm:px-6 sm:py-3.5 rounded-full shadow-2xl border border-neutral-800 flex items-center gap-3 group relative overflow-hidden backdrop-blur-sm transition-all">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Cart Icon with Gold Badge */}
        <div className="relative shrink-0">
          <ShoppingCart className="w-5 h-5 text-white" />
          <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-black shadow-md">
            {totalQty}
          </span>
        </div>

        {/* Button Label */}
        <span className="text-xs sm:text-sm font-bold text-white tracking-wide pr-1 select-none">
          ดูสินค้าในตะกร้า
        </span>
      </div>
    </div>
  );
}
