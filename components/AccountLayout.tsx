'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import { WineLoading } from '@/components/WineLoading';

interface AccountLayoutProps {
  children: React.ReactNode;
  activeItemOverride?: 'profile' | 'orders' | 'account' | 'address' | 'payment';
}

interface MenuItem {
  key: string;
  label: string;
  href: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'account',
    label: 'บัญชีของฉัน',
    href: '/customer/account',
  },
  {
    key: 'orders',
    label: 'คำสั่งซื้อของฉัน',
    href: '/orders/history',
  },
  {
    key: 'address',
    label: 'ข้อมูลที่อยู่จัดส่งสินค้า',
    href: '/customer/account/address',
  },
  {
    key: 'payment',
    label: 'ประวัติและยืนยันการชำระเงิน',
    href: '/purchases/history',
  },
];

const ITEM_HEIGHT_ESTIMATE = 40;
const ITEM_GAP_ESTIMATE = 4;
const ITEM_STEP_ESTIMATE = ITEM_HEIGHT_ESTIMATE + ITEM_GAP_ESTIMATE; // 44px

function getEstimatedTop(key: string): number {
  const index = MENU_ITEMS.findIndex((item) => item.key === key);
  return index >= 0 ? index * ITEM_STEP_ESTIMATE : 0;
}

interface CachedNavState {
  activeKey: string;
  indicatorTop: number;
  indicatorHeight: number;
  hasMeasured: boolean;
}

// Module-level persistent cache across client-side route transitions
let globalNavState: CachedNavState = {
  activeKey: 'account',
  indicatorTop: 0,
  indicatorHeight: ITEM_HEIGHT_ESTIMATE,
  hasMeasured: false,
};

