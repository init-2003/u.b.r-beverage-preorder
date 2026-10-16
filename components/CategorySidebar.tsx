'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { MenuTreeItem } from '@/types/preorder';
import { CategorySidebarSkeleton } from './HomeSkeleton';

interface CategorySidebarProps {
  menuTree: MenuTreeItem[];
  totalProducts: number;
  loading?: boolean;
  selectedTypeId?: string;
  selectedSubMenuId?: number;
  selectedCategory?: string;
  onSelectAll: () => void;
  onSelectType: (typeId: string, typeName: string) => void;
  onSelectSubMenu: (subMenuId: number, subMenuNameTH: string, typeId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SIDEBAR_EXPANDED_STORAGE_KEY = 'ubr_sidebar_expanded_types';

const SIDEBAR_SCROLL_STORAGE_KEY = 'ubr_sidebar_scroll_top';

function saveExpandedToStorage(typesSet: Set<string>) {
  try {
    sessionStorage.setItem(
      SIDEBAR_EXPANDED_STORAGE_KEY,
      JSON.stringify(Array.from(typesSet))
    );
  } catch {}
}

function saveScrollToStorage(top: number) {
  try {
    sessionStorage.setItem(SIDEBAR_SCROLL_STORAGE_KEY, String(Math.round(top)));
  } catch {}
}

const CategorySidebar = React.memo(function CategorySidebar({
  menuTree,
  totalProducts,
  loading = false,
  selectedTypeId,
  selectedSubMenuId,
  selectedCategory,
  onSelectAll,
  onSelectType,
  onSelectSubMenu,
  isCollapsed = false,
  onToggleCollapse,
}: CategorySidebarProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);
  const hasRestoredScrollRef = useRef(false);
  const asideRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const handleCollapseClick = useCallback(() => {
    if (scrollContainerRef.current) {
      saveScrollToStorage(scrollContainerRef.current.scrollTop);
    }
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  }, [onToggleCollapse]);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 2);
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 2);
  }, []);

  const handleScroll = useCallback(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    const top = el.scrollTop;
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    scrollDebounceTimerRef.current = setTimeout(() => {
      saveScrollToStorage(top);
    }, 100);
  }, [checkScroll]);

  // Persist scroll position on page unload (F5) or unmount (navigate to other pages)
  useEffect(() => {
    const saveCurrentScroll = () => {
      if (scrollContainerRef.current) {
        saveScrollToStorage(scrollContainerRef.current.scrollTop);
      }
    };

    window.addEventListener('beforeunload', saveCurrentScroll);
    return () => {
      saveCurrentScroll();
      window.removeEventListener('beforeunload', saveCurrentScroll);
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
      }
    };
  }, []);

  // Restore scroll position across page reloads (F5) or when returning from other pages / expanding sidebar
  useEffect(() => {
    if (isCollapsed) {
      hasRestoredScrollRef.current = false;
      return;
    }
    if (menuTree.length === 0) return;

    if (!hasRestoredScrollRef.current) {
      hasRestoredScrollRef.current = true;
      try {
        const savedScroll = sessionStorage.getItem(SIDEBAR_SCROLL_STORAGE_KEY);
        if (savedScroll !== null) {
          const top = parseFloat(savedScroll);
          if (!isNaN(top) && top > 0) {
            const applyScroll = () => {
              const el = scrollContainerRef.current;
              if (el) {
                el.scrollTop = top;
                checkScroll();
              }
            };

            applyScroll();
            const t1 = setTimeout(applyScroll, 60);
            const t2 = setTimeout(applyScroll, 200);
            const t3 = setTimeout(applyScroll, 450);

            return () => {
              clearTimeout(t1);
              clearTimeout(t2);
              clearTimeout(t3);
            };
          }
        }
      } catch {}
    }
  }, [menuTree, checkScroll, isCollapsed]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    const t = setTimeout(checkScroll, 320);

    const ro = new ResizeObserver(() => {
      checkScroll();
    });
    ro.observe(el);

    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [checkScroll, menuTree, expandedTypes]);

  // 1. Initial State Logic:
  // - If user has custom toggle state in sessionStorage (e.g. after refresh/F5), restore it!
  // - If entering anew (new tab / session), open ALL submenus by default!
  useEffect(() => {
    if (menuTree.length === 0) return;

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      try {
        const saved = sessionStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setExpandedTypes(new Set(parsed));
            return;
          }
        }
      } catch {}

      // Default on fresh entry: Open all submenus by default!
      const allTypesWithSubMenus = menuTree
        .filter((t) => t.subMenus && t.subMenus.length > 0)
        .map((t) => t.typeId);
      const allSet = new Set(allTypesWithSubMenus);
      setExpandedTypes(allSet);
      saveExpandedToStorage(allSet);
    }
  }, [menuTree]);

  // 2. Ensure parent category of active subMenu is always expanded
  useEffect(() => {
    if (selectedSubMenuId && menuTree.length > 0) {
      const parent = menuTree.find((t) =>
        t.subMenus.some((s) => s.subMenuId === selectedSubMenuId)
      );
      if (parent) {
        setExpandedTypes((prev) => {
          if (!prev.has(parent.typeId)) {
            const next = new Set(prev).add(parent.typeId);
            saveExpandedToStorage(next);
            return next;
          }
          return prev;
        });
      }
    }
  }, [selectedSubMenuId, menuTree]);

  const handleSelectAllClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onSelectAll();
  };

  const isAllActive =
    (!selectedTypeId || selectedTypeId === 'all') &&
    !selectedSubMenuId &&
    (!selectedCategory || selectedCategory === 'all' || selectedCategory === 'ทั้งหมด');

  return (
    <aside
      ref={asideRef}
      className={`hidden sm:block shrink-0 sticky top-[127px] self-start z-30 transition-[width,margin,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCollapsed
          ? 'w-0 -mr-4 lg:-mr-6 overflow-hidden opacity-0 pointer-events-none'
          : 'w-60 xl:w-64 opacity-100'
      }`}
      aria-label="เมนูหมวดหมู่สินค้า"
      aria-hidden={isCollapsed}
    >
      <div
        className="w-60 xl:w-64 bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden flex flex-col p-4 sm:p-5 max-h-[calc(100vh-147px)] transition-[max-height] duration-200"
      >
          {/* Top Pinned Option: "ทั้งหมด" + Collapse Button '<' */}
          <div className="shrink-0 pb-2 mb-1 border-b border-slate-100 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={handleSelectAllClick}
              className={`flex-1 flex items-center text-left py-1 text-sm font-bold transition-colors cursor-pointer select-none ${
                isAllActive
                  ? 'text-[#0073bb]'
                  : 'text-slate-900 hover:text-[#0073bb]'
              }`}
            >
              <span>ทั้งหมด</span>
            </button>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={handleCollapseClick}
                className="w-7 h-7 -mr-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#0073bb] hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                title="ย่อเมนูหมวดหมู่"
                aria-label="ย่อเมนูหมวดหมู่"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>

        {/* Scrollable Area with Soft Blur & Fade Masks at Top & Bottom */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          {/* Top Blur Fade Overlay */}
          <div
            className={`sidebar-scroll-fade-top ${
              canScrollUp ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto sidebar-scrollbar overscroll-contain touch-pan-y pr-1 space-y-3 pt-1 pb-1"
          >

          {/* Loading Skeleton */}
          {loading && menuTree.length === 0 && (
            <CategorySidebarSkeleton />
          )}

          {/* Tree Navigation: Types & SubMenus */}
          {menuTree.map((typeItem) => {
            const hasSubMenus = typeItem.subMenus && typeItem.subMenus.length > 0;
            const isExpanded = expandedTypes.has(typeItem.typeId);
            const isChildSubActive = selectedSubMenuId
              ? typeItem.subMenus.some((s) => s.subMenuId === selectedSubMenuId)
              : false;
            const isTypeActive =
              selectedTypeId === typeItem.typeId || isChildSubActive;

            return (
              <div key={typeItem.typeId} className="space-y-1">
                {/* Type Header Row */}
                <div
                  onClick={() => {
                    if (hasSubMenus) {
                      setExpandedTypes((prev) => {
                        const next = new Set(prev);
                        if (!next.has(typeItem.typeId)) {
                          next.add(typeItem.typeId);
                          saveExpandedToStorage(next);
                          return next;
                        }
                        return prev;
                      });
                    }
                    if (typeof window !== 'undefined') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    onSelectType(typeItem.typeId, typeItem.typeName);
                  }}
                  className="flex items-center text-left py-1 cursor-pointer select-none group transition-colors"
                >
                  {/* Left Triangle Icon: Button click toggles collapse/expand independently with smooth rotation */}
                  {hasSubMenus ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTypes((prev) => {
                          const next = new Set(prev);
                          if (next.has(typeItem.typeId)) {
                            next.delete(typeItem.typeId);
                          } else {
                            next.add(typeItem.typeId);
                          }
                          saveExpandedToStorage(next);
                          return next;
                        });
                      }}
                      className="w-4 h-4 mr-1 flex items-center justify-center text-slate-900 group-hover:text-[#0073bb] shrink-0 transition-colors cursor-pointer rounded-xs hover:bg-slate-100/80 active:scale-95"
                      title={isExpanded ? 'พับเมนู' : 'กางเมนู'}
                      aria-label={isExpanded ? 'พับเมนู' : 'กางเมนู'}
                    >
                      <svg
                        className={`w-2.5 h-2.5 origin-center transition-transform duration-260 ease-[cubic-bezier(0.2,0.9,0.2,1)] ${
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        }`}
                        viewBox="0 0 10 10"
                        fill="currentColor"
                      >
                        <polygon points="1,2 9,2 5,8" />
                      </svg>
                    </button>
                  ) : (
                    <span className="w-4 h-4 mr-1 shrink-0" />
                  )}

                  {/* Type Name */}
                  <span
                    className={`text-sm font-bold tracking-tight transition-colors ${
                      isTypeActive && !selectedSubMenuId
                        ? 'text-[#0073bb]'
                        : 'text-slate-900 group-hover:text-[#0073bb]'
                    }`}
                  >
                    {typeItem.typeName}
                  </span>
                </div>

                {/* SubMenu List: Indented under Type with Smooth Accordion Animation */}
                {hasSubMenus && (
                  <div
                    className={`sidebar-tree-accordion ${
                      isExpanded ? 'open' : 'closed'
                    }`}
                  >
                    <div className="overflow-hidden min-h-0 pl-5 space-y-1">
                      {typeItem.subMenus.map((subItem) => {
                        const isSubActive = selectedSubMenuId === subItem.subMenuId;

                        return (
                          <button
                            key={subItem.subMenuId}
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                              onSelectSubMenu(
                                subItem.subMenuId,
                                subItem.subMenuNameTH,
                                typeItem.typeId
                              );
                            }}
                            className={`w-full text-left py-1 text-[13.5px] leading-snug cursor-pointer select-none block transition-colors ${
                              isSubActive
                                ? 'text-[#0073bb] font-medium'
                                : 'text-slate-700 hover:text-[#0073bb] hover:underline'
                            }`}
                          >
                            <span className="truncate block">
                              {subItem.subMenuNameTH}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Bottom Blur Fade Overlay */}
          <div
            className={`sidebar-scroll-fade-bottom ${
              canScrollDown ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>
    </aside>
  );
});

export default CategorySidebar;
