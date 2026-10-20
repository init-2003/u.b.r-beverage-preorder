'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, MenuTreeItem } from '@/types/preorder';
import ProductCatalog from '@/components/ProductCatalog';
import CategorySidebar from '@/components/CategorySidebar';
import { BannerCarousel } from '@/components/BannerCarousel';
import { useAuth } from '@/context/AuthContext';
import { HomeSkeleton } from '@/components/HomeSkeleton';
import { calcDeposit } from '@/lib/deposit';
import {
  getStoredCategory,
  getStoredSubMenuId,
  getStoredTypeId,
  setStoredCategory,
  clearStoredCategory,
  CATEGORY_CHANGE_EVENT,
  SIDEBAR_TOGGLE_EVENT,
} from '@/lib/category-storage';

const SCROLL_STORAGE_KEY = 'ubr_home_scroll_y';
const NAVIGATING_AWAY_KEY = 'ubr_navigating_away';

export interface HomePageClientProps {
  initialCollapsed?: boolean;
}

export function HomePageClient({ initialCollapsed = false }: HomePageClientProps) {
  const router = useRouter();
  const { customer, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get('search') ?? '';
  const urlCategoryParam = searchParams.get('category');
  const urlTypeIdParam = searchParams.get('typeId');
  const urlSubMenuIdParam = searchParams.get('subMenuId')
    ? parseInt(searchParams.get('subMenuId')!, 10)
    : undefined;

  const [persistedCat, setPersistedCat] = useState<string>('all');
  const [persistedTypeId, setPersistedTypeId] = useState<string | undefined>(undefined);
  const [persistedSubMenuId, setPersistedSubMenuId] = useState<number | undefined>(undefined);

  // Menu Tree state
  const [menuTree, setMenuTree] = useState<MenuTreeItem[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [loadingMenuTree, setLoadingMenuTree] = useState<boolean>(true);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(initialCollapsed);
  const hasRestoredScrollRef = React.useRef(false);
  const isNavigatingAwayRef = React.useRef(false);
  const currentRequestIdRef = React.useRef(0);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('ubr_sidebar_collapsed', String(next));
        if (window.innerWidth >= 1200) {
          sessionStorage.setItem('ubr_sidebar_collapsed_wide', String(next));
        }
        document.cookie = `ubr_sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
        if (window.innerWidth >= 1200) {
          document.cookie = `ubr_sidebar_collapsed_wide=${next}; path=/; max-age=31536000; SameSite=Lax`;
        }
      } catch {}
      return next;
    });
  }, []);

  // Auto-collapse sidebar when screen is resized/shrunk (< 1200px)
  const prevWidthRef = React.useRef(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const initialWidth = window.innerWidth;
    prevWidthRef.current = initialWidth;

    if (initialWidth < 1200) {
      // Shrunk screen on initial load -> auto-collapse
      setIsSidebarCollapsed(true);
      try {
        document.cookie = 'ubr_sidebar_collapsed=true; path=/; max-age=31536000; SameSite=Lax';
      } catch {}
    } else {
      // Wide desktop screen -> restore user preference if any
      try {
        const saved = sessionStorage.getItem('ubr_sidebar_collapsed_wide');
        if (saved === 'true') {
          setIsSidebarCollapsed(true);
          document.cookie = 'ubr_sidebar_collapsed_wide=true; path=/; max-age=31536000; SameSite=Lax';
        } else if (saved === 'false') {
          setIsSidebarCollapsed(false);
          document.cookie = 'ubr_sidebar_collapsed_wide=false; path=/; max-age=31536000; SameSite=Lax';
        }
      } catch {}
    }

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const prevWidth = prevWidthRef.current;

      // Crossing boundary from wide (>= 1200) down to narrow (< 1200)
      if (prevWidth >= 1200 && currentWidth < 1200) {
        setIsSidebarCollapsed(true);
        try {
          document.cookie = 'ubr_sidebar_collapsed=true; path=/; max-age=31536000; SameSite=Lax';
        } catch {}
      }
      // Crossing boundary from narrow (< 1200) up to wide (>= 1200)
      else if (prevWidth < 1200 && currentWidth >= 1200) {
        try {
          const saved = sessionStorage.getItem('ubr_sidebar_collapsed_wide');
          const isSaved = saved === 'true';
          setIsSidebarCollapsed(isSaved);
          document.cookie = `ubr_sidebar_collapsed_wide=${isSaved}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {
          setIsSidebarCollapsed(false);
        }
      }

      prevWidthRef.current = currentWidth;
    };

    const handleNavbarToggle = () => {
      handleToggleSidebar();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, handleNavbarToggle);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener(SIDEBAR_TOGGLE_EVENT, handleNavbarToggle);
    };
  }, [handleToggleSidebar]);

  // Sync category state from localStorage and listen to category changes
  useEffect(() => {
    setPersistedCat(getStoredCategory());
    setPersistedTypeId(getStoredTypeId());
    setPersistedSubMenuId(getStoredSubMenuId());

    const handleCategoryChange = (e?: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      if (customDetail) {
        setPersistedCat(customDetail.category || 'all');
        setPersistedSubMenuId(customDetail.subMenuId);
        setPersistedTypeId(customDetail.typeId);
      } else {
        setPersistedCat(getStoredCategory());
        setPersistedTypeId(getStoredTypeId());
        setPersistedSubMenuId(getStoredSubMenuId());
      }
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
      } catch {}
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
    window.addEventListener('storage', handleCategoryChange);
    return () => {
      window.removeEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
      window.removeEventListener('storage', handleCategoryChange);
    };
  }, []);

  // Fetch Menu Tree on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMenuTree() {
      try {
        setLoadingMenuTree(true);
        const res = await fetch('/api/menu-tree');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.tree)) {
          setMenuTree(data.tree);
          setTotalProductsCount(Number(data.totalProducts) || 0);
        }
      } catch (err) {
        console.error('Failed to load menu tree:', err);
      } finally {
        if (isMounted) setLoadingMenuTree(false);
      }
    }
    loadMenuTree();
    return () => {
      isMounted = false;
    };
  }, []);

  // If URL explicitly defines category or typeId or subMenuId, sync with storage and cleanse address bar to clean '/'
  useEffect(() => {
    if (urlCategoryParam || urlTypeIdParam || urlSubMenuIdParam) {
      setStoredCategory(urlCategoryParam || 'all', urlSubMenuIdParam, urlTypeIdParam || undefined);
      if (urlCategoryParam) setPersistedCat(urlCategoryParam);
      if (urlTypeIdParam) setPersistedTypeId(urlTypeIdParam);
      if (urlSubMenuIdParam) setPersistedSubMenuId(urlSubMenuIdParam);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        params.delete('category');
        params.delete('typeId');
        params.delete('subMenuId');
        const cleanUrl = params.toString() ? `/?${params.toString()}` : '/';
        window.history.replaceState(null, '', cleanUrl);
      }
    }
  }, [urlCategoryParam, urlTypeIdParam, urlSubMenuIdParam]);

  const activeCategory = persistedCat || 'all';
  const activeTypeId = persistedTypeId;
  const activeSubMenuId = persistedSubMenuId;

  const isAllActive =
    (!activeTypeId || activeTypeId === 'all') &&
    !activeSubMenuId &&
    (!activeCategory || activeCategory === 'all' || activeCategory === 'ทั้งหมด');

  const showBanner = isAllActive && !urlSearch.trim();

  // 1. จัดการ Scroll Restoration: บันทึกตำแหน่ง scroll ขณะเลื่อนหน้าจอ และก่อน Reload / นำทาง
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    let ticking = false;
    const handleScroll = () => {
      // ตรวจสอบว่าอยู่หน้าหลักจริงหรือไม่
      if (typeof window === 'undefined' || window.location.pathname !== '/') return;

      // หากกำลังกดนำทางออกจากหน้าหลัก ไม่ให้บันทึกค่า scroll=0 ที่ Next.js รีเซ็ตก่อนเปลี่ยนหน้า
      if (isNavigatingAwayRef.current) return;
      try {
        if (sessionStorage.getItem(NAVIGATING_AWAY_KEY) === '1') return;
      } catch {}

      const currentY = Math.max(
        0,
        window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
      );

      // หากยังไม่ได้คืนค่า scroll เดิม (ช่วงที่เพิ่งโหลดหน้าจอ) ไม่ให้ค่า scroll=0 เริ่มต้นมาทับค่าเดิม
      if (!hasRestoredScrollRef.current) {
        try {
          const savedY = parseInt(sessionStorage.getItem(SCROLL_STORAGE_KEY) || '0', 10);
          if (savedY > 0 && currentY === 0) {
            return;
          }
        } catch {}
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          try {
            if (!isNavigatingAwayRef.current && sessionStorage.getItem(NAVIGATING_AWAY_KEY) !== '1') {
              const y = Math.max(
                0,
                window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
              );
              sessionStorage.setItem(SCROLL_STORAGE_KEY, String(y));
            }
          } catch {}
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleBeforeUnload = () => {
      try {
        const y = Math.max(
          0,
          window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
        );
        if (y > 0) {
          sessionStorage.setItem(SCROLL_STORAGE_KEY, String(y));
        }
      } catch {}
    };

    // ดักจับการคลิกลิงก์ภายในทุกประเภทที่นำทางออกจากหน้าหลัก (เช่น สินค้า, ตะกร้า, สั่งซื้อ)
    // เพื่อบันทึกตำแหน่ง scroll ล่าสุด และล็อกสถานะไม่ให้ Next.js รีเซ็ตเป็น 0 ระหว่าง transition
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href, window.location.origin);
          if (url.origin === window.location.origin && url.pathname !== '/') {
            const currentY = Math.max(
              0,
              window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
            );
            sessionStorage.setItem(SCROLL_STORAGE_KEY, String(currentY));
            sessionStorage.setItem(NAVIGATING_AWAY_KEY, '1');
            isNavigatingAwayRef.current = true;
          }
        } catch {}
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('click', handleDocumentClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  // 2. คืนค่าตำแหน่ง Scroll เดิม เมื่อโหลดสินค้าเสร็จสมบูรณ์
  useEffect(() => {
    if (loadingProducts || products.length === 0 || hasRestoredScrollRef.current) {
      return;
    }

    try {
      const savedYStr = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      const targetY = savedYStr ? parseInt(savedYStr, 10) : 0;

      if (isNaN(targetY) || targetY <= 0) {
        hasRestoredScrollRef.current = true;
        try {
          sessionStorage.removeItem(NAVIGATING_AWAY_KEY);
        } catch {}
        return;
      }

      let attempts = 0;
      const maxAttempts = 15;
      let rafId: number | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      const attemptScroll = () => {
        attempts++;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const boundedTarget = Math.min(targetY, maxScroll);

        window.scrollTo({ top: boundedTarget, left: 0, behavior: 'auto' });

        const currentY = Math.max(
          0,
          window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
        );
        const diff = Math.abs(currentY - targetY);

        if (
          diff <= 15 ||
          (maxScroll >= targetY && currentY >= targetY - 15) ||
          attempts >= maxAttempts
        ) {
          hasRestoredScrollRef.current = true;
          try {
            sessionStorage.removeItem(NAVIGATING_AWAY_KEY);
          } catch {}
          return;
        }

        timeoutId = setTimeout(attemptScroll, Math.min(40 * attempts, 200));
      };

      rafId = requestAnimationFrame(() => {
        attemptScroll();
      });

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    } catch {
      hasRestoredScrollRef.current = true;
    }
  }, [loadingProducts, products.length]);

  // ตรวจสอบสถานะการเข้าสู่ระบบ หากยังไม่ล็อกอิน ให้ redirect ไป /login
  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace('/login');
    }
  }, [authLoading, customer, router]);

  // โหลดรายการสินค้าตาม Category, Search, TypeId และ SubMenuId
  const fetchProducts = useCallback(
    async (cat: string, search: string, tId?: string, sId?: number) => {
      const requestId = ++currentRequestIdRef.current;
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '80');

        if (sId && sId > 0) {
          params.set('subMenuId', String(sId));
        } else if (tId && tId !== 'all' && tId !== 'ทั้งหมด') {
          params.set('typeId', tId);
        } else if (cat && cat !== 'all' && cat !== 'ทั้งหมด') {
          params.set('category', cat);
        }

        if (search && search.trim()) {
          params.set('search', search.trim());
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();

        // If another request was fired while this was fetching, ignore this result
        if (requestId !== currentRequestIdRef.current) return;

        if (data.success && Array.isArray(data.products)) {
          const mapped: Product[] = data.products.map((p: any) => {
            const price = Number(p.Active_Price ?? p.Sale_Price1 ?? 0);
            const dep =
              p.Deposit_Percent != null && p.Deposit_Price != null
                ? {
                    depositPercent: Number(p.Deposit_Percent),
                    depositPrice: Number(p.Deposit_Price),
                  }
                : calcDeposit(price, p.Trade_deposit);

            return {
              id: p.Trade_Id,
              name: p.Trade_Name,
              nameEN: p.Trade_NameEN,
              category: p.category || p.SubMenu_NameTH || p.Type_Name || 'Pre Order',
              productType: p.productType,
              subMenuIdRef: p.SubMenu_ID_Ref,
              subMenuNameTH: p.SubMenu_NameTH,
              subMenuNameEN: p.SubMenu_NameEN,
              unitName: (p.Unit_Name || '').trim(),
              price,
              salePrice1: price,
              depositPrice: dep.depositPrice,
              depositPercent: dep.depositPercent,
              leadTimeDays: 0,
              leadTimeText: (p.Trade_TrakDay_Text || p.leadTimeText || '').trim(),
              Trade_TrakDay_Text: (p.Trade_TrakDay_Text || p.leadTimeText || '').trim(),
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
        if (requestId === currentRequestIdRef.current) {
          console.error('Failed to load products', e);
        }
      } finally {
        if (requestId === currentRequestIdRef.current) {
          setLoadingProducts(false);
        }
      }
    },
    []
  );

  // 3. เรียก fetchProducts เมื่อ activeCategory, search, activeTypeId หรือ activeSubMenuId เปลี่ยน
  useEffect(() => {
    fetchProducts(activeCategory, urlSearch, activeTypeId, activeSubMenuId);
  }, [activeCategory, urlSearch, activeTypeId, activeSubMenuId, fetchProducts]);

  // Sidebar Selection: "สินค้าทั้งหมด"
  const handleSelectAll = () => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}
    clearStoredCategory();
    setPersistedCat('all');
    setPersistedTypeId(undefined);
    setPersistedSubMenuId(undefined);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('category');
      params.delete('typeId');
      params.delete('subMenuId');
      const cleanUrl = params.toString() ? `/?${params.toString()}` : '/';
      window.history.replaceState(null, '', cleanUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sidebar Selection: Type (เมนูหลัก)
  const handleSelectType = (typeId: string, typeName: string) => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}

    setStoredCategory(typeName, undefined, typeId);
    setPersistedCat(typeName);
    setPersistedTypeId(typeId);
    setPersistedSubMenuId(undefined);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('category');
      params.delete('typeId');
      params.delete('subMenuId');
      const cleanUrl = params.toString() ? `/?${params.toString()}` : '/';
      window.history.replaceState(null, '', cleanUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sidebar Selection: SubMenu (เมนูย่อย)
  const handleSelectSubMenu = (subMenuId: number, subMenuNameTH: string, typeId: string) => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}

    setStoredCategory(subMenuNameTH, subMenuId, typeId);
    setPersistedCat(subMenuNameTH);
    setPersistedTypeId(typeId);
    setPersistedSubMenuId(subMenuId);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('category');
      params.delete('typeId');
      params.delete('subMenuId');
      const cleanUrl = params.toString() ? `/?${params.toString()}` : '/';
      window.history.replaceState(null, '', cleanUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (cat: string) => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}

    if (!cat || cat === 'all' || cat === 'ทั้งหมด') {
      handleSelectAll();
      return;
    }

    setStoredCategory(cat);
    setPersistedCat(cat);
    setPersistedTypeId(undefined);
    setPersistedSubMenuId(undefined);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('category');
      params.delete('typeId');
      params.delete('subMenuId');
      const cleanUrl = params.toString() ? `/?${params.toString()}` : '/';
      window.history.replaceState(null, '', cleanUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (q: string) => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}
    const params = new URLSearchParams();
    if (q && q.trim()) {
      params.set('search', q.trim());
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  // รีเซ็ตทั้ง search + category ในการ push เดียว
  const handleResetFilters = () => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, '0');
    } catch {}
    clearStoredCategory();
    setPersistedCat('all');
    setPersistedTypeId(undefined);
    setPersistedSubMenuId(undefined);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (authLoading) {
    return <HomeSkeleton isSidebarCollapsed={isSidebarCollapsed} showBanner={showBanner} />;
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-white">
      <div className="max-w-[1600px] mx-auto w-full px-2 sm:px-6 lg:px-8 pt-0 pb-12 flex-1 flex flex-col">
        {/* Main Layout: Left Category Sidebar + Right (Banner Carousel + Product Catalog) */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4 lg:gap-6 items-start w-full">
          {/* Left Category Sidebar (Type as main menu, Type_SubMenu as sub menu - Perfectly aligned with Banner) */}
          <CategorySidebar
            menuTree={menuTree}
            totalProducts={totalProductsCount}
            loading={loadingMenuTree}
            selectedTypeId={activeTypeId}
            selectedSubMenuId={activeSubMenuId}
            selectedCategory={activeCategory}
            onSelectAll={handleSelectAll}
            onSelectType={handleSelectType}
            onSelectSubMenu={handleSelectSubMenu}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />

          {/* Right Main Content Area: Top Banner Carousel + Product Catalog */}
          <div className={`flex-1 min-w-0 w-full flex flex-col ${!showBanner ? 'pt-4 sm:pt-5' : ''} space-y-6`}>
            {/* Top Banner Carousel (Shown only when "ทั้งหมด" is active and not searching) */}
            {showBanner && (
              <BannerCarousel />
            )}

            {/* Product Catalog */}
            <ProductCatalog
              products={products}
              loadingProducts={loadingProducts}
              selectedCategory={activeCategory}
              selectedTypeId={activeTypeId}
              selectedSubMenuId={activeSubMenuId}
              onSelectCategory={handleSelectCategory}
              searchQuery={urlSearch}
              onSearchChange={handleSearchChange}
              onResetFilters={handleResetFilters}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePageClient;
