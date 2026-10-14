'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/context/CartContext';
import { EmptyCartIllustration } from '@/components/EmptyCartIllustration';
import { CartIllustration } from '@/components/CartIllustration';
import { ProductImage } from '@/components/ui/ProductImage';
import { WineLoading } from '@/components/WineLoading';
import { QuantityInput } from '@/components/ui';
import { formatDepositPrice } from '@/lib/deposit';

function TrashIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 5l1-2.5h4l1 2.5" />
      <path d="M4 5h16" />
      <path d="M5.5 5l1.3 14.2a2 2 0 002 1.8h6.4a2 2 0 002-1.8L18.5 5" />
    </svg>
  );
}

const CART_SELECTION_STORAGE_KEY = 'ubr_cart_selected_trade_ids';

export default function CartPage() {
  const router = useRouter();
  const { items, totalQty, updateQty, removeItem, removeItems } = useCart();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionLoaded, setIsSelectionLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const prevItemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Initial Load: Load selection from localStorage when items are ready
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isSelectionLoaded) {
      if (items.length === 0) return; // Wait until items are hydrated from CartContext

      try {
        const justAdded = localStorage.getItem('ubr_cart_just_added');
        if (justAdded === 'true') {
          // หากเพิ่งมีการเพิ่มสินค้าเข้าตะกร้า: ติ๊กเลือกสินค้าทั้งหมดทันที
          try {
            localStorage.removeItem('ubr_cart_just_added');
          } catch { }
          const allIds = items.map((i) => i.tradeId);
          setSelectedIds(new Set(allIds));
          localStorage.setItem(CART_SELECTION_STORAGE_KEY, JSON.stringify(allIds));
          sessionStorage.setItem('ubr_cart_selected_ids', JSON.stringify(allIds));
        } else {
          const saved = localStorage.getItem(CART_SELECTION_STORAGE_KEY);
          if (saved !== null) {
            const parsed: string[] = JSON.parse(saved);
            const currentTradeIds = new Set(items.map((i) => i.tradeId));
            // ถ้าผู้ใช้เคยมาติ๊กออกทีหลัง ให้จดจำตามที่ผู้ใช้เลือกไว้
            const validSaved = parsed.filter((id) => currentTradeIds.has(id));
            setSelectedIds(new Set(validSaved));
          } else {
            // ครั้งแรกที่เปิดตะกร้า: ติ๊กเลือกสินค้าทั้งหมด
            const allIds = items.map((i) => i.tradeId);
            setSelectedIds(new Set(allIds));
            localStorage.setItem(CART_SELECTION_STORAGE_KEY, JSON.stringify(allIds));
            sessionStorage.setItem('ubr_cart_selected_ids', JSON.stringify(allIds));
          }
        }
      } catch {
        setSelectedIds(new Set(items.map((i) => i.tradeId)));
      } finally {
        setIsSelectionLoaded(true);
        prevItemsRef.current = items;
      }
      return;
    }

    // 2. Subsequent updates when items list changes while cart page is loaded
    const prevIds = new Set(prevItemsRef.current.map((i) => i.tradeId));
    const currentIds = new Set(items.map((i) => i.tradeId));
    const newlyAddedIds = items.filter((i) => !prevIds.has(i.tradeId)).map((i) => i.tradeId);

    // Only update selection if items were actually added or removed
    if (prevItemsRef.current.length !== items.length || newlyAddedIds.length > 0) {
      if (newlyAddedIds.length > 0) {
        // เมื่อมีการเพิ่มสินค้าใหม่เข้าตะกร้า: ติ๊กทั้งหมดไว้เลยตามความต้องการของผู้ใช้
        const allIds = items.map((i) => i.tradeId);
        setSelectedIds(new Set(allIds));
        try {
          localStorage.setItem(CART_SELECTION_STORAGE_KEY, JSON.stringify(allIds));
          sessionStorage.setItem('ubr_cart_selected_ids', JSON.stringify(allIds));
          localStorage.removeItem('ubr_cart_just_added');
        } catch { }
      } else {
        // กรณีลบสินค้าออกจากตะกร้า: จำค่าที่ผู้ใช้เคยติ๊กเลือกไว้ตามเดิม
        setSelectedIds((prev) => {
          const next = new Set<string>();
          prev.forEach((id) => {
            if (currentIds.has(id)) {
              next.add(id);
            }
          });
          return next;
        });
      }
    }

    prevItemsRef.current = items;
  }, [items, isSelectionLoaded]);

  // 3. Save selection to localStorage and sessionStorage whenever selectedIds changes
  useEffect(() => {
    if (!isSelectionLoaded || typeof window === 'undefined') return;
    try {
      const arr = Array.from(selectedIds);
      localStorage.setItem(CART_SELECTION_STORAGE_KEY, JSON.stringify(arr));
      sessionStorage.setItem('ubr_cart_selected_ids', JSON.stringify(arr));
    } catch (e) {
      console.error('Failed to save cart selection to storage', e);
    }
  }, [selectedIds, isSelectionLoaded]);

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.tradeId)));
    }
  };

  const handleToggleItem = (tradeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };

  // Bulk remove selected items
  const handleRemoveSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`คุณต้องการลบสินค้าที่เลือกจำนวน ${selectedIds.size} รายการออกจากตะกร้าใช่หรือไม่?`)) {
      removeItems(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Calculations for only the selected items
  const selectedItems = items.filter((item) => selectedIds.has(item.tradeId));
  const validSelectedItems = selectedItems.filter((item) => item.qty > 0);
  const selectedTotalAmount = validSelectedItems.reduce((sum, item) => sum + item.qty * item.salePrice, 0);
  const selectedTotalDeposit = validSelectedItems.reduce((sum, item) => {
    const unitDeposit = item.depositPrice && item.depositPrice > 0 ? item.depositPrice : 0;
    return sum + unitDeposit * item.qty;
  }, 0);
  const selectedTotalRemaining = Math.max(0, selectedTotalAmount - selectedTotalDeposit);
  const isAllSelectedZero = selectedItems.length > 0 && validSelectedItems.length === 0;

  // Handle proceed to checkout (checkout only valid items with qty > 0)
  const handleCheckout = () => {
    const validItems = selectedItems.filter((item) => item.qty > 0);
    if (validItems.length === 0) return;
    const selectedArr = validItems.map((i) => i.tradeId);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('ubr_direct_checkout');
        sessionStorage.setItem('ubr_cart_selected_ids', JSON.stringify(selectedArr));
        sessionStorage.setItem('ubr_checkout_from', 'cart');
      } catch { }
    }
    router.push('/checkout');
  };

  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white py-16 sm:py-24 min-h-[calc(100vh-200px)] min-h-[calc(100dvh-200px)] pb-32">
        <WineLoading size="md" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-white py-3 sm:py-8 min-h-[calc(100vh-120px)] min-h-[calc(100dvh-120px)] pb-24 sm:pb-36">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-6">
          {/* Page Title Header */}
          <div className="pb-2.5 sm:pb-3 border-b border-slate-200/80 animate-cart-slide-up">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <CartIllustration className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 drop-shadow-xs" />
              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                ตะกร้าสินค้า
              </h1>
            </div>
          </div>

          {/* Empty Cart Card */}
          <div className="bg-white rounded-[14px] apple-squircle-card border border-slate-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] py-16 sm:py-24 px-4 text-center flex flex-col items-center justify-center space-y-4 animate-cart-slide-up">
            <div className="flex items-center justify-center">
              <EmptyCartIllustration className="w-36 h-36 sm:w-40 sm:h-40" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                ยังไม่มีสินค้าในตะกร้า
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                คุณยังไม่ได้เพิ่มสินค้าลงในตะกร้า
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-2.5 rounded-full bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ไปเลือกซื้อสินค้า</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white pt-5 sm:pt-8 min-h-[calc(100vh+80px)] min-h-[calc(100dvh+80px)] pb-24 sm:pb-36">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-6 pb-16">

        {/* Page Title Header */}
        <div className="pb-2.5 sm:pb-3 border-b border-slate-200/80 animate-cart-slide-up">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <CartIllustration className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 drop-shadow-xs" />
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ตะกร้าสินค้า ({totalQty})
            </h1>
          </div>
        </div>

        {/* Product Items & Header Card with crisp border and apple-squircle rounded corners */}
        <div
          className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden animate-cart-slide-up"
          style={{ animationDelay: '40ms' }}
        >
          {/* Top Table Header Row */}
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-100 bg-white select-none">
            {/* Left: Checkbox + สินค้า */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="header-select-all"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 rounded-[4px] border-slate-300 text-black focus:ring-black accent-black cursor-pointer shrink-0"
              />
              <label htmlFor="header-select-all" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight cursor-pointer select-none">
                รายการสินค้า
              </label>
            </div>

            {/* Right Columns: จำนวน | หน่วย | ราคาต่อหน่วย | ราคารวม | ยอดมัดจำ | แอคชั่น */}
            <div className="hidden sm:grid grid-cols-6 gap-2 text-xs text-slate-400 font-normal text-center select-none w-[58%]">
              <span className="text-center">จำนวน</span>
              <span className="text-center">หน่วย</span>
              <span className="text-center">ราคาต่อหน่วย</span>
              <span className="text-center text-[#FF6B00] font-semibold">ราคารวม</span>
              <span className="text-center text-[#FF0000] font-semibold">ยอดมัดจำ</span>
              <span className="text-center">แอคชั่น</span>
            </div>
          </div>

          {/* DESKTOP ITEMS VIEW (>= 640px) matching screenshot */}
          <div className="hidden sm:block divide-y divide-slate-100">
            {items.map((item) => {
              const lineTotal = item.qty * item.salePrice;
              const isSelected = selectedIds.has(item.tradeId);
              const unitDeposit = item.depositPrice && item.depositPrice > 0 ? item.depositPrice : 0;
              const lineDeposit = unitDeposit * item.qty;

              return (
                <div
                  key={item.tradeId}
                  className={`px-6 flex items-center justify-between transition-colors ${item.qty <= 0 ? 'pt-5 pb-8' : 'py-5'
                    } ${isSelected ? 'bg-white' : 'bg-slate-50/40 opacity-75'
                    }`}
                >
                  {/* Left Column: Checkbox + Image + Details */}
                  <div className="flex items-center gap-4 flex-1 pr-6 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item.tradeId)}
                      className="w-4 h-4 rounded-[4px] border-slate-300 text-black focus:ring-black accent-black cursor-pointer shrink-0"
                    />

                    {/* Product Image */}
                    <Link
                      href={`/products/${encodeURIComponent(item.tradeId)}`}
                      className="w-20 h-20 bg-white border border-slate-200 rounded-[10px] apple-squircle-sm shrink-0 flex items-center justify-center overflow-hidden shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <ProductImage
                        src={item.image || '/images/ubr_beverage_logo.png'}
                        alt={item.tradeName}
                        objectFit="auto"
                        className="w-full h-full"
                        priority={true}
                        fallbackSrc="/images/ubr_beverage_logo.png"
                      />
                    </Link>

                    {/* Product Title, Badges and Variation */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/products/${encodeURIComponent(item.tradeId)}`}
                        className="text-sm font-bold text-slate-900 leading-snug line-clamp-2"
                      >
                        {item.tradeName}
                      </Link>
                      {item.tradeNameEN && (
                        <p className="text-[11px] text-slate-400 truncate italic">
                          {item.tradeNameEN}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                        <span>SKU: <span className="text-slate-600">{item.tradeId}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Right Columns: จำนวน, หน่วย, ราคาต่อหน่วย, ราคารวม, ยอดมัดจำ, แอคชั่น */}
                  <div className="grid grid-cols-6 gap-2 items-center w-[58%] text-center shrink-0">
                    {/* 1. จำนวน */}
                    <div className="flex justify-center">
                      <div className="relative inline-flex flex-col items-center">
                        <div className={`inline-flex items-center border ${item.qty <= 0 ? 'border-red-400 ring-1 ring-red-400/30' : 'border-slate-300'} rounded-[8px] apple-squircle-xs bg-white h-8 overflow-hidden shadow-2xs`}>
                          <button
                            type="button"
                            onClick={() => updateQty(item.tradeId, Math.max(0, item.qty - 1))}
                            className="w-7 h-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-normal text-xs cursor-pointer select-none transition-colors rounded-none"
                            aria-label="ลดจำนวน"
                          >
                            -
                          </button>
                          <QuantityInput
                            value={item.qty}
                            onChange={(val) => updateQty(item.tradeId, val)}
                            min={1}
                            className="w-10 sm:w-11 h-full text-center text-xs sm:text-sm font-normal text-slate-900 border-x border-slate-200 outline-none focus:bg-slate-50 rounded-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(item.tradeId, item.qty + 1)}
                            className="w-7 h-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-normal text-xs cursor-pointer select-none transition-colors rounded-none"
                            aria-label="เพิ่มจำนวน"
                          >
                            +
                          </button>
                        </div>
                        {item.qty <= 0 && (
                          <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-[10px] sm:text-[11px] leading-tight text-red-600 font-normal text-center w-[140px] sm:w-[150px] pointer-events-none z-10">
                            กรุณาระบุจำนวนมากกว่า 0
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 2. หน่วย */}
                    <div className="text-center">
                      <span className="text-sm font-medium text-slate-700">
                        {item.unitName || 'หน่วย'}
                      </span>
                    </div>

                    {/* 3. ราคาต่อหน่วย */}
                    <div className="text-center space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums block">
                        ฿{item.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* 4. ราคารวม */}
                    <div className="text-center space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold text-[#FF6B00] tabular-nums block">
                        ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* 4. ยอดมัดจำ */}
                    <div className="text-center space-y-0.5">
                      <span className="text-sm font-bold text-[#FF0000] tabular-nums block">
                        ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {unitDeposit > 0 && item.qty > 1 && (
                        <span className="text-xs sm:text-[13px] text-[#FF0000] font-medium block">
                          (฿{formatDepositPrice(unitDeposit)}/{item.unitName || 'หน่วย'})
                        </span>
                      )}
                    </div>

                    {/* 5. แอคชั่น */}
                    <div className="text-center flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.tradeId)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer group inline-flex items-center justify-center"
                        title="ลบสินค้านี้"
                        aria-label="ลบสินค้านี้"
                      >
                        <TrashIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* MOBILE ITEMS VIEW (< 640px) */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {items.map((item) => {
              const lineTotal = item.qty * item.salePrice;
              const isSelected = selectedIds.has(item.tradeId);
              const unitDeposit = item.depositPrice && item.depositPrice > 0 ? item.depositPrice : 0;
              const lineDeposit = unitDeposit * item.qty;

              return (
                <div
                  key={item.tradeId}
                  className={`p-4 space-y-3 transition-colors ${isSelected ? 'bg-white' : 'bg-slate-50/40 opacity-70'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item.tradeId)}
                      className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black accent-black cursor-pointer shrink-0"
                    />

                    <div className="w-16 h-16 bg-white border border-slate-100 apple-squircle-sm shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                      <img
                        src={
                          item.image
                            ? item.image.startsWith('/') || item.image.startsWith('http')
                              ? item.image
                              : `/${item.image}`
                            : '/images/ubr_beverage_logo.png'
                        }
                        alt={item.tradeName}
                        className={`w-full h-full ${!item.image || item.image.includes('ubr_beverage_logo')
                            ? 'object-cover'
                            : 'object-contain p-1'
                          }`}
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.src = '/images/ubr_beverage_logo.png';
                          el.className = 'w-full h-full object-cover';
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                        {item.tradeName}
                      </h4>
                      {item.tradeNameEN && (
                        <p className="text-[11px] text-slate-400 truncate italic">
                          {item.tradeNameEN}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                        <span>SKU: <span className="text-slate-600">{item.tradeId}</span></span>
                        <span>•</span>
                        <span>หน่วย: <strong className="text-slate-700">{item.unitName || 'หน่วย'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Column Stats Row: จำนวน | ราคา/หน่วย | ราคารวม | ยอดมัดจำ */}
                  <div className={`grid grid-cols-4 gap-1 items-start text-center pt-2 px-0.5 border-t border-slate-100 transition-all ${item.qty <= 0 ? 'pb-8' : 'pb-2'}`}>
                    {/* Col 1: จำนวน (Quantity Stepper) */}
                    <div className="flex flex-col items-center justify-start min-w-0">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-none truncate">
                          จำนวน
                        </span>
                      </div>
                      <div className="h-8 flex items-center justify-center mt-1">
                        <div className="relative inline-flex flex-col items-center">
                          <div className={`inline-flex items-center border ${item.qty <= 0 ? 'border-red-400 ring-1 ring-red-400/30' : 'border-slate-300'} apple-squircle-xs bg-white overflow-hidden shadow-2xs h-8`}>
                            <button
                              type="button"
                              onClick={() => updateQty(item.tradeId, Math.max(0, item.qty - 1))}
                              className="w-7.5 h-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-normal text-sm cursor-pointer select-none transition-colors rounded-none"
                              aria-label="ลดจำนวน"
                            >
                              -
                            </button>
                            <QuantityInput
                              value={item.qty}
                              onChange={(val) => updateQty(item.tradeId, val)}
                              min={1}
                              className="w-9 h-full text-center font-normal text-xs sm:text-sm text-slate-900 border-x border-slate-200 outline-none rounded-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQty(item.tradeId, item.qty + 1)}
                              className="w-7.5 h-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-normal text-sm cursor-pointer select-none transition-colors rounded-none"
                              aria-label="เพิ่มจำนวน"
                            >
                              +
                            </button>
                          </div>
                          {item.qty <= 0 && (
                            <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] leading-tight text-red-600 font-normal text-center w-[125px] pointer-events-none z-10">
                              กรุณาระบุจำนวนมากกว่า 0
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: ราคา/หน่วย */}
                    <div className="flex flex-col items-center justify-start min-w-0">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-none truncate">
                          ราคา/หน่วย
                        </span>
                      </div>
                      <div className="h-8 flex items-center justify-center mt-1">
                        <span className="block text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                          ฿{item.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Col 3: ราคารวม */}
                    <div className="flex flex-col items-center justify-start min-w-0">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] sm:text-xs font-bold text-[#FF6B00] leading-none truncate">
                          ราคารวม
                        </span>
                      </div>
                      <div className="h-8 flex items-center justify-center mt-1">
                        <span className="block text-xs sm:text-sm font-bold text-[#FF6B00] tabular-nums">
                          ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Col 4: ยอดมัดจำ */}
                    <div className="flex flex-col items-center justify-start min-w-0">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] sm:text-xs font-bold text-[#FF0000] leading-none truncate">
                          ยอดมัดจำ
                        </span>
                      </div>
                      <div className="h-8 flex flex-col items-center justify-center mt-1">
                        <span className="block text-xs sm:text-sm font-bold text-[#FF0000] tabular-nums leading-tight">
                          ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {unitDeposit > 0 && item.qty > 1 && (
                          <span className="text-[10px] sm:text-xs text-[#FF0000] font-medium leading-none mt-0.5 truncate">
                            (฿{formatDepositPrice(unitDeposit)}/{item.unitName || 'หน่วย'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Delete Action */}
                  <div className="pt-2 border-t border-slate-100/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item.tradeId)}
                      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-red-600 text-xs font-medium transition-colors cursor-pointer py-1 group"
                      title="ลบสินค้านี้"
                      aria-label="ลบสินค้านี้"
                    >
                      <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Bottom Bar: Select All, Delete Selected, & Total Items Count (Integrated into items card matching /checkout) */}
          <div className="border-t border-dashed border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-row items-center justify-between gap-2 sm:gap-4 bg-white">
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              <label className="inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded-[4px] border-slate-300 text-black focus:ring-black accent-black cursor-pointer shrink-0"
                />
                <span>เลือกทั้งหมด ({items.length})</span>
              </label>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 transition-colors cursor-pointer group whitespace-nowrap"
                >
                  <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform shrink-0" />
                  <span>ลบ ({selectedIds.size})</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end text-right shrink-0 whitespace-nowrap">
              <span className="text-xs sm:text-sm text-slate-600">
                สินค้าทั้งหมด ({totalQty} ชิ้น)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar: "< เลือกดูสินค้าต่อ" matching /checkout */}
        <div
          className="flex items-center justify-between gap-4 pt-1 animate-cart-slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <span>&lt; เลือกดูสินค้าต่อ</span>
          </Link>

          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span>เลือก {selectedItems.length} จาก {items.length} รายการ</span>
          </div>
        </div>

        {/* Order Summary & Submit Card with crisp border and apple-squircle rounded corners matching /checkout */}
        <div
          className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden animate-cart-slide-up"
          style={{ animationDelay: '140ms' }}
        >
          {/* Financial Summary */}
          <div className="p-4 sm:p-6 bg-white space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              สรุปยอดคำสั่งซื้อ
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              {/* 1. ยอดรวมทั้งสิ้น (Grand Total) */}
              <div className="flex justify-between items-center font-bold text-[#FF6B00]">
                <span>ยอดรวมทั้งสิ้น (Grand Total)</span>
                <span className="text-[#FF6B00] font-bold tabular-nums">
                  ฿{selectedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed border-slate-200 my-2" />

              {/* 2. ยอดมัดจำที่ต้องชำระ (Deposit) */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#FF0000]">ยอดมัดจำที่ต้องชำระ (Deposit)</span>
                <span className="text-xl sm:text-2xl font-bold text-[#FF0000] tabular-nums">
                  ฿{selectedTotalDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* 3. ยอดคงเหลือชำระเมื่อรับมอบ / Remaining */}
              <div className="flex justify-between items-center text-slate-400">
                <span>ยอดคงเหลือชำระเมื่อรับมอบ / Remaining</span>
                <span className="text-slate-500 font-medium tabular-nums">
                  ฿{selectedTotalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Dashed Line Divider before bottom action bar */}
          <div className="border-t border-dashed border-slate-200" />

          {/* Bottom Action Footer: Button on right */}
          <div className="p-4 sm:px-6 sm:py-5 flex justify-end bg-white">
            {selectedIds.size === 0 ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-12 sm:px-14 py-3.5 min-h-[48px] rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed shadow-none"
              >
                <span>ดำเนินการสั่งซื้อ</span>
              </button>
            ) : isAllSelectedZero ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-8 sm:px-12 py-3.5 min-h-[48px] rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed shadow-none"
              >
                <span>โปรดระบุจำนวน &gt; 0</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full sm:w-auto px-12 sm:px-14 py-3.5 min-h-[48px] rounded-full bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold text-sm sm:text-base shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] whitespace-nowrap"
              >
                <span>ดำเนินการสั่งซื้อ</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
