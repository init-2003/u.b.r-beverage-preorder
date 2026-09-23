'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
    <div className="flex-1 flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500 font-medium">กำลังไปยังหน้าระบบชำระเงิน...</p>
    </div>
  );
}
