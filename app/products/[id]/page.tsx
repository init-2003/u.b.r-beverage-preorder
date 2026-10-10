'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import ProductImageMagnifier from '@/components/ProductImageMagnifier';
import { WineLoading } from '@/components/WineLoading';
import { QuantityInput } from '@/components/ui';
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { formatDepositPrice } from '@/lib/deposit';

interface ProductDetail {
  id: string;
  name: string;
  nameEN?: string;
  category: string;
  unitName: string;
  price: number;
  salePrice1: number;
  salePrice2?: number;
  salePrice3?: number;
  salePrice4?: number;
  salePrice5?: number;
  customerLevel?: number;
  depositPrice?: number;
  depositPercent: number;
  leadTimeDays?: number;
  origin?: string;
  alcoholPercent?: number;
  description?: string;
  imageUrl?: string;
  isPreorderOnly?: boolean;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { addItem, showSuccessToast } = useCart();
  const { setCustomTitle } = useBreadcrumb();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [qty, setQty] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    async function fetchProduct() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(resolvedParams.id)}`);
        const data = await res.json();
        if (!res.ok || !data.success || !data.product) {
          setErrorMsg(data.message || 'ไม่พบรายการสินค้าที่ระบุ');
          return;
        }
        setProduct(data.product);
      } catch {
        setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (product?.name) {
      setCustomTitle(product.name);
    }
  }, [product?.name, setCustomTitle]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      {
        tradeId: product.id,
        tradeName: product.name,
        tradeNameEN: product.nameEN,
        unitName: product.unitName || '',
        typeName: product.category,
        salePrice: product.price,
        depositPrice: product.depositPrice,
        depositPercent: product.depositPercent,
        image: product.imageUrl,
      },
      qty,
      { showModal: false }
    );

    showSuccessToast();
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 1500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'ubr_direct_checkout',
          JSON.stringify({
            productId: product.id,
            qty,
            from: 'product',
            productName: product.name,
          })
        );
      } catch {}
    }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)] min-h-[calc(100dvh-200px)] pb-32">
        <WineLoading size="md" />
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh+80px)] pb-48">
        <div className="max-w-md w-full bg-white rounded-sm p-8 border border-slate-100/80 text-center space-y-4 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)]">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">ไม่พบรายการสินค้านี้</h2>
          <p className="text-xs text-slate-500">
            {errorMsg || 'อาจมีข้อผิดพลาดเกี่ยวกับรหัสสินค้า หรือรายการถูกนำออกจากระบบแล้ว'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าหลัก</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const unitDeposit = product.depositPrice && product.depositPrice > 0 ? product.depositPrice : 0;
  const depositPercent = product.depositPercent && product.depositPercent > 0 ? product.depositPercent : 0;
  const lineTotal = product.price * qty;

  // Original price for strikethrough comparison (if cost/salePrice is higher than display price)
  const originalPrice = product.salePrice1 && product.salePrice1 > product.price ? product.salePrice1 : 0;

  return (
    <div className="flex-1 flex flex-col bg-white py-8 sm:py-12 min-h-[calc(100vh+80px)] pb-48 sm:pb-64">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-4">

        {/* Main Product Showcase Card (Shopee Style Clean Card) */}
        <div className="bg-white rounded-sm border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] p-6 sm:p-8 lg:p-10 animate-product-detail-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left Column: Product Image Showcase (No Card / Clean Float) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[380px] lg:min-h-[480px]">

              {/* Product Main Image (Interactive Magnifier Loupe Zoom) */}
              <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4">
                <ProductImageMagnifier
                  src={
                    product.imageUrl
                      ? product.imageUrl.startsWith('/') || product.imageUrl.startsWith('http')
                        ? product.imageUrl
                        : `/${product.imageUrl}`
                      : '/images/ubr_beverage_logo.png'
                  }
                  alt={product.name}
                  zoomLevel={2.5}
                  lensSize={210}
                />
              </div>
            </div>

            {/* Right Column: Modern Buy Box Details (6 Cols) */}
            <div className="lg:col-span-6 flex flex-col space-y-5">

              {/* 1. SKU Header matching reference "SKU AI052-VA-A" */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-400 tracking-wider">
                  SKU <span className="text-slate-600 font-bold">{product.id}</span>
                </div>

                {/* 2. Product Title */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                  {product.name}
                </h1>
                {product.nameEN && (
                  <p className="text-sm font-medium text-slate-400 italic">
                    {product.nameEN}
                  </p>
                )}
              </div>

              {/* 3. Status Badge: Pre-order with clock icon matching reference */}
              <div className="flex items-center text-xs pt-1 pb-1">
                <div className="flex items-center gap-1.5 font-bold text-[#e59f19]">
                  <div className="w-4 h-4 rounded-full bg-[#ffb930] flex items-center justify-center text-white shadow-2xs">
                    <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="font-semibold text-sm text-[#e59f19]">Pre-order</span>
                </div>
              </div>

              {/* 4. Pricing Block */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-[#FF6B00] tracking-tight">
                    ฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {originalPrice > 0 && (
                    <span className="text-base sm:text-lg text-slate-400 line-through font-normal">
                      ฿{originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                  {product.unitName ? (
                    <span className="text-xs text-slate-500 font-medium self-center">
                      / {product.unitName}
                    </span>
                  ) : null}
                </div>

                {/* Pre-order Deposit Callout (No background box) */}
                {unitDeposit > 0 && (
                  <div className="flex items-center gap-1.5 text-xs flex-wrap pt-0.5">
                    <span className="text-[#FF0000] font-bold">
                      มัดจำ:
                    </span>
                    <span className="text-[#FF0000] font-black text-sm">
                      ฿{formatDepositPrice(unitDeposit)}
                    </span>
                    {depositPercent > 0 && (
                      <span className="text-[#FF0000] font-medium text-xs">
                        ({depositPercent}%)
                      </span>
                    )}
                    {product.unitName ? (
                      <span className="text-xs text-slate-500 font-medium">
                        / {product.unitName}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* 5. Quantity Stepper matching reference layout */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  จำนวน
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 rounded-none bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      disabled={qty <= 1}
                      className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:cursor-not-allowed text-base font-bold transition-colors cursor-pointer select-none"
                      aria-label="ลดจำนวน"
                    >
                      -
                    </button>
                    <QuantityInput
                      value={qty}
                      onChange={setQty}
                      min={1}
                      className="w-12 h-9 font-black text-base text-slate-900 border-x border-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(qty + 1)}
                      className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 text-base font-bold transition-colors cursor-pointer select-none"
                      aria-label="เพิ่มจำนวน"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {product.unitName || ''}
                    {qty > 1 && (
                      <span className="ml-2 font-bold text-[#FF6B00]">
                        (รวม ฿{lineTotal.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* 6. Dual Action Buttons (Side by Side matching reference) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Button 1: เพิ่มลงในตะกร้า (Clean White Bordered Button) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addedSuccess}
                  className={`py-3.5 px-5 rounded-full border font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer ${addedSuccess
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 hover:border-slate-800'
                    }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[2.5]" />
                      <span>เพิ่มแล้ว</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 text-slate-700" />
                      <span>เพิ่มลงในตะกร้า</span>
                    </>
                  )}
                </button>

                {/* Button 2: สั่งจองทันที / ซื้อเลย (Primary Brand Red Button) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-3.5 px-5 rounded-full bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow transition-all text-center cursor-pointer active:scale-[0.99]"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0 text-white" />
                  <span>สั่งซื้อเลย</span>
                </button>
              </div>


            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
