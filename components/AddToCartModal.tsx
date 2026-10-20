'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Modal, Button, ProductImage, QuantityInput } from '@/components/ui';
import { formatDepositPrice } from '@/lib/deposit';

export default function AddToCartModal() {
  const router = useRouter();
  const { isAddedModalOpen, lastAddedItem, closeAddedModal, addItem, showSuccessToast } = useCart();
  const [modalQty, setModalQty] = useState(1);
  const [cachedItem, setCachedItem] = useState(lastAddedItem);

  useEffect(() => {
    if (lastAddedItem) {
      setCachedItem(lastAddedItem);
    }
  }, [lastAddedItem]);

  const activeData = lastAddedItem || cachedItem;

  useEffect(() => {
    if (isAddedModalOpen && lastAddedItem) {
      setModalQty(lastAddedItem.qty > 0 ? lastAddedItem.qty : 1);
    }
  }, [isAddedModalOpen, lastAddedItem]);

  if (!activeData) {
    return null;
  }

  const { item } = activeData;

  const handleGoToCart = () => {
    closeAddedModal();
    router.push('/cart');
  };

  const handleConfirmAddToCart = () => {
    addItem(item, modalQty, { showModal: false });
    closeAddedModal();
    showSuccessToast();
  };

  const handleQtyChange = (val: number) => {
    setModalQty(Math.max(1, val));
  };

  const lineTotal = (item.salePrice || 0) * modalQty;
  const lineDeposit = (item.depositPrice || 0) * modalQty;

  return (
    <Modal
      isOpen={isAddedModalOpen}
      onClose={closeAddedModal}
      maxWidth="max-w-[480px]"
      padding="p-0"
      className="overflow-hidden"
    >
      {/* Header: Title */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2.5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          เพิ่มสินค้าลงในตะกร้า
        </h2>
      </div>

      {/* Added Product Section (Borderless clean layout) */}
      <div className="px-6 py-2">
        <div className="space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Product Image: Clean & Borderless on pure white matching cart */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center select-none">
                <ProductImage
                  src={item.image || '/images/ubr_beverage_logo.png'}
                  alt={item.tradeName}
                  objectFit="contain"
                  className="w-full h-full"
                  priority={true}
                  fallbackSrc="/images/ubr_beverage_logo.png"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug" title={item.tradeName}>
                  {item.tradeName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ราคา: ฿{(item.salePrice || 0).toLocaleString()} {item.unitName ? `/ ${item.unitName}` : ''}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right pl-2">
              <p className="text-base sm:text-lg font-bold text-[#FF6B00] tabular-nums">
                ฿{lineTotal.toLocaleString()}
              </p>
              {lineDeposit > 0 ? (
                <p className="text-[11px] text-[#FF0000] font-medium mt-0.5 tabular-nums">
                  มัดจำ ฿{formatDepositPrice(lineDeposit)}{item.depositPercent && item.depositPercent > 0 ? ` (${item.depositPercent}%)` : ''}
                </p>
              ) : null}
            </div>
          </div>

          {/* Stepper / Quantity Row */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-start gap-2.5">
            <span className="text-xs font-semibold text-slate-700">
              จำนวน:
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-300 apple-squircle-xs bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleQtyChange(modalQty - 1)}
                  disabled={modalQty <= 1}
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-base font-normal transition-colors cursor-pointer select-none"
                  aria-label="ลดจำนวน"
                >
                  -
                </button>
                <QuantityInput
                  value={modalQty}
                  onChange={setModalQty}
                  min={1}
                  className="w-12 h-9 text-center font-normal text-sm text-slate-900 border-x border-slate-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQtyChange(modalQty + 1)}
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 text-base font-normal transition-colors cursor-pointer select-none"
                  aria-label="เพิ่มจำนวน"
                >
                  +
                </button>
              </div>
              {item.unitName ? (
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  {item.unitName}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions (2 ปุ่ม: ดูตะกร้าสินค้า / เพิ่มในตะกร้า ขนาดเท่ากัน ซ้าย-ขวา) */}
      <div className="px-6 pb-6 pt-3 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGoToCart}
          className="w-full sm:w-[140px] h-10 min-h-[40px] text-xs sm:text-sm font-bold"
        >
          ดูตะกร้าสินค้า
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirmAddToCart}
          className="w-full sm:w-[140px] h-10 min-h-[40px] text-xs sm:text-sm font-bold"
        >
          เพิ่มในตะกร้า
        </Button>
      </div>
    </Modal>
  );
}
