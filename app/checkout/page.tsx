'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { AlertCircle } from 'lucide-react';
import { EmptyCheckoutIllustration } from '@/components/EmptyCheckoutIllustration';
import { CheckoutIllustration } from '@/components/CheckoutIllustration';
import { WineLoading } from '@/components/WineLoading';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatDepositPrice } from '@/lib/deposit';

interface PreOrderItem {
  tradeId: string;
  tradeName: string;
  tradeNameEN?: string;
  category?: string;
  unitName: string;
  salePrice: number;
  qty: number;
  depositPrice?: number;
  depositPercent: number;
  image?: string;
  origin?: string;
  leadTimeDays?: number;
}

function formatCustomerPhoneAndName(name: string, tel: string) {
  const trimmedName = (name || '').trim();
  const rawTel = (tel || '').trim();
  const digitsOnly = rawTel.replace(/[^0-9]/g, '');

  // 10 digits Thai phone starting with 0, e.g. 0870715864 -> 087 071 5864
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    const formattedTel = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel,
    };
  }

  // 9 digits mobile without 0, e.g. 870715864 -> 087 071 5864
  if (!digitsOnly.startsWith('0') && digitsOnly.length === 9) {
    const withZero = `0${digitsOnly}`;
    const formattedTel = `${withZero.slice(0, 3)} ${withZero.slice(3, 6)} ${withZero.slice(6)}`;
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel,
    };
  }

  // 9 digits landline starting with 0, e.g. 045263380 -> 045 263 380
  if (digitsOnly.startsWith('0') && digitsOnly.length === 9) {
    const formattedTel = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel,
    };
  }

  // Fallback with rawTel
  if (rawTel) {
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel: rawTel,
    };
  }

  return {
    displayName: trimmedName || 'ผู้สั่งซื้อ',
    formattedTel: '-',
  };
}

function PreOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawProductId = searchParams.get('productId');
  const rawQty = parseInt(searchParams.get('qty') || '1', 10);
  const rawFrom = searchParams.get('from');
  const rawProductName = searchParams.get('productName');
  const itemsParam = searchParams.get('items');

  // Direct checkout session state (read from query param or sessionStorage)
  const [directCheckout, setDirectCheckout] = useState<{
    productId: string;
    qty: number;
    from?: string;
    productName?: string;
  } | null>(() => {
    // If explicitly coming from cart or items parameter provided, clear any old direct checkout
    if (rawFrom === 'cart' || itemsParam) {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('ubr_direct_checkout');
        } catch { }
      }
      return null;
    }

    if (rawProductId) {
      const obj = {
        productId: rawProductId,
        qty: rawQty,
        from: rawFrom || 'product',
        productName: rawProductName || '',
      };
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('ubr_direct_checkout', JSON.stringify(obj));
        } catch { }
      }
      return obj;
    }

    // Try reading from sessionStorage if previously set
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('ubr_direct_checkout');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.productId) return parsed;
        }
      } catch { }
    }

    return null;
  });

  const productId = rawProductId || directCheckout?.productId || null;
  const queryQty = rawProductId ? rawQty : (directCheckout?.qty || 1);
  const fromSource = rawFrom || directCheckout?.from || (productId ? 'product' : 'cart');

  const { customer, loading: authLoading } = useAuth();
  const { items: cartItems, clearCart, updateQty, removeItems } = useCart();
  const { setCustomTitle } = useBreadcrumb();

  // Selected trade IDs parsed from query parameter or sessionStorage
  const [selectedTradeIds] = useState<string[] | null>(() => {
    if (itemsParam) {
      const parsed = itemsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('ubr_cart_selected_ids', JSON.stringify(parsed));
        } catch { }
      }
      return parsed;
    }
    // If coming from cart without specific itemsParam, clear stale filter to include all items
    if (rawFrom === 'cart') {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('ubr_cart_selected_ids');
        } catch { }
      }
      return null;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('ubr_cart_selected_ids');
        if (stored) return JSON.parse(stored);
      } catch { }
    }
    return null;
  });

  const getApplicableCartItems = (allCartItems: typeof cartItems) => {
    if (selectedTradeIds && selectedTradeIds.length > 0) {
      const idSet = new Set(selectedTradeIds);
      const filtered = allCartItems.filter((i) => idSet.has(i.tradeId));
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return allCartItems;
  };

  // Helper to map cart items into pre-order items synchronously
  const mapCartToPreOrderItems = (items: typeof cartItems): PreOrderItem[] => {
    return items.map((item) => {
      const depositPrice = item.depositPrice || 0;
      const depositPercent = (depositPrice > 0 && item.salePrice > 0)
        ? Math.round((depositPrice / item.salePrice) * 100)
        : 0;

      return {
        tradeId: item.tradeId,
        tradeName: item.tradeName,
        tradeNameEN: item.tradeNameEN,
        category: item.typeName || 'ทั่วไป',
        unitName: item.unitName || '',
        salePrice: item.salePrice,
        qty: item.qty,
        depositPrice,
        depositPercent,
        image: item.image,
      };
    });
  };

  // Order Items state - initialized synchronously from cartItems if no productId (0ms delay!)
  const [orderItems, setOrderItems] = useState<PreOrderItem[]>(() => {
    if (!productId && cartItems.length > 0) {
      return mapCartToPreOrderItems(getApplicableCartItems(cartItems));
    }
    // Also try reading from localStorage directly if cartItems hasn't hydrated in context yet
    if (!productId && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ubr_cart_items');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return mapCartToPreOrderItems(getApplicableCartItems(parsed));
          }
        }
      } catch { }
    }
    return [];
  });
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));

  // Compute dynamic back navigation based on actual source origin
  let backHref = '/';

  if (orderItems.length === 0 || fromSource === 'catalog') {
    backHref = '/';
  } else if (fromSource === 'cart') {
    backHref = '/cart';
  } else if (productId) {
    backHref = `/products/${encodeURIComponent(productId)}`;
  }

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientTel, setRecipientTel] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientZip, setRecipientZip] = useState('');
  const [remark, setRemark] = useState('');

  // Helper: check if current load is a browser reload/refresh (F5)
  const checkIsReload = (): boolean => {
    if (typeof window === 'undefined' || !window.performance) return false;
    try {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        return navEntries[0].type === 'reload';
      }
      return (window.performance as any)?.navigation?.type === 1;
    } catch {
      return false;
    }
  };

  // Helper: clear all draft checkout states from session storage
  const clearCheckoutDraftStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem('ubr_checkout_is_editing_address');
      sessionStorage.removeItem('ubr_checkout_temp_address');
      sessionStorage.removeItem('ubr_checkout_payment_method');
      localStorage.removeItem('ubr_checkout_payment_method');
    } catch { }
  };

  const [paymentMethod, setPaymentMethod] = useState<'M' | 'T' | null>(() => {
    if (typeof window !== 'undefined' && checkIsReload()) {
      try {
        const saved = sessionStorage.getItem('ubr_checkout_payment_method');
        if (saved === 'M' || saved === 'T') return saved;
      } catch { }
    }
    return null;
  });

  // Address edit state (Shopee style) - restored ONLY on browser reload (F5)
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && checkIsReload()) {
      try {
        return sessionStorage.getItem('ubr_checkout_is_editing_address') === 'true';
      } catch { }
    }
    return false;
  });

  const [tempName, setTempName] = useState<string>(() => {
    if (typeof window !== 'undefined' && checkIsReload()) {
      try {
        const saved = sessionStorage.getItem('ubr_checkout_temp_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.tempName === 'string') return parsed.tempName;
        }
      } catch { }
    }
    return '';
  });

  const [tempTel, setTempTel] = useState<string>(() => {
    if (typeof window !== 'undefined' && checkIsReload()) {
      try {
        const saved = sessionStorage.getItem('ubr_checkout_temp_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.tempTel === 'string') return parsed.tempTel;
        }
      } catch { }
    }
    return '';
  });

  const [tempAddress, setTempAddress] = useState<string>(() => {
    if (typeof window !== 'undefined' && checkIsReload()) {
      try {
        const saved = sessionStorage.getItem('ubr_checkout_temp_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.tempAddress === 'string') return parsed.tempAddress;
        }
      } catch { }
    }
    return '';
  });

  const [tempZip, setTempZip] = useState<string>(() => {
    if (typeof window !== 'undefined' && checkIsReload()) {
      try {
        const saved = sessionStorage.getItem('ubr_checkout_temp_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.tempZip === 'string') return parsed.tempZip;
        }
      } catch { }
    }
    return '';
  });

  const [saveToProfile, setSaveToProfile] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && checkIsReload()) {
      try {
        const saved = sessionStorage.getItem('ubr_checkout_temp_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.saveToProfile === 'boolean') return parsed.saveToProfile;
        }
      } catch { }
    }
    return true;
  });

  // Clear drafts if fresh navigation, or listen for in-app exit vs full browser reload
  useEffect(() => {
    try {
      localStorage.removeItem('ubr_checkout_payment_method');

      if (!checkIsReload()) {
        clearCheckoutDraftStorage();
        setPaymentMethod(null);
        setIsEditingAddress(false);
      }

      const savedRemark = localStorage.getItem('ubr_checkout_remark');
      if (savedRemark) {
        setRemark(savedRemark);
      }
    } catch { }

    let isBrowserUnloading = false;
    const handleBeforeUnload = () => {
      isBrowserUnloading = true;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!isBrowserUnloading) {
        clearCheckoutDraftStorage();
      }
    };
  }, []);

  const handleSelectPaymentMethod = (method: 'M' | 'T') => {
    setPaymentMethod(method);
    try {
      sessionStorage.setItem('ubr_checkout_payment_method', method);
    } catch {
      // ignore storage access errors
    }
  };

  const handleRemarkChange = (val: string) => {
    setRemark(val);
    try {
      localStorage.setItem('ubr_checkout_remark', val);
    } catch {
      // ignore storage access errors
    }
  };

  const syncTempAddressToStorage = (updates: {
    tempName?: string;
    tempTel?: string;
    tempAddress?: string;
    tempZip?: string;
    saveToProfile?: boolean;
    isEditing?: boolean;
  }) => {
    if (typeof window === 'undefined') return;
    try {
      if (updates.isEditing !== undefined) {
        if (updates.isEditing) {
          sessionStorage.setItem('ubr_checkout_is_editing_address', 'true');
        } else {
          sessionStorage.removeItem('ubr_checkout_is_editing_address');
          sessionStorage.removeItem('ubr_checkout_temp_address');
          return;
        }
      }
      let currentData: any = {};
      const existing = sessionStorage.getItem('ubr_checkout_temp_address');
      if (existing) {
        try {
          currentData = JSON.parse(existing) || {};
        } catch { }
      }
      const nextData = {
        tempName: updates.tempName !== undefined ? updates.tempName : tempName,
        tempTel: updates.tempTel !== undefined ? updates.tempTel : tempTel,
        tempAddress: updates.tempAddress !== undefined ? updates.tempAddress : tempAddress,
        tempZip: updates.tempZip !== undefined ? updates.tempZip : tempZip,
        saveToProfile: updates.saveToProfile !== undefined ? updates.saveToProfile : saveToProfile,
        ...currentData,
        ...updates,
      };
      sessionStorage.setItem('ubr_checkout_temp_address', JSON.stringify(nextData));
    } catch { }
  };

  const handleStartEditAddress = () => {
    const nextName = tempName || recipientName;
    const nextTel = tempTel || recipientTel;
    const nextAddress = tempAddress || recipientAddress;
    const nextZip = tempZip || recipientZip;

    setTempName(nextName);
    setTempTel(nextTel);
    setTempAddress(nextAddress);
    setTempZip(nextZip);
    setIsEditingAddress(true);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('ubr_checkout_is_editing_address', 'true');
        sessionStorage.setItem(
          'ubr_checkout_temp_address',
          JSON.stringify({
            tempName: nextName,
            tempTel: nextTel,
            tempAddress: nextAddress,
            tempZip: nextZip,
            saveToProfile,
          })
        );
      } catch { }
    }
  };

  const handleCancelEditAddress = () => {
    setIsEditingAddress(false);
    setTempName(recipientName);
    setTempTel(recipientTel);
    setTempAddress(recipientAddress);
    setTempZip(recipientZip);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('ubr_checkout_is_editing_address');
        sessionStorage.removeItem('ubr_checkout_temp_address');
      } catch { }
    }
  };

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check auth: If not logged in, redirect to home page
  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace('/');
    }
  }, [authLoading, customer, router]);

  // Auto fill customer data if not in editing mode
  useEffect(() => {
    if (customer) {
      if (!recipientName) setRecipientName(customer.customerName || '');
      if (!recipientTel) setRecipientTel(customer.customerTel || '');
      if (!recipientAddress) setRecipientAddress(customer.customerAddress || '');
      if (!recipientZip && customer.customerZip) setRecipientZip(customer.customerZip);

      if (!isEditingAddress) {
        setTempName((prev) => prev || customer.customerName || '');
        setTempTel((prev) => prev || customer.customerTel || '');
        setTempAddress((prev) => prev || customer.customerAddress || '');
        setTempZip((prev) => prev || customer.customerZip || '');
      }
    }
  }, [customer, isEditingAddress]);

  const handleSaveAddress = async () => {
    if (!tempName.trim() || !tempTel.trim() || !tempAddress.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้รับ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน');
      return;
    }
    setErrorMsg('');
    setRecipientName(tempName.trim());
    setRecipientTel(tempTel.trim());
    setRecipientAddress(tempAddress.trim());
    setRecipientZip(tempZip.trim());
    setIsEditingAddress(false);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('ubr_checkout_is_editing_address');
        sessionStorage.removeItem('ubr_checkout_temp_address');
      } catch { }
    }

    if (saveToProfile && customer) {
      try {
        await fetch('/api/customer/account', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: tempName.trim(),
            customerTel: tempTel.trim(),
            customerAddress: tempAddress.trim(),
            customerZip: tempZip.trim(),
          }),
        });
      } catch {
        // Non-blocking background sync
      }
    }
  };



  // Keep synced with cartItems when not ordering a specific single product
  useEffect(() => {
    if (!productId && cartItems.length > 0) {
      setOrderItems(mapCartToPreOrderItems(getApplicableCartItems(cartItems)));
    }
  }, [productId, cartItems, itemsParam, selectedTradeIds]);

  // Load product if productId param or direct checkout is present
  useEffect(() => {
    if (productId) {
      let isMounted = true;
      async function loadSingleProduct() {
        // Only show spinner on initial load if not already loaded in orderItems
        setOrderItems((current) => {
          if (!current || current.length === 0 || current[0].tradeId !== productId) {
            setLoadingProduct(true);
          }
          return current;
        });

        try {
          const res = await fetch(`/api/products/${encodeURIComponent(productId!)}`);
          const data = await res.json();
          if (!isMounted) return;
          if (data.success && data.product) {
            const p = data.product;
            if (fromSource === 'product') {
              setCustomTitle(p.name);
            }
            setOrderItems((prev) => {
              const existingItem = prev.find((i) => i.tradeId === p.id);
              const currentQty = existingItem && existingItem.qty > 0 ? existingItem.qty : Math.max(1, queryQty);
              return [
                {
                  tradeId: p.id,
                  tradeName: p.name,
                  tradeNameEN: p.nameEN,
                  category: p.category,
                  unitName: p.unitName || '',
                  salePrice: p.price,
                  qty: currentQty,
                  depositPrice: p.depositPrice || 0,
                  depositPercent: p.depositPercent || 0,
                  image: p.imageUrl,
                  origin: p.origin,
                  leadTimeDays: p.leadTimeDays,
                },
              ];
            });
          } else {
            setErrorMsg('ไม่พบข้อมูลสินค้าที่เลือกสั่งจอง');
          }
        } catch {
          if (isMounted) setErrorMsg('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
        } finally {
          if (isMounted) setLoadingProduct(false);
        }
      }
      loadSingleProduct();
      return () => { isMounted = false; };
    } else {
      setLoadingProduct(false);
    }
  }, [productId, fromSource]);

  const handleUpdateItemQty = (tradeId: string, newQty: number) => {
    const nextQty = Math.max(0, isNaN(newQty) ? 0 : newQty);
    setOrderItems((prev) =>
      prev.map((i) => (i.tradeId === tradeId ? { ...i, qty: nextQty } : i))
    );
    if (!productId) {
      updateQty(tradeId, nextQty);
    } else {
      if (directCheckout) {
        const updated = { ...directCheckout, qty: nextQty };
        setDirectCheckout(updated);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('ubr_direct_checkout', JSON.stringify(updated));
          } catch { }
        }
      }
      // อัปเดต URL พารามิเตอร์ qty ทันที เพื่อให้เมื่อกดรีเฟรช (F5) เบราว์เซอร์จะจำจำนวนล่าสุดไว้
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('qty', String(nextQty));
          window.history.replaceState(null, '', url.toString());
        } catch { }
      }
    }
  };

  // Financial calculations
  const totalAmount = orderItems.reduce((sum, item) => sum + item.qty * item.salePrice, 0);
  const totalDepositAmount = orderItems.reduce((sum, item) => {
    const unitDeposit = (item.depositPrice && item.depositPrice > 0)
      ? item.depositPrice
      : 0;
    return sum + unitDeposit * item.qty;
  }, 0);
  const totalRemainingAmount = totalDepositAmount > 0 ? Math.max(0, totalAmount - totalDepositAmount) : 0;
  const totalItemsCount = orderItems.reduce((sum, item) => sum + item.qty, 0);
  const hasZeroQty = orderItems.some((i) => i.qty <= 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customer) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนทำการสั่งจองสินค้า');
      router.push('/login');
      return;
    }

    if (orderItems.length === 0) {
      setErrorMsg('ไม่มีรายการสินค้าสำหรับสั่งจอง');
      return;
    }

    const validOrderItems = orderItems.filter((i) => i.qty > 0);
    if (validOrderItems.length === 0) {
      setErrorMsg('กรุณาระบุจำนวนสินค้าให้มากกว่า 0 อย่างน้อย 1 รายการ หรือกดลบรายการที่ไม่ต้องการสั่งจองออก');
      return;
    }

    if (!recipientAddress.trim() || !recipientTel.trim() || !recipientName.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้สั่งซื้อ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน');
      return;
    }

    if (!paymentMethod) {
      setErrorMsg('กรุณาเลือกวิธีการชำระเงิน');
      return;
    }

    setSubmitting(true);

    try {
      // Create preorder in MSSQL
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: recipientName,
          customerTel: recipientTel,
          customerAddress: recipientAddress,
          customerZip: recipientZip,
          customerEmail: (customer.cusUser && customer.cusUser.includes('@') ? customer.cusUser : ''),
          remark: remark.trim(),
          paymentMethod,
          paymentSlipFilename: '',
          items: validOrderItems.map((i) => ({
            tradeId: i.tradeId,
            tradeName: i.tradeName,
            qty: i.qty,
            unitName: i.unitName,
            typeName: i.category,
            salePrice: i.salePrice,
            depositPrice: i.depositPrice,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'บันทึกคำสั่งจองไม่สำเร็จ');
        return;
      }

      // If came from cart, remove only the ordered items from the cart
      if (!productId) {
        const orderedTradeIds = orderItems.map((i) => i.tradeId);
        if (orderedTradeIds.length > 0) {
          removeItems(orderedTradeIds);
        } else {
          clearCart();
        }
      }

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('ubr_cart_selected_ids');
          sessionStorage.removeItem('ubr_direct_checkout');
          sessionStorage.removeItem('ubr_checkout_payment_method');
          sessionStorage.removeItem('ubr_checkout_is_editing_address');
          sessionStorage.removeItem('ubr_checkout_temp_address');
          localStorage.removeItem('ubr_checkout_payment_method');
          localStorage.removeItem('ubr_checkout_remark');
        } catch { }
      }

      // Navigate to dedicated payment page if PromptPay, or order details if COD
      if (paymentMethod === 'T') {
        router.push(`/orders/${data.data.docNo}/payment`);
      } else {
        router.push(`/orders/${data.data.docNo}`);
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f5] min-h-[calc(100vh-200px)] min-h-[calc(100dvh-200px)] py-16 px-4">
        <WineLoading size="md" />
      </div>
    );
  }

  if (authLoading || !customer) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f5] py-6 sm:py-8">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6 flex-1 flex flex-col">

        {/* Page Title Header (แสดงเฉพาะเมื่อมีสินค้า) */}
        {!loadingProduct && orderItems.length > 0 && (
          <div className="pb-3 border-b border-slate-200/80 animate-checkout-slide-up">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <CheckoutIllustration className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 drop-shadow-xs" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                ยืนยันการสั่งซื้อ
              </h1>
            </div>
          </div>
        )}

        {loadingProduct ? (
          <div className="flex-1 min-h-[calc(100vh-250px)] flex items-center justify-center px-4">
            <WineLoading size="md" />
          </div>
        ) : orderItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] py-16 sm:py-24 px-4 text-center flex flex-col items-center justify-center space-y-4 animate-checkout-slide-up">
            <div className="flex items-center justify-center">
              <EmptyCheckoutIllustration className="w-36 h-36 sm:w-40 sm:h-40" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                {errorMsg || 'ยังไม่มีสินค้าสำหรับสั่งซื้อ'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                คุณสามารถเลือกซื้อสินค้าได้จากหน้าหลัก
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                onClick={clearCheckoutDraftStorage}
                className="inline-flex items-center justify-center px-8 py-2.5 rounded-full bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>กลับไปหน้าหลัก</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-4 rounded-sm bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-6">

              {/* Delivery Address Card (Shopee Style) */}
              <div 
                className="bg-white border border-slate-100/80 rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] overflow-hidden animate-checkout-slide-up"
                style={{ animationDelay: '40ms' }}
              >
                {/* Decorative envelope ribbon strip */}
                <div className="h-[3px] w-full bg-[repeating-linear-gradient(45deg,#6fa6d6,#6fa6d6_33px,transparent_0,transparent_41px,#f18d9b_0,#f18d9b_74px,transparent_0,transparent_82px)]" />

                <div className="p-5 sm:px-7 sm:py-6">
                  {/* Header: Pin + ที่อยู่ในการจัดส่ง */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      </svg>
                      <h2 className="text-sm sm:text-base font-bold text-black tracking-tight">
                        ที่อยู่ในการจัดส่ง
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartEditAddress}
                      disabled={isEditingAddress}
                      className={`text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-all duration-200 ${
                        isEditingAddress ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                      }`}
                    >
                      เปลี่ยน
                    </button>
                  </div>

                  {/* Display Mode matching Reference Image */}
                  <div
                    className={!isEditingAddress ? 'address-accordion-open' : 'address-accordion-closed'}
                    aria-hidden={isEditingAddress}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8 flex-1">
                        {/* Name & Phone (Bold) */}
                        <div className="sm:w-60 shrink-0 space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                            {formatCustomerPhoneAndName(recipientName, recipientTel).displayName}
                          </div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                            {formatCustomerPhoneAndName(recipientName, recipientTel).formattedTel}
                          </div>
                        </div>

                        {/* Full Address */}
                        <div className="flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-center gap-2.5 flex-wrap">
                          {recipientAddress ? (
                            <>
                              <span>
                                {[
                                  recipientAddress.trim(),
                                  recipientZip && !recipientAddress.includes(recipientZip) ? recipientZip.trim() : '',
                                ].filter(Boolean).join(', ')}
                              </span>
                              <span className="text-[10px] text-red-600 border border-red-600 px-1.5 py-0.5 rounded-[2px] shrink-0 font-medium select-none">
                                ค่าเริ่มต้น
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">
                              ยังไม่ได้ระบุที่อยู่จัดส่งสินค้า กรุณากด &quot;เปลี่ยน&quot; เพื่อระบุที่อยู่จัดส่ง
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Edit Mode */}
                  <div
                    className={isEditingAddress ? 'address-accordion-open' : 'address-accordion-closed'}
                    aria-hidden={!isEditingAddress}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pt-3 border-t border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            ชื่อ-นามสกุล / ชื่อร้านค้า <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => {
                              setTempName(e.target.value);
                              syncTempAddressToStorage({ tempName: e.target.value });
                            }}
                            placeholder="เช่น สมชาย ใจดี หรือ ร้านต้นมะกรูด"
                            className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            เบอร์โทรศัพท์ติดต่อ <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="tel"
                            value={tempTel}
                            onChange={(e) => {
                              setTempTel(e.target.value);
                              syncTempAddressToStorage({ tempTel: e.target.value });
                            }}
                            placeholder="เช่น 081-2345678"
                            className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          ที่อยู่จัดส่งสินค้าโดยละเอียด <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={tempAddress}
                          onChange={(e) => {
                            setTempAddress(e.target.value);
                            syncTempAddressToStorage({ tempAddress: e.target.value });
                          }}
                          placeholder="ระบุบ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด"
                          className="w-full p-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            รหัสไปรษณีย์
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={tempZip}
                            onChange={(e) => {
                              setTempZip(e.target.value);
                              syncTempAddressToStorage({ tempZip: e.target.value });
                            }}
                            placeholder="รหัสไปรษณีย์ 5 หลัก"
                            className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                          />
                        </div>

                        <div className="sm:pt-5">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={saveToProfile}
                              onChange={(e) => {
                                setSaveToProfile(e.target.checked);
                                syncTempAddressToStorage({ saveToProfile: e.target.checked });
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black accent-black cursor-pointer"
                            />
                            <span>บันทึกเป็นที่อยู่เริ่มต้นในบัญชีของฉัน</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleCancelEditAddress}
                          className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAddress}
                          className="px-6 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          บันทึกที่อยู่
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Items Card (Single Unified Card) */}
              <div 
                className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden animate-checkout-slide-up"
                style={{ animationDelay: '80ms' }}
              >
                {/* Table Header Row */}
                <div className="px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      รายการสินค้า
                    </h2>
                  </div>

                  <div className="hidden sm:grid grid-cols-5 gap-2 sm:gap-3 text-xs text-slate-400 font-normal w-[58%] select-none">
                    <span className="text-center">จำนวน</span>
                    <span className="text-center">หน่วย</span>
                    <span className="text-center">ราคาต่อหน่วย</span>
                    <span className="text-center text-[#FF6B00] font-semibold">ราคารวม</span>
                    <span className="text-right pr-2 text-blue-600 font-semibold">ยอดมัดจำ</span>
                  </div>
                </div>
                  {/* MOBILE VIEW (< 640px) */}
                <div className="block sm:hidden">
                  {/* Mobile Items List */}
                  <div className="divide-y divide-slate-100">
                    {orderItems.map((item) => {
                      const itemLineTotal = item.qty * item.salePrice;
                      const unitDeposit = item.depositPrice && item.depositPrice > 0 ? item.depositPrice : 0;
                      const lineDeposit = unitDeposit * item.qty;

                      return (
                        <div key={item.tradeId} className="p-4 space-y-3">
                          {/* Product Info Row: Image + Name */}
                          <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 bg-white border border-slate-100 rounded shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                              <ProductImage
                                src={item.image || '/images/ubr_beverage_logo.png'}
                                alt={item.tradeName}
                                objectFit="auto"
                                priority={true}
                                fallbackSrc="/images/ubr_beverage_logo.png"
                              />
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                                {item.tradeName}
                              </h4>
                              {item.tradeNameEN && (
                                <p className="text-[11px] text-slate-400 truncate italic">
                                  {item.tradeNameEN}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                                <span>SKU: <span className="text-slate-600">{item.tradeId}</span></span>
                                <span>•</span>
                                <span>หน่วย: <strong className="text-slate-700">{item.unitName || 'หน่วย'}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* 4-Column Stats Row: จำนวน: | ราคาต่อหน่วย: | ราคารวม: | ยอดมัดจำ: */}
                          <div className={`grid grid-cols-4 gap-1.5 items-start text-center pt-2 px-1 transition-all ${item.qty <= 0 ? 'pb-8' : 'pb-2'}`}>
                            {/* Col 1: จำนวน: (Quantity Stepper) */}
                            <div className="flex flex-col items-center justify-start">
                              <div className="h-5 flex items-center justify-center">
                                <span className="text-[11px] font-bold text-slate-800 leading-none">
                                  จำนวน:
                                </span>
                              </div>
                              <div className="h-7 flex items-center justify-center mt-1">
                                <div className="relative inline-flex flex-col items-center">
                                  <div className={`inline-flex items-center border ${item.qty <= 0 ? 'border-red-400 ring-1 ring-red-400/30' : 'border-slate-300'} rounded-none bg-white overflow-hidden shadow-2xs h-7`}>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQty(item.tradeId, Math.max(0, item.qty - 1))}
                                      className="w-6 h-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-bold text-xs cursor-pointer select-none transition-colors rounded-none"
                                      aria-label="ลดจำนวน"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center font-black text-xs text-slate-900 border-x border-slate-200 select-none">
                                      {item.qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQty(item.tradeId, item.qty + 1)}
                                      className="w-6 h-full flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-bold text-xs cursor-pointer select-none transition-colors rounded-none"
                                      aria-label="เพิ่มจำนวน"
                                    >
                                      +
                                    </button>
                                  </div>
                                  {item.qty <= 0 && (
                                    <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] leading-tight text-red-600 font-normal text-center w-[125px] pointer-events-none z-10">
                                      กรุณาระบุจำนวนมากกว่า 0
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Col 2: ราคาต่อหน่วย: */}
                            <div className="flex flex-col items-center justify-start">
                              <div className="h-5 flex items-center justify-center">
                                <span className="text-[11px] font-bold text-slate-800 leading-none">
                                  ราคาต่อหน่วย:
                                </span>
                              </div>
                              <div className="h-7 flex items-center justify-center mt-1">
                                <span className="block text-xs font-bold text-slate-900 tabular-nums">
                                  ฿{item.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Col 3: ราคารวม: */}
                            <div className="flex flex-col items-center justify-start">
                              <div className="h-5 flex items-center justify-center">
                                <span className="text-[11px] font-bold text-[#FF6B00] leading-none">
                                  ราคารวม:
                                </span>
                              </div>
                              <div className="h-7 flex items-center justify-center mt-1">
                                <span className="block text-xs font-bold text-[#FF6B00] tabular-nums">
                                  ฿{itemLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Col 4: ยอดมัดจำ: */}
                            <div className="flex flex-col items-center justify-start">
                              <div className="h-5 flex items-center justify-center">
                                <span className="text-[11px] font-bold text-blue-600 leading-none">
                                  ยอดมัดจำ:
                                </span>
                              </div>
                              <div className="h-7 flex flex-col items-center justify-center mt-1">
                                <span className="block text-xs font-bold text-blue-600 tabular-nums leading-tight">
                                  ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {unitDeposit > 0 && item.qty > 1 && (
                                  <span className="text-[11px] sm:text-xs text-blue-600 font-medium leading-none mt-0.5">
                                    (฿{formatDepositPrice(unitDeposit)}/{item.unitName || 'หน่วย'})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DESKTOP VIEW (>= 640px) matching standard 425degree table */}
                <div className="hidden sm:block overflow-x-auto">
                  <div className="min-w-[560px] sm:min-w-0">

                    {/* Table Rows */}
                    <div className="divide-y divide-slate-100">
                      {orderItems.map((item) => {
                        const itemLineTotal = item.qty * item.salePrice;
                        const unitDeposit = item.depositPrice && item.depositPrice > 0 ? item.depositPrice : 0;
                        const lineDeposit = unitDeposit * item.qty;

                        return (
                          <div key={item.tradeId} className="px-5 sm:px-6 py-5">
                            <div className="flex items-center justify-between">

                              {/* Product Image & Info */}
                              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-100 rounded shrink-0 flex items-center justify-center overflow-hidden">
                                  <ProductImage
                                    src={item.image || '/images/ubr_beverage_logo.png'}
                                    alt={item.tradeName}
                                    objectFit="auto"
                                    priority={true}
                                    fallbackSrc="/images/ubr_beverage_logo.png"
                                  />
                                </div>

                                <div className="min-w-0 space-y-1">
                                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                                    {item.tradeName}
                                  </h3>
                                  {item.tradeNameEN && (
                                    <p className="text-[11px] text-slate-400 truncate italic">
                                      {item.tradeNameEN}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                                    <span>SKU: <span className="text-slate-600">{item.tradeId}</span></span>
                                  </div>
                                </div>
                              </div>

                              {/* Right 5 Columns matching header: จำนวน | หน่วย | ราคาต่อหน่วย | ราคารวม | ยอดมัดจำ */}
                              <div className="w-[58%] grid grid-cols-5 gap-2 sm:gap-3 items-center shrink-0">
                                {/* 1. จำนวน */}
                                <div className="flex flex-col items-center justify-center">
                                  <div className="relative inline-flex flex-col items-center">
                                    <div className={`inline-flex items-center border ${item.qty <= 0 ? 'border-red-400 ring-1 ring-red-400/30' : 'border-slate-300'} rounded-none bg-white overflow-hidden shadow-2xs`}>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemQty(item.tradeId, Math.max(0, item.qty - 1))}
                                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-bold text-xs sm:text-sm cursor-pointer select-none transition-colors rounded-none"
                                        aria-label="ลดจำนวน"
                                      >
                                        -
                                      </button>
                                      <span className="w-8 sm:w-10 text-center font-black text-xs sm:text-sm text-slate-900 border-x border-slate-200 select-none">
                                        {item.qty}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemQty(item.tradeId, item.qty + 1)}
                                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:bg-slate-800 font-bold text-xs sm:text-sm cursor-pointer select-none transition-colors rounded-none"
                                        aria-label="เพิ่มจำนวน"
                                      >
                                        +
                                      </button>
                                    </div>
                                    {item.qty <= 0 && (
                                      <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-[10px] sm:text-[11px] leading-tight text-red-600 font-normal text-center w-[140px] sm:w-[150px] pointer-events-none z-10">
                                        กรุณาระบุจำนวนมากกว่า 0
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* 2. หน่วย */}
                                <div className="text-center">
                                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                                    {item.unitName || 'หน่วย'}
                                  </span>
                                </div>

                                {/* 3. ราคาต่อหน่วย */}
                                <div className="text-center">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                                    ฿{item.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>

                                {/* 4. ราคารวม */}
                                <div className="text-center">
                                  <div className="font-bold text-[#FF6B00] text-xs sm:text-sm tabular-nums">
                                    ฿{itemLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>

                                {/* 5. รวมมัดจำ */}
                                <div className="text-right pr-2">
                                  <div className="font-bold text-blue-600 text-xs sm:text-base tabular-nums">
                                    ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  {unitDeposit > 0 && item.qty > 1 && (
                                    <div className="text-xs sm:text-[13px] text-blue-600 font-medium">
                                      (฿{formatDepositPrice(unitDeposit)}/{item.unitName || 'หน่วย'})
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* Card Bottom Bar: Order Remark (Shopee Style) & Order Total */}
                <div className="border-t border-dashed border-slate-200 px-5 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                  <div className="flex-1 flex items-center gap-2.5 max-w-xl">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                      หมายเหตุคำสั่งซื้อ:
                    </span>
                    <input
                      type="text"
                      placeholder="ฝากข้อความถึงร้านค้า หรือระบุหมายเหตุคำสั่งซื้อ (ไม่บังคับ)"
                      value={remark}
                      onChange={(e) => handleRemarkChange(e.target.value)}
                      maxLength={200}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-end text-right shrink-0">
                    <span className="text-xs sm:text-sm text-slate-600">
                      คำสั่งซื้อทั้งหมด ({totalItemsCount} ชิ้น)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar: "< เลือกดูสินค้าต่อ" */}
              <div 
                className="flex items-center justify-between gap-4 pt-1 animate-checkout-slide-up"
                style={{ animationDelay: '100ms' }}
              >
                <Link
                  href={backHref}
                  onClick={clearCheckoutDraftStorage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-[0_1px_1px_0_rgba(0,0,0,0.03)] transition-colors"
                >
                  <span>&lt; เลือกดูสินค้าต่อ</span>
                </Link>

                <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <span>ทั้งหมด {totalItemsCount} ชิ้น ในรายการสั่งจอง</span>
                </div>
              </div>

              {/* 2. Shopee Full-Width Payment & Order Summary Card (Exact Match to Reference Image) */}
              <div 
                className="bg-white border border-slate-100/80 rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] overflow-hidden animate-checkout-slide-up"
                style={{ animationDelay: '120ms' }}
              >

                {/* Top Section: วิธีการชำระเงิน & Horizontal Selection Tabs */}
                <div className="p-5 sm:px-7 sm:py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap min-w-[120px]">
                      วิธีการชำระเงิน
                    </h3>

                    {/* Horizontal Button Tabs: QR พร้อมเพย์ and เก็บเงินปลายทาง only */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
                      {/* Option 1: QR พร้อมเพย์ (T) */}
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('T')}
                        className={`relative px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium rounded-sm border transition-all cursor-pointer select-none overflow-hidden inline-flex items-center gap-2 ${paymentMethod === 'T'
                          ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs font-semibold'
                          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                          }`}
                      >
                        <img
                          src="/images/thai_qr_payment.svg"
                          alt="Thai QR Payment"
                          className="w-5 h-5 object-contain rounded-[2px] shrink-0"
                        />
                        <span>QR พร้อมเพย์</span>
                        {paymentMethod === 'T' && (
                          <span className="absolute bottom-0 right-0 w-[18px] h-[18px] overflow-hidden pointer-events-none">
                            <span className="absolute bottom-0 right-0 w-0 h-0 border-b-[18px] border-b-emerald-600 border-l-[18px] border-l-transparent" />
                            <svg className="w-2.5 h-2.5 text-white absolute bottom-[1.5px] right-[1.5px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </button>

                      {/* Option 2: เก็บเงินปลายทาง (M) */}
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod('M')}
                        className={`relative px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium rounded-sm border transition-all cursor-pointer select-none overflow-hidden inline-flex items-center gap-2 ${paymentMethod === 'M'
                          ? 'border-emerald-600 text-emerald-700 bg-white shadow-2xs font-semibold'
                          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                          }`}
                      >
                        <img
                          src="/images/cod_logo.png"
                          alt="COD"
                          className="h-4 sm:h-4.5 w-auto object-contain shrink-0"
                        />
                        <span>เก็บเงินปลายทาง</span>
                        {paymentMethod === 'M' && (
                          <span className="absolute bottom-0 right-0 w-[18px] h-[18px] overflow-hidden pointer-events-none">
                            <span className="absolute bottom-0 right-0 w-0 h-0 border-b-[18px] border-b-emerald-600 border-l-[18px] border-l-transparent" />
                            <svg className="w-2.5 h-2.5 text-white absolute bottom-[1.5px] right-[1.5px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </button>

                      {!paymentMethod && (
                        <span className="text-xs text-rose-500 font-medium whitespace-nowrap sm:ml-1">
                          * กรุณาเลือก
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Middle Divider: Solid line separating payment methods from financial summary */}
                <div className="border-t border-slate-100" />

                {/* Financial Summary matching Image 1 */}
                <div className="px-6 sm:px-8 py-5 bg-white space-y-3">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    สรุปยอดคำสั่งซื้อ
                  </h3>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    {/* 1. ยอดรวมทั้งสิ้น (Grand Total) */}
                    <div className="flex justify-between items-center font-bold text-[#FF6B00]">
                      <span>ยอดรวมทั้งสิ้น (Grand Total)</span>
                      <span className="text-[#FF6B00] font-bold tabular-nums">
                        ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Dashed separator */}
                    <div className="border-t border-dashed border-slate-200 my-2" />

                    {/* 2. ยอดมัดจำที่ต้องชำระ (Deposit) */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-600">ยอดมัดจำที่ต้องชำระ (Deposit)</span>
                      <span className="text-xl sm:text-2xl font-bold text-blue-600 tabular-nums">
                        ฿{totalDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* 3. ยอดคงเหลือชำระเมื่อรับมอบ / Remaining */}
                    <div className="flex justify-between items-center text-slate-400">
                      <span>ยอดคงเหลือชำระเมื่อรับมอบ / Remaining</span>
                      <span className="text-slate-500 font-medium tabular-nums">
                        ฿{totalRemainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dashed Line Divider before bottom action bar */}
                <div className="border-t border-dashed border-slate-200" />

                {/* Bottom Action Footer: Button on right */}
                <div className="px-6 sm:px-8 py-5 flex justify-end bg-white">
                  <button
                    type="submit"
                    disabled={submitting || hasZeroQty}
                    className="w-full sm:w-auto px-12 sm:px-14 py-3.5 rounded-full bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold text-base shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] whitespace-nowrap"
                  >
                    {submitting ? (
                      <span>กำลังบันทึกคำสั่งจอง...</span>
                    ) : hasZeroQty ? (
                      <span>โปรดระบุจำนวนสินค้ามากกว่า 0</span>
                    ) : (
                      <span>สั่งสินค้า</span>
                    )}
                  </button>
                </div>

              </div>

            </form>
          </>
        )}

      </div>
    </div>
  );
}

export default function PreOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f5] min-h-[calc(100vh-200px)] min-h-[calc(100dvh-200px)] py-16">
          <WineLoading size="md" />
        </div>
      }
    >
      <PreOrderContent />
    </Suspense>
  );
}
