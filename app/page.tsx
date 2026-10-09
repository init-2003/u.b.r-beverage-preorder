'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product } from '@/types/preorder';
import ProductCatalog from '@/components/ProductCatalog';
import { useAuth } from '@/context/AuthContext';
import { HomeSkeleton } from '@/components/HomeSkeleton';

const SCROLL_STORAGE_KEY = 'ubr_home_scroll_y';

function HomeAppPageContent() {
  const router = useRouter();
  const { customer, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const urlCategory = searchParams.get('category') ?? 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const hasRestoredScrollRef = React.useRef(false);

  // 1. จัดการ Scroll Restoration: บันทึกตำแหน่ง scroll ขณะเลื่อนหน้าจอ และก่อน Reload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          try {
            sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
          } catch {}
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
      } catch {}
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 2. คืนค่าตำแหน่ง Scroll เดิม (ที่เคยเลื่อนลงมา) เมื่อโหลดสินค้าเสร็จสมบูรณ์
  useEffect(() => {
    if (!loadingProducts && products.length > 0 && !hasRestoredScrollRef.current) {
      hasRestoredScrollRef.current = true;
      try {
        const savedYStr = sessionStorage.getItem(SCROLL_STORAGE_KEY);
        if (savedYStr) {
          const targetY = parseInt(savedYStr, 10);
          if (!isNaN(targetY) && targetY > 0) {
            const rafId = requestAnimationFrame(() => {
              window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
            });
            const timeoutId = setTimeout(() => {
              if (Math.abs(window.scrollY - targetY) > 50) {
                window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
              }
            }, 60);
            return () => {
              cancelAnimationFrame(rafId);
              clearTimeout(timeoutId);
            };
          }
        }
      } catch {}
    }
  }, [loadingProducts, products.length]);

  // ตรวจสอบสถานะการเข้าสู่ระบบ หากยังไม่ล็อกอิน ให้ redirect ไป /login
  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace('/login');
    }
  }, [authLoading, customer, router]);

  // โหลดรายการสินค้าตาม Category และ Search
  const fetchProducts = useCallback(async (cat: string, search: string) => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '80');
      if (cat && cat !== 'all' && cat !== 'ทั้งหมด') {
        params.set('category', cat);
      }
      if (search && search.trim()) {
        params.set('search', search.trim());
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        const mapped: Product[] = data.products.map((p: any) => {
          const price = Number(p.Sale_Price1 ?? 0);
          const depositPrice = Number(p.Trade_deposit) || 0;
          const depositPercent = (depositPrice > 0 && price > 0)
            ? Math.round((depositPrice / price) * 100)
            : 0;

          return {
            id: p.Trade_Id,
            name: p.Trade_Name,
            nameEN: p.Trade_NameEN,
            category: p.Type_Name || 'Pre Order',
            unitName: (p.Unit_Name || '').trim(),
            price,
            salePrice1: price,
            depositPrice,
            depositPercent,
            leadTimeDays: 0,
            origin: p.Trade_Province || '',
            alcoholPercent: 0,
            description: p.Trade_Note || '',
            imageUrl: p.Trade_Part_Image
              ? p.Trade_Part_Image.startsWith('/') || p.Trade_Part_Image.startsWith('http')
                ? p.Trade_Part_Image
                : `/${p.Trade_Part_Image}`
              : '/images/ubr_beverage_logo.png',
          };
        });

        setProducts(mapped);
      }
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // 3. เรียก fetchProducts เมื่อ URL parameters (category หรือ search) เปลี่ยน
  useEffect(() => {
    fetchProducts(urlCategory, urlSearch);
  }, [urlCategory, urlSearch, fetchProducts]);

  const handleSelectCategory = (cat: string) => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const params = new URLSearchParams(searchParams.toString());
    if (cat && cat !== 'all') {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  const handleSearchChange = (q: string) => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const params = new URLSearchParams(searchParams.toString());
    if (q && q.trim()) {
      params.set('search', q.trim());
    } else {
      params.delete('search');
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  // รีเซ็ตทั้ง search + category ในการ push เดียว
  // (ห้ามเรียก handleSearchChange('') แล้วตามด้วย handleSelectCategory('all')
  //  เพราะทั้งคู่สร้าง URL จาก searchParams snapshot เดียวกัน → push หลังทับ push แรก
  //   ทำให้ search ยังอยู่ใน URL → หน้า Empty ไม่ยอมเปลี่ยน)
  const handleResetFilters = () => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    router.push('/');
  };

  if (authLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-3 pb-12 flex-1 flex flex-col space-y-4">
      <ProductCatalog
        products={products}
        loadingProducts={loadingProducts}
        selectedCategory={urlCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={urlSearch}
        onSearchChange={handleSearchChange}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}

export default function HomeAppPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeAppPageContent />
    </Suspense>
  );
}
