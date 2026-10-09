'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import CompanyLogo from './CompanyLogo';
import CartDropdown from './CartDropdown';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Search, X, Package } from 'lucide-react';



function NavbarSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  // Sync state with URL search param
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      router.push(`/?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (searchParams.get('search')) {
      router.push('/');
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="w-full h-10 bg-white rounded-full p-[3px] shadow-sm flex items-center border border-white"
    >
      <div className="relative flex-1 flex items-center h-full">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาสินค้าที่ต้องการที่นี่....."
          className="w-full h-full pl-4 sm:pl-5 pr-8 bg-transparent text-sm sm:text-[14.5px] text-slate-800 placeholder:text-slate-400 outline-none border-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer transition-colors"
            title="ล้างคำค้นหา"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="h-full px-5 sm:px-6 bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
        title="ค้นหา"
      >
        <Search className="w-4 h-4 text-white stroke-[2.5]" />
      </button>
    </form>
  );
}

function MobileSearchOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      inputRef.current?.blur();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      router.push(`/?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/');
    }
    onClose();
  };

  const handleClearOrClose = () => {
    if (searchTerm) {
      setSearchTerm('');
      if (searchParams.get('search')) {
        router.push('/');
      }
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
      <div className="flex-1 h-10 bg-white rounded-full p-[3px] shadow-sm flex items-center border border-white">
        <div className="relative flex-1 flex items-center h-full">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาสินค้าที่ต้องการที่นี่....."
            className="w-full h-full pl-4 pr-7 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none border-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="absolute right-1 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer active:scale-90 transition-transform"
              title="ล้างคำค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-full px-4 bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95"
          title="ค้นหา"
        >
          <Search className="w-4 h-4 text-white stroke-[2.5]" />
        </button>
      </div>
      <button
        type="button"
        onClick={handleClearOrClose}
        className="p-2 text-white hover:text-amber-200 active:text-amber-300 transition-all duration-150 cursor-pointer shrink-0 rounded-full hover:bg-white/10 active:scale-90"
        title="ปิดการค้นหา"
        aria-label="ปิดการค้นหา"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>
    </form>
  );
}

