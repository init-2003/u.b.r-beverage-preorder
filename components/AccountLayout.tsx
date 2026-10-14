'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
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

function AccountSidebar({ activeItemOverride }: { activeItemOverride?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { customer, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tab = searchParams?.get('tab') || '';

  // Close mobile menu on route or tab change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, tab]);

  // Auto-close mobile menu when resizing to desktop (>= lg / 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleItemClick = (key: string) => {
    setOptimisticActiveKey(key);
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

        {/* Mobile Accordion Menu with Edge-to-Edge Layout & Dashed Line Dividers matching Image 2 */}
        <div className={`-mx-4 sm:-mx-6 lg:mx-0 ${isMobileMenuOpen ? 'mobile-menu-enter mt-2 mb-3' : 'mobile-menu-exit mt-0 mb-0'}`}>
          <div className="overflow-hidden min-h-0">
            <div className="w-full bg-white border-t border-dashed border-slate-200">
              <nav className="text-sm sm:text-base">
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
                      className={`w-full flex items-center px-4 sm:px-6 py-3.5 border-b border-dashed border-slate-200 transition-colors duration-150 cursor-pointer active:bg-slate-50 ${
                        isActive
                          ? 'font-bold text-slate-900'
                          : 'font-normal text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {customer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 sm:px-6 py-3.5 text-red-600 hover:bg-red-50/50 active:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer font-medium text-sm sm:text-base border-b border-dashed border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Desktop View (>= lg): Persistent Left Sidebar with Dashed Line Dividers matching Image 2 */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white select-none">
        <nav className="w-full border-t border-dashed border-slate-200 text-sm">
          {MENU_ITEMS.map((item) => {
            const isActive = optimisticActiveKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => handleItemClick(item.key)}
                className={`w-full flex items-center px-4 py-3.5 border-b border-dashed border-slate-200 transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'font-bold text-slate-900'
                    : 'font-normal text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}

          {customer && (
            <button
              type="button"
              onClick={() => logout()}
              className="w-full text-left px-4 py-3.5 text-red-600 hover:bg-red-50/50 active:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer font-medium text-sm border-b border-dashed border-slate-200"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}

function AccountSidebarFallback({ activeItemOverride }: { activeItemOverride?: string }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0 bg-white select-none">
      <nav className="w-full border-t border-dashed border-slate-200 text-sm">
        {MENU_ITEMS.map((item) => {
          const isActive = activeItemOverride === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`w-full flex items-center px-4 py-3.5 border-b border-dashed border-slate-200 block select-none ${
                isActive
                  ? 'font-bold text-slate-900'
                  : 'font-normal text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{item.label}</span>
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
      <div className="flex-1 flex flex-col bg-white py-8">
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
    <div className="flex-1 flex flex-col bg-white py-8">
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
