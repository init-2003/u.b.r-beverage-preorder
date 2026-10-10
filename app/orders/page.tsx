'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OrderDetailPage from './[docNo]/page';
import { WineLoading } from '@/components/WineLoading';

export default function OrdersIndexPage() {
  const router = useRouter();
  const [docNo, setDocNo] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const savedDocNo = sessionStorage.getItem('ubr_active_order_doc_no');
      if (savedDocNo && savedDocNo.trim()) {
        setDocNo(savedDocNo.trim());
      } else {
        router.replace('/orders/history');
      }
    } catch {
      router.replace('/orders/history');
    } finally {
      setChecked(true);
    }
  }, [router]);

  if (!checked || !docNo) {
    return (
      <div className="flex-1 min-h-[calc(100vh-200px)] bg-white px-4 flex items-center justify-center">
        <WineLoading size="md" />
      </div>
    );
  }

  return <OrderDetailPage forcedDocNo={docNo} />;
}
