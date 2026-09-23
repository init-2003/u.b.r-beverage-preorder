'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/preorder';
import { Package, Check, ShoppingCart } from 'lucide-react';
import { EmptySearchIllustration } from './EmptySearchIllustration';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import DraggableCartButton from './DraggableCartButton';

interface ProductCatalogProps {
  products: Product[];
  loadingProducts: boolean;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function ProductCatalog({
  products,
  loadingProducts,
  selectedCategory: propSelectedCategory,
  onSelectCategory,
  searchQuery: propSearchQuery,
  onSearchChange,
}: ProductCatalogProps) {
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const [internalSearch, setInternalSearch] = useState<string>('');

  const activeCategory = propSelectedCategory ?? internalCategory;
  const activeSearch = propSearchQuery ?? internalSearch;

  const handleSearchInputChange = (val: string) => {
    setInternalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Cart & Auth context
  const router = useRouter();
  const { customer, openLoginModal } = useAuth();
  const { addItem, totalQty } = useCart();
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const handleAddToCart = (product: Product) => {
    addItem(
      {
        tradeId: product.id,
        tradeName: product.name,
        tradeNameEN: product.nameEN,
        unitName: product.unitName || '',
        typeName: product.category,
        salePrice: product.price,
        depositPrice: product.depositPrice,
        image: product.imageUrl,
      },
      1
    );

    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1200);
  };

  const handleDirectOrder = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'ubr_direct_checkout',
          JSON.stringify({
            productId: product.id,
            qty: 1,
            from: 'catalog',
            productName: product.name,
          })
        );
        if (!customer) {
          sessionStorage.setItem('ubr_pending_checkout_merge', 'true');
        }
      } catch { }
    }
    const target = `/checkout?from=catalog&productId=${encodeURIComponent(product.id)}&qty=1`;
    if (customer) {
      router.push(target);
    } else {
      openLoginModal(() => router.push(target));
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === 'all' ||
      activeCategory === 'Pre Order' ||
      product.category === activeCategory ||
      product.name.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch =
      !activeSearch.trim() ||
      product.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      (product.origin && product.origin.toLowerCase().includes(activeSearch.toLowerCase())) ||
      product.id.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">

      {/* Top Banner (Burgundy Luxury Theme) */}
      <div className="bg-gradient-to-r from-[#2d040a] via-[#42070f] to-[#2d040a] text-slate-100 rounded-sm p-6 sm:p-8 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-red-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/80 text-amber-300 text-[11px] font-bold uppercase tracking-wider rounded-sm border border-amber-500/30">
              <span>พรีออเดอร์เครื่องดื่มพรีเมียมนำเข้า • อุบลรุ่งเรือง เบฟเวอเรจ</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white italic">
              Ubon Rung Rueang Beverage
            </h1>
            <p className="text-red-200/90 text-xs sm:text-sm leading-relaxed">
              เรานำเข้าเครื่องดื่มชั้นเลิศจากต่างประเทศโดยตรง ชำระค่ามัดจำขั้นต้น (30-50%) และรอส่งตรงถึงคลังสินค้า
              เมื่อสินค้าผ่านด่านศุลกากรมาถึงคลังไทยแล้ว ค่อยชำระส่วนที่เหลือเพื่อส่งด่วนถึงบ้านท่าน!
            </p>
          </div>
        </div>
      </div>

      {/* Active Search Results Feedback */}
      {activeSearch && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-700 bg-white px-4 py-2 rounded-sm border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)]">
            <span>ผลการค้นหาสำหรับ: <strong className="text-slate-950 font-bold">&quot;{activeSearch}&quot;</strong></span>
            <button
              type="button"
              onClick={() => {
                handleSearchInputChange('');
              }}
              className="text-xs text-red-700 hover:text-red-900 font-semibold underline cursor-pointer ml-1"
            >
              ล้างการค้นหา
            </button>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium ml-auto">
            <span>พบสินค้า</span>
            <strong className="text-red-900 font-bold">{filteredProducts.length}</strong>
            <span>รายการ</span>
          </div>
        </div>
      )}

      {/* Product Cards Grid (Clean Crisp White Cards - 5 Columns on Desktop) */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-80 rounded-sm bg-white border border-slate-100/80 animate-pulse shadow-[0_1px_1px_0_rgba(0,0,0,0.05)]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="min-h-[380px] sm:min-h-[440px] rounded-sm bg-white border border-slate-100/80 text-center flex flex-col items-center justify-center space-y-4 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] p-8 sm:p-12 my-2">
          <div className="flex items-center justify-center mx-auto">
            <EmptySearchIllustration className="w-36 h-36 sm:w-40 sm:h-40" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">ไม่พบสินค้าที่ค้นหา</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              ลองปรับเปลี่ยนคำค้นหา หรือเลือกดูหมวดหมู่อื่น
            </p>
          </div>
          {(activeSearch || (activeCategory && activeCategory !== 'all')) && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  handleSearchInputChange('');
                  if (onSelectCategory) onSelectCategory('all');
                  setInternalCategory('all');
                }}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>ดูสินค้าทั้งหมด</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {filteredProducts.map((product) => {
            const depositAmt = (product.depositPrice && product.depositPrice > 0)
              ? product.depositPrice
              : 0;

            return (
              <div
                key={product.id}
                className="rounded-sm bg-white border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] hover:shadow-md hover:border-slate-200 p-3 sm:p-3.5 flex flex-col justify-between group transition-all duration-200 relative"
              >
                <div>
                  {/* Product Image Box (Centered, Object Contain, Advice Style) */}
                  <Link
                    href={`/products/${product.id}`}
                    className="w-full aspect-square flex items-center justify-center p-2 mb-2 relative overflow-hidden group/img block cursor-pointer bg-white"
                  >
                    {/* Yellow Sticker Badge (Advice Style) */}
                    {product.depositPercent > 0 && (
                      <div
                        className="absolute top-1 right-1 z-10 flex flex-col items-center justify-center bg-[#ffe01b] border border-amber-300 rounded-sm px-1.5 py-0.5 shadow-2xs shrink-0 select-none"
                        title={`มัดจำ ${product.depositPercent}%`}
                      >
                        <span className="text-[9px] font-bold text-slate-800 leading-tight">มัดจำ</span>
                        <span className="text-[11px] font-black text-blue-700 leading-none mt-0.5">{product.depositPercent}%</span>
                      </div>
                    )}

                    <img
                      src={product.imageUrl ? (product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`) : '/images/ubr_beverage_logo.png'}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
                      }}
                    />
                  </Link>

                  {/* Product Name (Clean 2-line title) */}
                  <div className="space-y-1 mb-2">
                    <Link href={`/products/${product.id}`} className="block group/title">
                      <h3 className="text-sm font-normal text-slate-800 line-clamp-2 min-h-[38px] leading-snug group-hover/title:text-red-600 transition-colors" title={product.name}>
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                </div>

                {/* Bottom Section: Price, Deposit & Action Buttons */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {/* Price Tag (Red font as shown in example image) */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base sm:text-lg font-bold text-[#e02020]">
                        ฿{(product.price || 0).toLocaleString()}
                      </span>
                    </div>

                    {depositAmt > 0 && (
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                        มัดจำล่วงหน้า ฿{depositAmt.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons: Add to Cart (Icon only) + กดสั่ง */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {/* ปุ่มเพิ่มลงในตะกร้า (พื้นหลังสีดำ ไอคอนสีขาว ทรงกลมแคปซูล) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className={`h-9 w-9 shrink-0 rounded-full font-bold text-xs flex items-center justify-center transition-all duration-150 active:scale-80 border cursor-pointer select-none ${addedProductId === product.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-black hover:bg-neutral-800 text-white border-black shadow-2xs'
                        }`}
                      title={addedProductId === product.id ? 'เพิ่มลงในตะกร้าแล้ว' : 'เพิ่มลงในตะกร้า'}
                      aria-label="เพิ่มลงในตะกร้า"
                    >
                      {addedProductId === product.id ? (
                        <Check className="w-4 h-4 text-white stroke-[3] animate-pop-check" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* ปุ่ม Pre Order พร้อมอนิเมชันเวลากด */}
                    <button
                      type="button"
                      onClick={(e) => handleDirectOrder(e, product)}
                      className="flex-1 h-9 py-2 px-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-150 bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 select-none"
                      title="Pre Order"
                    >
                      <span>Pre Order</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Draggable Floating Cart Button (when items in cart) */}
      <DraggableCartButton totalQty={totalQty} />

    </div>
  );
}
