'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product } from '@/types/preorder';
import ProductCatalog from '@/components/ProductCatalog';
import { useAuth } from '@/context/AuthContext';
import { HomeSkeleton } from '@/components/HomeSkeleton';

function HomeAppPageContent() {
  const router = useRouter();
  const { customer, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const urlCategory = searchParams.get('category') ?? 'all';

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ป้องกันเบราว์เซอร์จำตำแหน่ง Scroll เดิมตอนกด Refresh เพื่อให้หน้าหลักเริ่มที่บนสุด (เห็น Banner) เสมอ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

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
