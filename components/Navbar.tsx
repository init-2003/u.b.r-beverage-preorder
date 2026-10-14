'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import CompanyLogo from './CompanyLogo';
import CartDropdown from './CartDropdown';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Search, X, Package, ChevronDown, ChevronRight, Menu, Layers, Sparkles } from 'lucide-react';
import { SubMenuItem } from '@/types/preorder';
import {
  getStoredCategory,
  getStoredSubMenuId,
  setStoredCategory,
  clearStoredCategory,
  CATEGORY_CHANGE_EVENT,
} from '@/lib/category-storage';

interface SearchCategoryDropdownProps {
  subMenus: SubMenuItem[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string, subMenuId?: number) => void;
  compactOnMobile?: boolean;
}

function SearchCategoryDropdown({
  subMenus,
  selectedCategory,
  onSelectCategory,
  compactOnMobile = false,
}: SearchCategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAll = !selectedCategory || selectedCategory === 'all' || selectedCategory === 'ทั้งหมด';
  const activeItem = !isAll ? subMenus.find((m) => m.SubMenu_NameTH === selectedCategory) : null;
  const activeLabel = isAll ? 'ทั้งหมด' : (activeItem ? activeItem.SubMenu_NameTH : selectedCategory);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Prevent background scrolling while category dropdown is open
  useEffect(() => {
    if (!isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      const isInside = dropdownRef.current && dropdownRef.current.contains(target);
      if (!isInside) {
        if (e.cancelable) e.preventDefault();
      } else {
        const scrollable = target?.closest('.overflow-y-auto') as HTMLElement | null;
        if (scrollable) {
          const { scrollTop, scrollHeight, clientHeight } = scrollable;
          if (
            (e.deltaY < 0 && scrollTop <= 0) ||
            (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1)
          ) {
            if (e.cancelable) e.preventDefault();
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const isInside = dropdownRef.current && dropdownRef.current.contains(target);
      if (!isInside) {
        if (e.cancelable) e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  return (
    <div className="relative h-full shrink-0 flex items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        suppressHydrationWarning
        className={`h-full flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 text-xs sm:text-[13.5px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50/90 rounded-l-full transition-colors cursor-pointer select-none ${
          isOpen ? 'bg-slate-50' : ''
        }`}
        title={`เลือกประเภท: ${activeLabel}`}
      >
        <span suppressHydrationWarning className={`truncate ${compactOnMobile ? 'max-w-[70px] sm:max-w-[120px]' : 'max-w-[80px] sm:max-w-[125px]'}`}>
          {activeLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Panel (Exact Style matching BaNANA reference image) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-56 sm:w-64 bg-white rounded-[14px] apple-squircle-card shadow-2xl border border-slate-200 z-50 overflow-hidden animate-dropdown-panel">
          {/* Top Item: ทั้งหมด */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-xs sm:text-[13.5px] transition-colors flex items-center justify-between cursor-pointer animate-dropdown-item ${
              isAll
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            style={{ animationDelay: '25ms' }}
          >
            <span>ทั้งหมด</span>
          </button>

          {/* Scrollable list of Type_SubMenu items with custom scrollbar (เมื่อมีสินค้าผูก SubMenu_ID_Ref) */}
          {subMenus.length > 0 && (
            <div className="max-h-[300px] sm:max-h-[360px] overflow-y-auto dropdown-scrollbar divide-y divide-slate-100/60 overscroll-contain">
              {subMenus.map((item, idx) => {
                const isSelected = selectedCategory === item.SubMenu_NameTH;
                return (
                  <button
                    key={item.SubMenu_ID}
                    type="button"
                    onClick={() => {
                      onSelectCategory(item.SubMenu_NameTH, item.SubMenu_ID);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs sm:text-[13px] transition-colors flex items-center justify-between cursor-pointer animate-dropdown-item ${
                      isSelected
                        ? 'bg-slate-100 font-bold text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    style={{ animationDelay: `${(idx + 1) * 35}ms` }}
                  >
                    <span className="truncate">{item.SubMenu_NameTH}</span>
                    {item.SubMenu_NameEN && (
                      <span className="text-[10.5px] text-slate-400 font-normal ml-2 shrink-0 hidden sm:inline">
                        {item.SubMenu_NameEN}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MobileCategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  subMenus: SubMenuItem[];
  onSelectCategory?: () => void;
}

function MobileCategorySidebarContent({
  isOpen,
  onClose,
  subMenus,
  onSelectCategory,
}: MobileCategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [persistedCat, setPersistedCat] = useState<string>('all');

  useEffect(() => {
    setPersistedCat(getStoredCategory());

    const handleCategoryChange = () => {
      setPersistedCat(getStoredCategory());
    };
    window.addEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
    window.addEventListener('storage', handleCategoryChange);
    return () => {
      window.removeEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
      window.removeEventListener('storage', handleCategoryChange);
    };
  }, []);

  const urlCategory = searchParams.get('category');
  useEffect(() => {
    if (urlCategory) {
      const subId = searchParams.get('subMenuId') ? Number(searchParams.get('subMenuId')) : undefined;
      setStoredCategory(urlCategory, subId);
      setPersistedCat(urlCategory);
    }
  }, [urlCategory, searchParams]);

  const selectedCategory = urlCategory || persistedCat || 'all';
  const isAll = !selectedCategory || selectedCategory === 'all' || selectedCategory === 'ทั้งหมด';

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-close when resized to desktop (>= 640px)
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        onClose();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  // Prevent background scrolling while mobile category sidebar drawer is open
  useEffect(() => {
    if (!isOpen) return;

    // 2. Track touch start for mobile gesture direction detection
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        startY = e.touches[0].clientY;
      }
    };

    // 3. Intercept touchmove to prevent background scrolling & scroll chaining
    const handleTouchMove = (e: TouchEvent) => {
      if (!e.cancelable) return;

      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.overflow-y-auto') as HTMLElement | null;

      // If touch is not inside the scrollable drawer list, block scroll completely
      if (!scrollable) {
        e.preventDefault();
        return;
      }

      // If drawer content is not scrollable (fits within viewport), block scroll completely
      if (scrollable.scrollHeight <= scrollable.clientHeight) {
        e.preventDefault();
        return;
      }

      // If user is scrolling inside drawer list, prevent scroll chaining when reaching boundaries
      if (e.touches && e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY; // > 0 = pulling up (scrolling down), < 0 = pulling down (scrolling up)
        const { scrollTop, scrollHeight, clientHeight } = scrollable;

        if (deltaY < 0 && scrollTop <= 0) {
          // Reached top, prevent rubber-banding the page
          e.preventDefault();
          return;
        }

        if (deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1) {
          // Reached bottom, prevent rubber-banding the page
          e.preventDefault();
          return;
        }
      }
    };

    // 4. Intercept wheel events for trackpads / mouse wheels
    const handleWheel = (e: WheelEvent) => {
      if (!e.cancelable) return;

      const target = e.target as HTMLElement | null;
      const scrollable = target?.closest('.overflow-y-auto') as HTMLElement | null;

      if (!scrollable) {
        e.preventDefault();
        return;
      }

      if (scrollable.scrollHeight <= scrollable.clientHeight) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      if (
        (e.deltaY < 0 && scrollTop <= 0) ||
        (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1)
      ) {
        e.preventDefault();
      }
    };

    // 5. Intercept keyboard navigation scroll keys (ArrowUp, ArrowDown, PageUp, PageDown, Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.includes(e.key)) {
        const target = e.target as HTMLElement | null;
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
        if (!isInput) {
          const scrollable = target?.closest('.overflow-y-auto');
          if (!scrollable) {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (cat: string, subMenuId?: number) => {
    setStoredCategory(cat, subMenuId);
    setPersistedCat(cat);
    const params = new URLSearchParams();
    const query = searchParams.get('search');
    if (query && query.trim()) {
      params.set('search', query.trim());
    }
    if (cat && cat !== 'all' && cat !== 'ทั้งหมด') {
      params.set('category', cat);
      if (subMenuId && subMenuId > 0) {
        params.set('subMenuId', String(subMenuId));
      }
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
    if (onSelectCategory) {
      onSelectCategory();
    } else {
      onClose();
    }
  };

  return (
    <div
      className={`sm:hidden fixed top-16 bottom-0 inset-x-0 z-40 transition-all duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-300'
      }`}
    >
      {/* Backdrop overlay below Navbar */}
      <div
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        className={`fixed top-16 bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out touch-none ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Drawer Panel below Navbar (Full-Width on Mobile) */}
      <div
        ref={drawerRef}
        className={`fixed top-16 bottom-0 left-0 w-full bg-white shadow-2xl z-40 flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overscroll-contain ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto dropdown-scrollbar divide-y divide-slate-100 overscroll-contain touch-pan-y">
          {/* Item 1: ทั้งหมด */}
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className={`w-full text-left px-5 py-4 text-sm sm:text-[14px] transition-colors flex items-center justify-between cursor-pointer animate-dropdown-item ${
              isAll
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
            style={{ animationDelay: '30ms' }}
          >
            <span className="truncate">ทั้งหมด</span>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${
              isAll ? 'text-slate-700' : 'text-slate-400'
            }`} />
          </button>

          {/* SubMenu Items (ถ้ามีสินค้าผูก SubMenu_ID_Ref) */}
          {subMenus.length > 0 &&
            subMenus.map((item, idx) => {
              const isSelected = selectedCategory === item.SubMenu_NameTH;
              return (
                <button
                  key={item.SubMenu_ID}
                  type="button"
                  onClick={() => handleSelect(item.SubMenu_NameTH, item.SubMenu_ID)}
                  className={`w-full text-left px-5 py-4 text-sm sm:text-[14px] transition-colors flex items-center justify-between cursor-pointer animate-dropdown-item ${
                    isSelected
                      ? 'bg-slate-100 font-bold text-slate-900'
                      : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={{ animationDelay: `${(idx + 1) * 35}ms` }}
                >
                  <span className="truncate">{item.SubMenu_NameTH}</span>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? 'text-slate-700' : 'text-slate-400'
                  }`} />
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function MobileCategorySidebar(props: MobileCategorySidebarProps) {
  return (
    <Suspense fallback={null}>
      <MobileCategorySidebarContent {...props} />
    </Suspense>
  );
}

function NavbarSearch({ subMenus: propSubMenus }: { subMenus?: SubMenuItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [subMenus, setSubMenus] = useState<SubMenuItem[]>(propSubMenus || []);
  const [persistedCat, setPersistedCat] = useState<string>('all');

  useEffect(() => {
    setPersistedCat(getStoredCategory());

    const handleCategoryChange = () => {
      setPersistedCat(getStoredCategory());
    };
    window.addEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
    window.addEventListener('storage', handleCategoryChange);
    return () => {
      window.removeEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
      window.removeEventListener('storage', handleCategoryChange);
    };
  }, []);

  const urlCategory = searchParams.get('category');
  useEffect(() => {
    if (urlCategory) {
      const subId = searchParams.get('subMenuId') ? Number(searchParams.get('subMenuId')) : undefined;
      setStoredCategory(urlCategory, subId);
      setPersistedCat(urlCategory);
    }
  }, [urlCategory, searchParams]);

  const selectedCategory = urlCategory || persistedCat || 'all';

  useEffect(() => {
    if (propSubMenus && propSubMenus.length > 0) {
      setSubMenus(propSubMenus);
    }
  }, [propSubMenus]);

  // Fetch Type_SubMenu items on mount if propSubMenus is empty
  useEffect(() => {
    if (!propSubMenus || propSubMenus.length === 0) {
      let isMounted = true;
      fetch('/api/submenus')
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.success && Array.isArray(data.subMenus)) {
            setSubMenus(data.subMenus);
          }
        })
        .catch((err) => console.error('Load submenus error:', err));
      return () => {
        isMounted = false;
      };
    }
  }, [propSubMenus]);

  // Sync state with URL search param
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchTerm(q);
  }, [searchParams]);

  const handleSelectCategory = (cat: string, subMenuId?: number) => {
    setStoredCategory(cat, subMenuId);
    setPersistedCat(cat);
    const params = new URLSearchParams();
    const currentSearch = searchParams.get('search') || searchTerm.trim();
    if (currentSearch) {
      params.set('search', currentSearch);
    }
    if (cat && cat !== 'all' && cat !== 'ทั้งหมด') {
      params.set('category', cat);
      if (subMenuId && subMenuId > 0) {
        params.set('subMenuId', String(subMenuId));
      }
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    const params = new URLSearchParams();
    if (query) {
      params.set('search', query);
    }
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'ทั้งหมด') {
      params.set('category', selectedCategory);
      const subId = getStoredSubMenuId();
      if (subId) {
        params.set('subMenuId', String(subId));
      }
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  const handleClear = () => {
    setSearchTerm('');
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'ทั้งหมด') {
      params.set('category', selectedCategory);
      const subId = getStoredSubMenuId();
      if (subId) {
        params.set('subMenuId', String(subId));
      }
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      suppressHydrationWarning
      className="w-full h-10 bg-white rounded-full p-[3px] shadow-sm flex items-center border border-white relative"
    >
      {/* Category Dropdown on the left (front of search input) */}
      <SearchCategoryDropdown
        subMenus={subMenus}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Vertical divider */}
      <div className="h-5 w-[1px] bg-slate-200 shrink-0 mx-0.5" />

      {/* Search Input Box */}
      <div className="relative flex-1 flex items-center h-full min-w-0">
        <input
          suppressHydrationWarning
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาสินค้าที่ต้องการที่นี่....."
          className="w-full h-full pl-3 sm:pl-3.5 pr-8 bg-transparent text-base sm:text-[14px] text-slate-800 placeholder:text-slate-400 outline-none border-none"
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

      {/* Search Submit Button */}
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
  isSidebarOpen = false,
  onToggleSidebar,
}: {
  isOpen: boolean;
  onClose: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar: () => void;
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
    const params = new URLSearchParams();
    if (query) {
      params.set('search', query);
    }
    const storedCat = getStoredCategory();
    if (storedCat && storedCat !== 'all' && storedCat !== 'ทั้งหมด') {
      params.set('category', storedCat);
      const subId = getStoredSubMenuId();
      if (subId) {
        params.set('subMenuId', String(subId));
      }
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.push(newUrl);
    onClose();
  };

  const handleClearOrClose = () => {
    if (searchTerm) {
      setSearchTerm('');
      const params = new URLSearchParams(searchParams.toString());
      params.delete('search');
      const newUrl = params.toString() ? `/?${params.toString()}` : '/';
      router.push(newUrl);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} suppressHydrationWarning className="w-full flex items-center gap-2">
      <div className="flex-1 h-10 bg-white rounded-full p-[3px] shadow-sm flex items-center border border-white relative">
        {/* Mobile 3-bar Hamburger Button in search pill (morphs to X when sidebar open) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-full flex items-center justify-center px-3 sm:px-3.5 text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 rounded-l-full transition-colors cursor-pointer select-none active:scale-95 shrink-0"
          title={isSidebarOpen ? 'ปิดหมวดหมู่สินค้า' : 'เปิดหมวดหมู่สินค้า'}
          aria-label={isSidebarOpen ? 'ปิดหมวดหมู่สินค้า' : 'เปิดหมวดหมู่สินค้า'}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Menu
              className={`w-5 h-5 stroke-[2.2] absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSidebarOpen
                  ? 'opacity-0 rotate-90 scale-75 pointer-events-none'
                  : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X
              className={`w-5 h-5 stroke-[2.2] absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSidebarOpen
                  ? 'opacity-100 rotate-0 scale-100'
                  : 'opacity-0 -rotate-90 scale-75 pointer-events-none'
              }`}
            />
          </div>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 shrink-0 mx-0.5" />

        <div className="relative flex-1 flex items-center h-full min-w-0">
          <input
            suppressHydrationWarning
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาสินค้าที่ต้องการที่นี่....."
            className="w-full h-full pl-2 sm:pl-3 pr-7 bg-transparent text-base text-slate-800 placeholder:text-slate-400 outline-none border-none"
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
          className={`absolute right-0 mt-2.5 w-60 sm:w-56 max-w-[calc(100vw-24px)] z-50 text-slate-800 ${isClosing ? 'animate-popover-out' : 'animate-popover'
            }`}
        >
          {/* Arrow Pointer */}
          <div className="absolute -top-[7px] right-3.5 sm:right-4 w-3.5 h-3.5 bg-white rotate-45 border-t border-l border-slate-200 z-20 shadow-[-2px_-2px_3px_rgba(0,0,0,0.04)]" />

          {/* Menu Card */}
          <div className="relative bg-white rounded-[14px] apple-squircle-card shadow-xl border border-slate-200 p-2 sm:p-1.5 overflow-hidden z-10">

            {/* Item 1: บัญชีของฉัน */}
            <Link
              href="/customer/account"
              onClick={() => closeMenu()}
              className="flex items-center gap-3.5 sm:gap-3 px-3.5 py-3 sm:px-3 sm:py-2 rounded-[10px] sm:rounded-[9px] apple-squircle-sm text-sm sm:text-sm font-medium text-slate-800 hover:bg-slate-100/80 active:bg-slate-200 active:scale-[0.99] transition-all"
            >
              <User className="w-5 h-5 sm:w-4 sm:h-4 text-slate-700 shrink-0" />
              <span>บัญชีของฉัน</span>
            </Link>

            {/* Item 2: คำสั่งซื้อของฉัน */}
            <Link
              href="/orders/history"
              onClick={() => closeMenu()}
              className="flex items-center gap-3.5 sm:gap-3 px-3.5 py-3 sm:px-3 sm:py-2 rounded-[10px] sm:rounded-[9px] apple-squircle-sm text-sm sm:text-sm font-medium text-slate-800 hover:bg-slate-100/80 active:bg-slate-200 active:scale-[0.99] transition-all"
            >
              <Package className="w-5 h-5 sm:w-4 sm:h-4 text-slate-700 shrink-0" />
              <span>คำสั่งซื้อของฉัน</span>
            </Link>

            {/* Divider */}
            <div className="my-1.5 sm:my-1 border-t border-slate-100" />

            {/* Item 3: ออกจากระบบ */}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
              }}
              className="w-full flex items-center gap-3.5 sm:gap-3 px-3.5 py-3 sm:px-3 sm:py-2 rounded-[10px] sm:rounded-[9px] apple-squircle-sm text-sm sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 active:scale-[0.99] transition-all cursor-pointer text-left"
            >
              <LogOut className="w-5 h-5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [subMenus, setSubMenus] = useState<SubMenuItem[]>([]);

  // Load submenus for category filtering
  useEffect(() => {
    let isMounted = true;
    fetch('/api/submenus')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.subMenus)) {
          setSubMenus(data.subMenus);
        }
      })
      .catch((err) => console.error('Load submenus error:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-close mobile drawer and mobile search when resizing to desktop (>= 640px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMobileSidebarOpen(false);
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <header className={`navbar-top-curtain z-50 w-full bg-[#800020] border-b border-[#68001a] print:hidden ${
      isMobileSidebarOpen ? 'fixed top-0 inset-x-0' : 'sticky top-0'
    }`}>
      {/* Top Curtain Shield: ม่านบังขอบบน ยื่นทะลุขอบจอขึ้นไป 200vh เพื่อบล็อกเนื้อหาข้างใต้ไม่ให้แลบขึ้นมาเวลาดึงจอหรือมี frame lag */}
      <div
        className="absolute bottom-full left-0 right-0 w-full h-[200vh] bg-[#800020] pointer-events-none select-none z-50"
        aria-hidden="true"
      />
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
            className={`relative items-center justify-between h-16 sm:h-20 flex transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isMobileSearchOpen
                ? 'sm:opacity-100 sm:translate-x-0 sm:pointer-events-auto opacity-0 -translate-x-3 pointer-events-none'
                : 'opacity-100 translate-x-0 pointer-events-auto'
            }`}
          >
            {/* 1. Left: Mobile Hamburger Menu Button (< sm) + Desktop Logo */}
            <div className="flex items-center min-w-0">
              {/* Mobile 3-bar Hamburger Menu Button (morphs to X when open) */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="sm:hidden w-10 h-10 -ml-1 text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-90 shrink-0"
                title={isMobileSidebarOpen ? 'ปิดหมวดหมู่สินค้า' : 'เปิดหมวดหมู่สินค้า'}
                aria-label={isMobileSidebarOpen ? 'ปิดหมวดหมู่สินค้า' : 'เปิดหมวดหมู่สินค้า'}
              >
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Menu
                    className={`w-6 h-6 stroke-[2.3] absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isMobileSidebarOpen
                        ? 'opacity-0 rotate-90 scale-75 pointer-events-none'
                        : 'opacity-100 rotate-0 scale-100'
                    }`}
                  />
                  <X
                    className={`w-6 h-6 stroke-[2.3] absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isMobileSidebarOpen
                        ? 'opacity-100 rotate-0 scale-100'
                        : 'opacity-0 -rotate-90 scale-75 pointer-events-none'
                    }`}
                  />
                </div>
              </button>

              {/* Desktop Logo (>= sm) */}
              <Link
                href="/"
                onClick={() => {
                  try {
                    sessionStorage.setItem('ubr_home_scroll_y', '0');
                  } catch {}
                }}
                className="hidden sm:flex items-center group min-w-0 active:scale-95 transition-transform"
                title="หน้าหลัก - หจก.อุบลรุ่งเรืองเบฟเวอเรจ"
              >
                <CompanyLogo size="md" lightText={true} />
              </Link>
            </div>

            {/* Mobile Centered Logo Emblem (< sm) */}
            <div className="sm:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
              <Link
                href="/"
                onClick={() => {
                  try {
                    sessionStorage.setItem('ubr_home_scroll_y', '0');
                  } catch {}
                }}
                className="flex items-center justify-center active:scale-95 transition-transform"
                title="หน้าหลัก - หจก.อุบลรุ่งเรืองเบฟเวอเรจ"
              >
                <img
                  src="/images/ubr_beverage_logo_transparent.png"
                  alt="โลโก้ อุบลรุ่งเรือง เบฟเวอเรจ - U.B.R. Beverage"
                  className="h-10 w-auto object-contain block drop-shadow-xs"
                  loading="eager"
                />
              </Link>
            </div>

            {/* Search Bar - Center (Desktop & Tablet) */}
            <div className="hidden sm:flex flex-1 max-w-md lg:max-w-2xl mx-6 lg:mx-12">
              <Suspense fallback={<div className="w-full h-10" />}>
                <NavbarSearch subMenus={subMenus} />
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
                  avatarSize="w-8 h-8"
                  iconSize="w-4.5 h-4.5"
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
                isSidebarOpen={isMobileSidebarOpen}
                onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Mobile Category Sidebar Drawer */}
      <MobileCategorySidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        subMenus={subMenus}
        onSelectCategory={() => {
          setIsMobileSidebarOpen(false);
          setIsMobileSearchOpen(false);
        }}
      />
    </header>
  );
}
