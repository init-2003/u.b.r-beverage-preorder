'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Modal, Button } from '@/components/ui';
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

  const getProductImage = (img?: string) => {
    if (!img) return '/images/ubr_beverage_logo.png';
    return img.startsWith('/') ? img : `/${img}`;
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
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between gap-3 p-3 rounded-sm bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded-sm bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              <img
                src={getProductImage(item.image)}
                alt={item.tradeName}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
                }}
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
            <p className="text-base font-bold text-[#e02020]">
              ฿{(item.salePrice * qty).toLocaleString()}
            </p>
            {item.depositPrice && item.depositPrice > 0 ? (
              <p className="text-[11px] text-slate-500 mt-0.5">
                มัดจำ ฿{(item.depositPrice * qty).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/40">
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
