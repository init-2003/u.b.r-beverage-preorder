'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WineLoading } from '@/components/WineLoading';

export default function OrdersIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const savedDocNo = sessionStorage.getItem('ubr_active_order_doc_no');
      if (savedDocNo && savedDocNo.trim()) {
        router.replace(`/orders/${encodeURIComponent(savedDocNo.trim())}`);
      } else {
        router.replace('/orders/history');
      }
    } catch {
      router.replace('/orders/history');
    }
  }, [router]);

  return (
    <div className="flex-1 min-h-[calc(100vh-200px)] bg-white px-4 flex items-center justify-center">
      <WineLoading size="md" />
    </div>
  );
}
