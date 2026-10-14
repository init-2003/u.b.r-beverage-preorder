'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * CheckoutDraftManager
 * Manages the lifecycle of checkout drafts (remark, temporary address, payment method):
 * - Persists across page refresh (F5 / Reload) while remaining on /checkout
 * - Automatically purges drafts the moment the user navigates away from /checkout
 */
export default function CheckoutDraftManager() {
  const pathname = usePathname();

  useEffect(() => {
    // Whenever the current page is NOT /checkout, immediately clear all checkout draft states
    if (pathname !== '/checkout') {
      try {
        sessionStorage.removeItem('ubr_checkout_remark');
        sessionStorage.removeItem('ubr_checkout_payment_method');
        sessionStorage.removeItem('ubr_checkout_is_editing_address');
        sessionStorage.removeItem('ubr_checkout_temp_address');
        sessionStorage.removeItem('ubr_checkout_was_reloaded');
        localStorage.removeItem('ubr_checkout_payment_method');
        localStorage.removeItem('ubr_checkout_remark');
      } catch {}
    }
  }, [pathname]);

  return null;
}