function UserAccountMenu({
  customer,
  logout,
  showUsername = true,
  avatarSize = 'w-6 h-6',
  iconSize = 'w-3.5 h-3.5',
}: {
  customer: any;
  logout: () => void;
  showUsername?: boolean;
  avatarSize?: string;
  iconSize?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsClosing(false);
    setIsOpen(true);
  };

  const closeMenu = () => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 170);
  };

  const toggleMenu = () => {
    if (isOpen && !isClosing) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target === e.currentTarget && isClosing) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsOpen(false);
      setIsClosing(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    if (isOpen && !isClosing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);


  if (!customer) {
    return null;
  }

  const displayName = customer.customerName || customer.cusUser || customer.customerId;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        className="flex items-center gap-2 py-0.5 px-1.5 rounded-full text-white hover:text-white/90 hover:bg-white/10 transition-all duration-150 active:scale-95 cursor-pointer select-none"
        title={`บัญชีผู้ใช้: ${displayName}`}
        aria-label="บัญชีผู้ใช้"
        aria-expanded={isOpen && !isClosing}
        aria-haspopup="true"
      >
        <div
          className={`${avatarSize} rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/30 shadow-2xs shrink-0`}
        >
          <User className={`${iconSize} text-slate-400 stroke-[1.8]`} />
        </div>
        {showUsername && (
          <span className="text-xs font-normal text-white max-w-[180px] truncate">
            {displayName}
          </span>
        )}
      </button>

      {/* Dropdown Menu matching user reference with smooth spring popover animation */}
      {isOpen && (
        <div
          onAnimationEnd={handleAnimationEnd}
          className={`absolute right-0 mt-2.5 w-52 sm:w-56 max-w-[calc(100vw-24px)] z-50 text-slate-800 ${isClosing ? 'animate-popover-out' : 'animate-popover'
            }`}
        >
          {/* Arrow Pointer */}
          <div className="absolute -top-[7px] right-3 sm:right-4 w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-slate-200 z-20 shadow-[-2px_-2px_3px_rgba(0,0,0,0.04)]" />

          {/* Menu Card */}
          <div className="relative bg-white rounded-sm shadow-xl border border-slate-200 py-1.5 overflow-hidden z-10">

            {/* Item 1: บัญชีของฉัน */}
            <Link
              href="/customer/account"
              onClick={() => closeMenu()}
              className="flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.99] transition-all"
            >
              <User className="w-4 h-4 text-slate-700 shrink-0" />
              <span>บัญชีของฉัน</span>
            </Link>

            {/* Item 2: คำสั่งซื้อของฉัน */}
            <Link
              href="/orders/history"
              onClick={() => closeMenu()}
              className="flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.99] transition-all"
            >
              <Package className="w-4 h-4 text-slate-700 shrink-0" />
              <span>คำสั่งซื้อของฉัน</span>
            </Link>

            {/* Divider */}
            <div className="my-1 border-t border-slate-100" />

            {/* Item 3: ออกจากระบบ */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:scale-[0.99] transition-all cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-red-600 shrink-0" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { customer, logout } = useAuth();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // ซ่อน Navbar ในหน้า Login, หน้านโยบายความเป็นส่วนตัว/คุกกี้ หรือหน้าเอกสารเดี่ยว (Standalone A4 Document)
  if (
    pathname === '/login' ||
    pathname === '/cookie-policy' ||
    pathname === '/privacy-policy' ||
    pathname?.includes('/purchase-order') ||
    pathname?.includes('/a4')
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#800020] border-b border-[#68001a] shadow-md print:hidden">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* 1. Top Utility Bar (Shopee Style: Desktop only) */}
        <div className="hidden sm:flex items-center justify-between py-1 text-xs text-white/90">
          <div className="flex items-center gap-2.5 text-[11.5px] text-white/80 font-normal">
            <span>Pre Order</span>
          </div>

          <div className="flex items-center gap-3">
            {/* User Account Menu in Top Utility Bar */}
            <UserAccountMenu
              customer={customer}
              logout={logout}
              showUsername={true}
              avatarSize="w-5.5 h-5.5"
              iconSize="w-3.5 h-3.5"
            />
          </div>
        </div>

        {/* 2. Main Navbar Row & Animated Mobile Search Overlay */}
        <div className="relative">
          {/* Main Navbar Row */}
          <div
            className={`items-center justify-between h-16 sm:h-20 flex transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isMobileSearchOpen
                ? 'sm:opacity-100 sm:translate-x-0 sm:pointer-events-auto opacity-0 -translate-x-3 pointer-events-none'
                : 'opacity-100 translate-x-0 pointer-events-auto'
            }`}
          >
            {/* Company Logo */}
            <Link
              href="/"
              onClick={() => {
                try {
                  sessionStorage.setItem('ubr_home_scroll_y', '0');
                } catch {}
              }}
              className="flex items-center group min-w-0 mr-2 sm:mr-0"
            >
              <CompanyLogo size="md" lightText={true} />
            </Link>

            {/* Search Bar - Center (Desktop & Tablet) */}
            <div className="hidden sm:flex flex-1 max-w-md lg:max-w-2xl mx-6 lg:mx-12">
              <Suspense fallback={<div className="w-full h-10" />}>
                <NavbarSearch />
              </Suspense>
            </div>

            {/* Right Actions: Mobile has [ 🔍 ] [ 👤 ] [ 🛒 ], Desktop has [ 🛒 ] */}
            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
              {/* Mobile Search Trigger Button (Only on mobile < sm) */}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="sm:hidden relative p-2 text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-90"
                title="ค้นหาสินค้า"
                aria-label="ค้นหาสินค้า"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Mobile User Dropdown Button (Only on mobile < sm) */}
              <div className="sm:hidden">
                <UserAccountMenu
                  customer={customer}
                  logout={logout}
                  showUsername={false}
                  avatarSize="w-7 h-7"
                  iconSize="w-4 h-4"
                />
              </div>

              {/* Cart Dropdown Popover matching reference */}
              <CartDropdown />
            </div>
          </div>

          {/* Mobile Search Overlay Bar with Smooth Slide/Morph Animation */}
          <div
            className={`sm:hidden absolute inset-0 h-16 flex items-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${
              isMobileSearchOpen
                ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-x-4 scale-[0.98] pointer-events-none'
            }`}
          >
            <Suspense fallback={null}>
              <MobileSearchOverlay
                isOpen={isMobileSearchOpen}
                onClose={() => setIsMobileSearchOpen(false)}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
