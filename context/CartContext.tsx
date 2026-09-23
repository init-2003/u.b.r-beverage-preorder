'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  tradeId: string;
  tradeName: string;
  tradeNameEN?: string;
  unitName: string;
  typeName?: string;
  salePrice: number;
  depositPrice?: number;
  qty: number;
  image?: string;
}

export interface AddedModalData {
  item: CartItem;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number, options?: { showModal?: boolean }) => void;
  removeItem: (tradeId: string) => void;
  removeItems: (tradeIds: string[]) => void;
  updateQty: (tradeId: string, qty: number) => void;
  clearCart: () => void;
  totalQty: number;
  totalAmount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isAddedModalOpen: boolean;
  lastAddedItem: AddedModalData | null;
  openAddedModal: (item: CartItem, qty?: number) => void;
  closeAddedModal: () => void;
  syncCartWithDb: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  
  // 1. Initialize items directly and synchronously from localStorage so there's zero hydration delay or race condition
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ubr_cart_items');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading cart from storage on init', e);
      }
    }
    return [];
  });

  const [isLoaded, setIsLoaded] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddedModalOpen, setIsAddedModalOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<AddedModalData | null>(null);

  const isServerSyncedRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ส่งข้อมูลตะกร้าไปบันทึกที่ฐานข้อมูล (Fnt_Header_online ด้วย Fn_Doc_No = 'ORDautorun')
  const syncToDbServer = useCallback((currentItems: CartItem[], immediate = false) => {
    if (!customer?.customerId) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    const doSync = async () => {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: currentItems }),
        });
      } catch (err) {
        console.error('Failed to sync cart to database ORDautorun', err);
      }
    };

    if (immediate) {
      doSync();
    } else {
      syncTimeoutRef.current = setTimeout(doSync, 250);
    }
  }, [customer?.customerId]);

  // ดึงข้อมูลตะกร้าจากฐานข้อมูลเมื่อลูกค้าล็อกอิน
  const syncCartWithDb = useCallback(async () => {
    if (!customer?.customerId) return;

    try {
      const res = await fetch('/api/cart');
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        const dbItems: CartItem[] = data.items;

        // ตรวจสอบว่ามาจากการกดปุ่ม "สั่งซื้อ" ตอนยังไม่ล็อกอินหรือไม่
        let isFromCheckoutIntent = false;
        if (typeof window !== 'undefined') {
          try {
            isFromCheckoutIntent = sessionStorage.getItem('ubr_pending_checkout_merge') === 'true';
            sessionStorage.removeItem('ubr_pending_checkout_merge');
          } catch {}
        }

        setItems((currentItems) => {
          // กรณีพิเศษเฉพาะ: ถ้ากด "สั่งซื้อ" ตอนยังไม่ล็อกอิน ให้ทำการ Merge สินค้าที่เพิ่งเลือก เข้ากับตะกร้าของบัญชี
          if (isFromCheckoutIntent) {
            if (dbItems.length > 0 && currentItems.length > 0) {
              const mergedMap = new Map<string, CartItem>();
              for (const it of dbItems) {
                mergedMap.set(it.tradeId, it);
              }
              for (const it of currentItems) {
                if (mergedMap.has(it.tradeId)) {
                  const existing = mergedMap.get(it.tradeId)!;
                  mergedMap.set(it.tradeId, {
                    ...it,
                    qty: Math.max(existing.qty, it.qty),
                  });
                } else {
                  mergedMap.set(it.tradeId, it);
                }
              }
              const merged = Array.from(mergedMap.values());
              syncToDbServer(merged, true);
              try {
                localStorage.setItem('ubr_cart_items', JSON.stringify(merged));
              } catch {}
              return merged;
            } else if (currentItems.length > 0) {
              syncToDbServer(currentItems, true);
              try {
                localStorage.setItem('ubr_cart_items', JSON.stringify(currentItems));
              } catch {}
              return currentItems;
            }
          }

          // กรณีเข้าสู่ระบบทั่วไป (เช่น กดล็อกอินที่ Navbar หรือเปิดเว็บใหม่): ไม่ต้อง Merge!
          // ยึดตามฐานข้อมูลของบัญชีนั้นเป็นหลัก 100% (มี 3 ชิ้นในบัญชี ก็แสดง 3 ชิ้นตามจริง)
          if (dbItems.length > 0) {
            try {
              localStorage.setItem('ubr_cart_items', JSON.stringify(dbItems));
            } catch {}
            return dbItems;
          }

          // ถ้าใน DB บัญชียังว่างเปล่า (0 ชิ้น) และไม่มีการกดสั่งซื้อ
          try {
            localStorage.setItem('ubr_cart_items', JSON.stringify([]));
          } catch {}
          return [];
        });
      }
    } catch (e) {
      console.error('Failed to fetch cart from server', e);
    } finally {
      isServerSyncedRef.current = true;
    }
  }, [customer?.customerId, syncToDbServer]);

  // Multi-tab sync สำหรับตะกร้าสินค้าข้ามแท็บ
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ubr_cart_items' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // เมื่อผู้ใช้ล็อกอิน ให้ดึงข้อมูลตะกร้าจากฐานข้อมูล ORDautorun
  useEffect(() => {
    if (customer?.customerId) {
      isServerSyncedRef.current = false;
      syncCartWithDb();
    } else {
      isServerSyncedRef.current = false;
    }
  }, [customer?.customerId, syncCartWithDb]);

  // บันทึกลง localStorage เสมอ และ Sync ไปยังฐานข้อมูล MSSQL เมื่อมีบัญชีล็อกอินและ Sync สำเร็จแล้ว
  useEffect(() => {
    try {
      localStorage.setItem('ubr_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart to storage', e);
    }

    if (customer?.customerId && isServerSyncedRef.current) {
      syncToDbServer(items);
    }
  }, [items, customer?.customerId, syncToDbServer]);

  const openAddedModal = (item: CartItem, qty = 1) => {
    setLastAddedItem({ item, qty });
    setIsAddedModalOpen(true);
  };

  const closeAddedModal = () => {
    setIsAddedModalOpen(false);
  };

  const addItem = (
    item: Omit<CartItem, 'qty'>,
    qty = 1,
    options?: { showModal?: boolean }
  ) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.tradeId === item.tradeId);
      let updated: CartItem[];
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex].qty += qty;
      } else {
        updated = [...prev, { ...item, qty }];
      }

      if (customer?.customerId) {
        syncToDbServer(updated);
      }
      return updated;
    });

    if (options?.showModal !== false) {
      setLastAddedItem({ item: { ...item, qty }, qty });
      setIsAddedModalOpen(true);
    }
  };

  const removeItem = (tradeId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.tradeId !== tradeId);
      if (customer?.customerId) {
        syncToDbServer(next);
      }
      return next;
    });
  };

  const removeItems = (tradeIds: string[]) => {
    const idSet = new Set(tradeIds);
    setItems((prev) => {
      const next = prev.filter((i) => !idSet.has(i.tradeId));
      if (customer?.customerId) {
        syncToDbServer(next);
      }
      return next;
    });
  };

  const updateQty = (tradeId: string, qty: number) => {
    const nextQty = Math.max(0, qty);
    setItems((prev) => {
      const next = nextQty === 0
        ? prev.filter((i) => i.tradeId !== tradeId)
        : prev.map((i) => (i.tradeId === tradeId ? { ...i, qty: nextQty } : i));
      if (customer?.customerId) {
        syncToDbServer(next);
      }
      return next;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (customer?.customerId) {
      syncToDbServer([]);
    }
  };

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.qty * item.salePrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        removeItems,
        updateQty,
        clearCart,
        totalQty,
        totalAmount,
        isDrawerOpen,
        setIsDrawerOpen,
        isAddedModalOpen,
        lastAddedItem,
        openAddedModal,
        closeAddedModal,
        syncCartWithDb,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
