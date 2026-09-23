'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';

interface AccountLayoutProps {
  children: React.ReactNode;
  activeItemOverride?: 'profile' | 'orders' | 'account' | 'address' | 'payment';
}

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

  const menuItems = [
    {
      key: 'account',
      label: 'บัญชีของฉัน',
      href: '/customer/account',
    },
    {
      key: 'orders',
      label: 'คำสั่งซื้อของคุณ',
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

  const currentActiveItem = menuItems.find((item) => getIsActive(item.key));
  const activeTitle = currentActiveItem ? currentActiveItem.label : 'บัญชีของฉัน';

  return (
    <>
      {/* 1. Mobile View (< lg): Header Bar with Hamburger Button & Collapsible Menu */}
      <div className="w-full lg:hidden mb-2">
        {/* Mobile Header Bar matching Image 2 */}
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeTitle}
          </h2>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-sm bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer shadow-xs flex items-center justify-center"
            title={isMobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนูบัญชี'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Collapsible Menu Card matching Image 1 */}
        {isMobileMenuOpen && (
          <div className="bg-white rounded-sm border border-slate-100/80 p-2 sm:p-3 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] mt-3 animate-in fade-in-50 zoom-in-98 duration-150">
            <nav className="space-y-1 text-sm">
              {menuItems.map((item) => {
                const isActive = getIsActive(item.key);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3.5 py-2.5 rounded-sm transition-colors block ${
                      isActive
                        ? 'font-bold text-slate-900 bg-slate-100/90 shadow-2xs'
                        : 'font-medium text-slate-600 hover:text-red-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Logout Button */}
              {customer && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-sm transition-colors flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* 2. Desktop View (>= lg): Persistent Left Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-transparent">
        <nav className="space-y-1 text-sm text-slate-600">
          {menuItems.map((item) => {
            const isActive = getIsActive(item.key);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`px-3.5 py-2.5 rounded-sm transition-colors block ${
                  isActive
                    ? 'font-bold text-slate-900 bg-slate-100/90 shadow-2xs'
                    : 'font-medium text-slate-600 hover:text-red-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Desktop Logout Button */}
          {customer && (
            <div className="pt-4 border-t border-slate-200 mt-3">
              <button
                type="button"
                onClick={() => logout()}
                className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-sm transition-colors flex items-center gap-2 cursor-pointer font-medium"
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

function AccountSidebarFallback() {
  return (
    <aside className="hidden lg:block w-64 shrink-0 bg-transparent">
      <div className="space-y-2">
        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
      </div>
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

  if (authLoading || !customer) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f5] py-8">
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Persistent Left Sidebar */}
          <Suspense fallback={<AccountSidebarFallback />}>
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