function AccountSidebar({ activeItemOverride }: { activeItemOverride?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { customer, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clickedKey, setClickedKey] = useState<string | null>(null);

  const tab = searchParams?.get('tab') || '';

  // Close mobile menu on route or tab change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, tab]);

  // ตรวจสอบว่าเมนูไหน Active อยู่
  const getIsActive = (key: string): boolean => {
    if (activeItemOverride) {
      return activeItemOverride === key;
    }

    if (key === 'account') {
      return pathname === '/customer/account' && (!tab || tab === 'overview');
    }
    if (key === 'address') {
      return pathname === '/customer/account/address';
    }
    if (key === 'orders') {
      return (pathname === '/orders/history' || pathname === '/orders') && tab !== 'payment';
    }
    if (key === 'payment') {
      return pathname === '/purchases/history';
    }
    return false;
  };

  const currentActiveKey = MENU_ITEMS.find((item) => getIsActive(item.key))?.key || 'account';
  const [optimisticActiveKey, setOptimisticActiveKey] = useState<string>(currentActiveKey);

  useEffect(() => {
    setOptimisticActiveKey(currentActiveKey);
  }, [currentActiveKey]);

  // Sliding indicator measurements & GPU-accelerated transform
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  const [indicatorStyle, setIndicatorStyle] = useState<{
    top: number;
    height: number;
  }>(() => {
    if (globalNavState.hasMeasured) {
      return {
        top: globalNavState.indicatorTop,
        height: globalNavState.indicatorHeight,
      };
    }
    return {
      top: getEstimatedTop(currentActiveKey),
      height: ITEM_HEIGHT_ESTIMATE,
    };
  });

  const updateIndicator = useCallback((key: string) => {
    const el = itemRefs.current[key];
    if (el && navRef.current) {
      const top = el.offsetTop;
      const height = el.offsetHeight;
      setIndicatorStyle({ top, height });
      globalNavState = {
        activeKey: key,
        indicatorTop: top,
        indicatorHeight: height,
        hasMeasured: true,
      };
    }
  }, []);

  useEffect(() => {
    updateIndicator(optimisticActiveKey);
    const timer = setTimeout(() => updateIndicator(optimisticActiveKey), 30);
    const handleResize = () => updateIndicator(optimisticActiveKey);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [optimisticActiveKey, updateIndicator]);

  const handleItemClick = (key: string) => {
    setClickedKey(key);
    setTimeout(() => setClickedKey(null), 300);

    setOptimisticActiveKey(key);
    const el = itemRefs.current[key];
    if (el) {
      const top = el.offsetTop;
      const height = el.offsetHeight;
      setIndicatorStyle({ top, height });
      globalNavState = {
        activeKey: key,
        indicatorTop: top,
        indicatorHeight: height,
        hasMeasured: true,
      };
    } else {
      const estTop = getEstimatedTop(key);
      setIndicatorStyle({ top: estTop, height: ITEM_HEIGHT_ESTIMATE });
      globalNavState = {
        activeKey: key,
        indicatorTop: estTop,
        indicatorHeight: ITEM_HEIGHT_ESTIMATE,
        hasMeasured: true,
      };
    }
  };

  const currentActiveItem = MENU_ITEMS.find((item) => item.key === optimisticActiveKey) || MENU_ITEMS[0];
  const activeTitle = currentActiveItem ? currentActiveItem.label : 'บัญชีของฉัน';

  return (
    <>
      {/* 1. Mobile View (< lg): Header Bar with Animated Hamburger Button & Collapsible Menu */}
      <div className="w-full lg:hidden mb-2">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeTitle}
          </h2>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative w-9 h-9 rounded-lg bg-[#000000] hover:bg-neutral-900 active:bg-black text-white transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center active:scale-90"
            title={isMobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนูบัญชี'}
            aria-expanded={isMobileMenuOpen}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Menu
                className={`w-5 h-5 absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isMobileMenuOpen
                    ? 'opacity-0 rotate-90 scale-75 pointer-events-none'
                    : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <X
                className={`w-5 h-5 absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isMobileMenuOpen
                    ? 'opacity-100 rotate-0 scale-100'
                    : 'opacity-0 -rotate-90 scale-75 pointer-events-none'
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Accordion Menu with Smooth Height & Fade Open/Close Animation */}
        <div className={`${isMobileMenuOpen ? 'mobile-menu-enter mt-2.5' : 'mobile-menu-exit mt-0'}`}>
          <div className="overflow-hidden min-h-0">
            <div className="bg-white rounded-xl border border-slate-200/80 p-2 sm:p-2.5 shadow-sm">
              <nav className="space-y-1 text-sm">
                {MENU_ITEMS.map((item) => {
                  const isActive = optimisticActiveKey === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => {
                        handleItemClick(item.key);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-full transition-all duration-150 block cursor-pointer active:scale-[0.98] ${
                        isActive
                          ? 'font-semibold text-white bg-[#000000] shadow-sm'
                          : 'font-medium text-slate-600 hover:text-black hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {customer && (
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2 cursor-pointer font-medium active:scale-[0.98]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Desktop View (>= lg): Persistent Left Sidebar with Black Capsule Sliding Indicator */}
      <aside className="hidden lg:block w-64 shrink-0 bg-transparent select-none">
        <nav ref={navRef} className="relative space-y-1 text-sm text-slate-600">
          {/* Animated Sliding Active Black #000000 Capsule Indicator */}
          <div
            className="absolute top-0 left-0 right-0 rounded-full bg-[#000000] shadow-sm pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] z-0"
            style={{
              height: `${indicatorStyle.height}px`,
              transform: `translateY(${indicatorStyle.top}px)`,
              willChange: 'transform',
            }}
          />

          {MENU_ITEMS.map((item) => {
            const isActive = optimisticActiveKey === item.key;
            const isClicked = clickedKey === item.key;
            return (
              <Link
                key={item.key}
                ref={(el) => { itemRefs.current[item.key] = el; }}
                href={item.href}
                onClick={() => handleItemClick(item.key)}
                className={`relative z-10 px-4 py-2.5 rounded-full transition-all duration-200 block cursor-pointer select-none active:scale-[0.98] ${
                  isClicked ? 'animate-menu-click' : ''
                } ${
                  isActive
                    ? 'font-semibold text-white'
                    : 'font-medium text-slate-600 hover:text-black hover:bg-slate-200/50 hover:translate-x-1'
                }`}
              >
                <span className="inline-block transition-transform duration-200">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {customer && (
            <div className="pt-4 border-t border-slate-200 mt-3 relative z-10">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-full transition-all duration-150 flex items-center gap-2 cursor-pointer font-medium active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

function AccountSidebarFallback({ activeItemOverride }: { activeItemOverride?: string }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 bg-transparent select-none">
      <nav className="relative space-y-1 text-sm text-slate-600">
        {MENU_ITEMS.map((item) => {
          const isActive = activeItemOverride === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`px-4 py-2.5 rounded-full block select-none ${
                isActive
                  ? 'font-semibold text-white bg-[#000000] shadow-sm'
                  : 'font-medium text-slate-600 hover:text-black hover:bg-slate-200/50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function AccountLayout({
  children,
  activeItemOverride,
}: AccountLayoutProps) {
  const router = useRouter();
  const { customer, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace('/');
    }
  }, [authLoading, customer, router]);

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col bg-[#f5f5f5] py-8">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            <Suspense fallback={<AccountSidebarFallback activeItemOverride={activeItemOverride} />}>
              <AccountSidebar activeItemOverride={activeItemOverride} />
            </Suspense>

            <main className="flex-1 w-full min-w-0">
              <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
                <WineLoading size="md" />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f5] py-8">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Persistent Left Sidebar */}
          <Suspense fallback={<AccountSidebarFallback activeItemOverride={activeItemOverride} />}>
            <AccountSidebar activeItemOverride={activeItemOverride} />
          </Suspense>

          {/* Right Main Content */}
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
