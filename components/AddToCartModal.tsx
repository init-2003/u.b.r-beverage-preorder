'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Modal, Button, ProductImage } from '@/components/ui';
import { Check } from 'lucide-react';

export default function AddToCartModal() {
  const router = useRouter();
  const { isAddedModalOpen, lastAddedItem, closeAddedModal } = useCart();

  if (!isAddedModalOpen || !lastAddedItem) {
    return null;
  }

  const { item, qty } = lastAddedItem;

  const handleGoToCart = () => {
    closeAddedModal();
    router.push('/cart');
  };



  return (
    <Modal
      isOpen={isAddedModalOpen}
      onClose={closeAddedModal}
      maxWidth="max-w-md"
      padding="p-0"
      className="overflow-hidden"
    >
      {/* Header: Success status */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            สำเร็จ
          </h2>
        </div>
      </div>

      {/* Subtitle */}
      <div className="px-6 pb-3">
        <p className="text-sm font-semibold text-slate-800">
          สินค้าได้ถูกเพิ่มใส่ตะกร้า
        </p>
      </div>

      {/* Added Product Card */}
      <div className="px-6 pb-3">
        <div className="flex items-center justify-between gap-3 p-3 rounded-sm bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              <ProductImage
                src={item.image || '/images/ubr_beverage_logo.png'}
                alt={item.tradeName}
                objectFit="auto"
                priority={true}
                fallbackSrc="/images/ubr_beverage_logo.png"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                {item.tradeName}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                จำนวน: {qty} {item.unitName || 'ชิ้น'}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right pl-2">
            <p className="text-base font-bold text-[#FF6B00]">
              ฿{(item.salePrice * qty).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              มัดจำ ฿{((item.depositPrice || 0) * qty).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 pb-6 pt-1 flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={closeAddedModal}>
          เลือกดูสินค้าต่อ
        </Button>
        <Button variant="primary" size="sm" onClick={handleGoToCart}>
          ดูตะกร้าสินค้า
        </Button>
      </div>
    </Modal>
  );
}
