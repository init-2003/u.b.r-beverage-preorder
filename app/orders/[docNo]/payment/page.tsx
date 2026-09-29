'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WineLoading } from '@/components/WineLoading';

export default function OrderPaymentRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const docNo = params?.docNo as string;

  useEffect(() => {
    if (docNo) {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('ubr_last_order_doc_no', docNo);
        } catch {}
      }
      router.replace(`/orders/payment?docNo=${encodeURIComponent(docNo)}`);
    } else {
      router.replace('/orders/payment');
    }
  }, [docNo, router]);

  return (
    <div className="flex-1 min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <WineLoading size="md" />
    </div>
  );
}
