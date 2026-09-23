'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingCart, ArrowLeft, X
} from 'lucide-react';
import { EmptyCartIllustration } from '@/components/EmptyCartIllustration';

const CART_SELECTION_STORAGE_KEY = 'ubr_cart_selected_trade_ids';

export default function CartPage() {
  const router = useRouter();
  const { customer, openLoginModal } = useAuth();
  const { items, updateQty, removeItem, removeItems } = useCart();

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
        const saved = localStorage.getItem(CART_SELECTION_STORAGE_KEY);
        if (saved !== null) {
          const parsed: string[] = JSON.parse(saved);
          const currentTradeIds = new Set(items.map((i) => i.tradeId));
          // Respect user's saved selection (even if empty []), filtered by currently available items
          const validSaved = parsed.filter((id) => currentTradeIds.has(id));
          setSelectedIds(new Set(validSaved));
        } else {
          // First time opening cart without any prior saved choice: select all items
          setSelectedIds(new Set(items.map((i) => i.tradeId)));
        }
      } catch {
        setSelectedIds(new Set(items.map((i) => i.tradeId)));
      } finally {
        setIsSelectionLoaded(true);
        prevItemsRef.current = items;
      }
      return;
    }

    // 2. Subsequent updates when items list changes (items added or deleted)
    const prevIds = new Set(prevItemsRef.current.map((i) => i.tradeId));
    const currentIds = new Set(items.map((i) => i.tradeId));
    const newlyAddedIds = items.filter((i) => !prevIds.has(i.tradeId)).map((i) => i.tradeId);

    // Only update selection if items were actually added or removed
    if (prevItemsRef.current.length !== items.length || newlyAddedIds.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set<string>();
        // Keep existing selections that still exist in cart
        prev.forEach((id) => {
          if (currentIds.has(id)) {
            next.add(id);
          }
        });
        // Auto-select brand-new items added to cart
        newlyAddedIds.forEach((id) => {
          next.add(id);
        });
        return next;
      });
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
  const selectedTotalQty = validSelectedItems.reduce((sum, item) => sum + item.qty, 0);
  const selectedTotalAmount = validSelectedItems.reduce((sum, item) => sum + item.qty * item.salePrice, 0);
  const selectedTotalDeposit = validSelectedItems.reduce((sum, item) => {
    const unitDeposit = item.depositPrice && item.depositPrice > 0 ? item.depositPrice : 0;
    return sum + unitDeposit * item.qty;
  }, 0);
  const selectedRemainingAmount = selectedTotalAmount - selectedTotalDeposit;
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
        if (!customer) {
          sessionStorage.setItem('ubr_pending_checkout_merge', 'true');
        }
      } catch {}
    }
    const target = `/checkout?from=cart&items=${encodeURIComponent(selectedArr.join(','))}`;
    if (customer) {
      router.push(target);
    } else {
      openLoginModal(() => router.push(target));
    }
  };

  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col bg-[#f5f5f5] py-8 sm:py-12">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-slate-100 p-8 min-h-[400px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-[#f5f5f5] py-8 sm:py-12">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-slate-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] py-16 sm:py-24 px-4 text-center flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center">
              <EmptyCartIllustration className="w-36 h-36 sm:w-40 sm:h-40" />
            </div>
            
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                ยังไม่มีสินค้าในตะกร้า
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                คุณยังไม่ได้เพิ่มสินค้าลงในตะกร้า
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-2.5 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
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
    <div className="flex-1 flex flex-col bg-[#f5f5f5] py-6 sm:py-8">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5 pb-16">
        
        {/* Page Title Header */}
        <div className="pb-3 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ตะกร้าสินค้า
          </h1>
        </div>

        {/* 1. Top Table Header Card (Desktop only, matching Shopee screenshot) */}
        <div className="hidden sm:flex items-center justify-between bg-white rounded-sm border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] px-6 py-3.5">
          {/* Left: Checkbox + สินค้า */}
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              id="header-select-all"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-[#c81415] focus:ring-[#c81415] accent-[#c81415] cursor-pointer"
            />
            <label htmlFor="header-select-all" className="text-sm font-semibold text-slate-800 cursor-pointer select-none">
              สินค้า
            </label>
          </div>

          {/* Right Columns: จำนวน | ราคาต่อหน่วย | ราคารวม | ยอดมัดจำ | แอคชั่น */}
          <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-slate-500 text-center select-none w-[58%]">
            <span className="text-center">จำนวน</span>
            <span className="text-center">ราคาต่อหน่วย</span>
            <span className="text-center">ราคารวม</span>
            <span className="text-center">ยอดมัดจำ</span>
            <span className="text-center">แอคชั่น</span>
          </div>
        </div>

        {/* 2. Product Items Container Card */}
        <div className="bg-white rounded-sm border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] overflow-hidden">
          


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
                  className={`px-6 flex items-center justify-between transition-colors ${
                    item.qty <= 0 ? 'pt-5 pb-8' : 'py-5'
                  } ${
                    isSelected ? 'bg-white' : 'bg-slate-50/40 opacity-75'
                  }`}
                >
                  {/* Left Column: Checkbox + Image + Details */}
                  <div className="flex items-start gap-4 flex-1 pr-6 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item.tradeId)}
                      className="w-4 h-4 rounded border-slate-300 text-[#c81415] focus:ring-[#c81415] accent-[#c81415] cursor-pointer mt-1 shrink-0"
                    />

                    {/* Product Image */}
                    <Link
                      href={`/products/${encodeURIComponent(item.tradeId)}`}
                      className="w-20 h-20 bg-white border border-slate-100 rounded-sm shrink-0 p-1 flex items-center justify-center overflow-hidden shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <img
                        src={
                          item.image
                            ? item.image.startsWith('/')
                              ? item.image
                              : `/${item.image}`
                            : '/images/ubr_beverage_logo.png'
                        }
                        alt={item.tradeName}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
                        }}
                      />
                    </Link>

                    {/* Product Title, Badges and Variation */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/products/${encodeURIComponent(item.tradeId)}`}
                        className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-[#c81415] transition-colors"
                      >
                        {item.tradeName}
                      </Link>
                      {item.tradeNameEN && (
                        <p className="text-[11px] text-slate-400 truncate italic">
                          {item.tradeNameEN}
                        </p>
                      )}

                      {unitDeposit > 0 && (
                        <div className="pt-0.5">
                          <span className="text-[10px] text-red-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-[2px] font-medium">
                            มัดจำ ฿{unitDeposit.toLocaleString()}/{item.unitName || 'หน่วย'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Columns: จำนวน, ราคาต่อหน่วย, ราคารวม, ยอดมัดจำ, แอคชั่น */}
                  <div className="grid grid-cols-5 gap-2 items-center w-[58%] text-center shrink-0">
                    {/* 1. จำนวน */}
                    <div className="flex justify-center">
                      <div className="relative inline-flex flex-col items-center">
                        <div className={`inline-flex items-center border ${item.qty <= 0 ? 'border-red-400 ring-1 ring-red-400/30' : 'border-slate-300'} rounded-none bg-white h-8 overflow-hidden shadow-2xs`}>
                          <button
                            type="button"
                            onClick={() => updateQty(item.tradeId, Math.max(0, item.qty - 1))}
                            className="w-7 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 font-bold text-xs cursor-pointer select-none transition-colors rounded-none"
                            aria-label="ลดจำนวน"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            value={item.qty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10);
                              updateQty(item.tradeId, val);
                            }}
                            className="w-10 sm:w-11 h-full text-center text-xs font-semibold text-slate-900 border-x border-slate-200 outline-none focus:bg-slate-50 rounded-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(item.tradeId, item.qty + 1)}
                            className="w-7 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 font-bold text-xs cursor-pointer select-none transition-colors rounded-none"
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

                    {/* 2. ราคาต่อหน่วย */}
                    <div className="text-center space-y-0.5">
                      <span className="text-sm font-medium text-slate-700 tabular-nums block">
                        ฿{item.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* 3. ราคารวม */}
                    <div className="text-center space-y-0.5">
                      <span className="text-sm font-semibold text-slate-900 tabular-nums block">
                        ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* 4. ยอดมัดจำ */}
                    <div className="text-center space-y-0.5">
                      <span className="text-sm font-bold text-[#c81415] tabular-nums block">
                        ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {unitDeposit > 0 && item.qty > 1 && (
                        <span className="text-[10px] text-slate-400 font-medium block">
                          (฿{unitDeposit.toLocaleString()}/{item.unitName || 'หน่วย'})
                        </span>
                      )}
                    </div>

                    {/* 5. แอคชั่น */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.tradeId)}
                        className="text-xs font-medium text-slate-700 hover:text-[#c81415] transition-colors cursor-pointer hover:underline"
                      >
                        ลบ
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
                  className={`p-4 space-y-3 transition-colors ${
                    isSelected ? 'bg-white' : 'bg-slate-50/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(item.tradeId)}
                      className="w-4 h-4 rounded border-slate-300 text-[#c81415] focus:ring-[#c81415] accent-[#c81415] cursor-pointer mt-1 shrink-0"
                    />

                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-sm shrink-0 flex items-center justify-center p-1 overflow-hidden shadow-2xs">
                      <img
                        src={
                          item.image
                            ? item.image.startsWith('/')
                              ? item.image
                              : `/${item.image}`
                            : '/images/ubr_beverage_logo.png'
                        }
                        alt={item.tradeName}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
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
                    </div>
                  </div>

                  {/* 4-Column Stats Row: จำนวน: | ราคาต่อหน่วย: | ราคารวม: | ยอดมัดจำ: */}
                  <div className={`grid grid-cols-4 gap-1.5 items-start text-center pt-2 px-1 border-t border-slate-100 transition-all ${item.qty <= 0 ? 'pb-8' : 'pb-2'}`}>
                    {/* Col 1: จำนวน: (Quantity Stepper) */}
                    <div className="flex flex-col items-center justify-start">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-slate-800 leading-none">
                          จำนวน:
                        </span>
                      </div>
                      <div className="h-7 flex items-center justify-center mt-1">
                        <div className="relative inline-flex flex-col items-center">
                          <div className={`inline-flex items-center border ${item.qty <= 0 ? 'border-red-400 ring-1 ring-red-400/30' : 'border-slate-300'} rounded-none bg-white overflow-hidden shadow-2xs h-7`}>
                            <button
                              type="button"
                              onClick={() => updateQty(item.tradeId, Math.max(0, item.qty - 1))}
                              className="w-6 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer active:bg-slate-200 select-none rounded-none"
                              aria-label="ลดจำนวน"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value.replace(/[^0-9]/g, '') || '0', 10);
                                updateQty(item.tradeId, val);
                              }}
                              className="w-8 h-full text-center font-bold text-xs text-slate-900 border-x border-slate-200 outline-none rounded-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQty(item.tradeId, item.qty + 1)}
                              className="w-6 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer active:bg-slate-200 select-none rounded-none"
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

                    {/* Col 2: ราคาต่อหน่วย: */}
                    <div className="flex flex-col items-center justify-start">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-slate-800 leading-none">
                          ราคาต่อหน่วย:
                        </span>
                      </div>
                      <div className="h-7 flex items-center justify-center mt-1">
                        <span className="block text-xs font-bold text-slate-900 tabular-nums">
                          ฿{item.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Col 3: ราคารวม: */}
                    <div className="flex flex-col items-center justify-start">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-slate-800 leading-none">
                          ราคารวม:
                        </span>
                      </div>
                      <div className="h-7 flex items-center justify-center mt-1">
                        <span className="block text-xs font-bold text-slate-900 tabular-nums">
                          ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Col 4: ยอดมัดจำ: */}
                    <div className="flex flex-col items-center justify-start">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-slate-800 leading-none">
                          ยอดมัดจำ:
                        </span>
                      </div>
                      <div className="h-7 flex flex-col items-center justify-center mt-1">
                        <span className="block text-xs font-bold text-[#c81415] tabular-nums leading-tight">
                          ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {unitDeposit > 0 && item.qty > 1 && (
                          <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                            (฿{unitDeposit.toLocaleString()}/{item.unitName || 'หน่วย'})
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
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600 text-xs font-medium transition-colors cursor-pointer py-0.5"
                      title="ลบสินค้านี้"
                      aria-label="ลบสินค้านี้"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>ลบรายการ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* 3. Sticky Bottom Bar (Shopee Checkout Bar matching screenshot & /checkout) */}
        <div className="sticky bottom-0 z-30 bg-white border border-slate-200/90 rounded-sm shadow-[0_-4px_16px_rgba(0,0,0,0.08)] mt-6 overflow-hidden">
          <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left Actions: Checkbox All, Delete Selected, Continue Shopping */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#c81415] focus:ring-[#c81415] accent-[#c81415] cursor-pointer"
                />
                <span>เลือกทั้งหมด ({items.length})</span>
              </label>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className="text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                >
                  ลบ ({selectedIds.size})
                </button>
              )}

              <Link
                href="/"
                className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
              >
                <span>&lt; เลือกดูสินค้าต่อ</span>
              </Link>
            </div>

            {/* Right Financials & Checkout CTA Button */}
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-right space-y-1">
                {/* 1. ยอดรวมทั้งสิ้น (Grand Total) */}
                <div className="flex items-center gap-3 justify-end text-xs sm:text-sm font-bold text-slate-900">
                  <span>ยอดรวมทั้งสิ้น (Grand Total)</span>
                  <span className="tabular-nums">
                    ฿{selectedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* เส้นคั่นประ */}
                <div className="border-t border-dashed border-slate-200" />

                {/* 2. ยอดมัดจำที่ต้องชำระ (Deposit) */}
                <div className="flex items-baseline gap-3 justify-end">
                  <span className="text-xs sm:text-sm font-bold text-[#c81415]">
                    ยอดมัดจำที่ต้องชำระ (Deposit)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#c81415] tabular-nums">
                    ฿{selectedTotalDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              {selectedIds.size === 0 ? (
                <button
                  type="button"
                  disabled
                  className="px-8 sm:px-12 py-3.5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed whitespace-nowrap shadow-none"
                >
                  <span>สั่งสินค้า</span>
                </button>
              ) : isAllSelectedZero ? (
                <button
                  type="button"
                  disabled
                  className="px-8 sm:px-12 py-3.5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed whitespace-nowrap shadow-none"
                >
                  <span>โปรดระบุจำนวน &gt; 0</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="px-10 sm:px-14 py-3.5 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold text-sm sm:text-base shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] whitespace-nowrap"
                >
                  <span>สั่งสินค้า</span>
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
