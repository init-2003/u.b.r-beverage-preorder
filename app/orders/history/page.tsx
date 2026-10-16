'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AccountLayout from '@/components/AccountLayout';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { EmptyOrdersIllustration } from '@/components/EmptyOrdersIllustration';
import PaidStamp from '@/components/orders/PaidStamp';
import { WineLoading } from '@/components/WineLoading';
import { ProductImage } from '@/components/ui/ProductImage';


interface OrderItem {
  Fn_Doc_No: string;
  ID_NO: number;
  Trade_Id: string;
  Trade_Name: string;
  Qty: number;
  Unit_Name: string;
  Type_Name?: string;
  Sale_Price: number;
  Sale_Price1?: number;
  Line_Total: number;
  fn_deposit_D?: number;
  Trade_Part_Image?: string;
}

interface OrderSummary {
  Fn_Doc_No: string;
  Fn_Doc_Date: string;
  Doc_Sts: string;
  Doc_Sts_Name: string;
  Customer_Id: string;
  ShipToName?: string;
  Customer_Name?: string;
  Customer_Tel?: string;
  Customer_Address?: string;
  Fn_Total: number;
  fn_deposit_H?: number;
  money_sts: string;
  money_sts_name: string;
  Fn_Doc_No_local?: string;
  FILE_NAME_PIC?: string;
  confirm_at?: string;
  ItemCount: number;
  Sample_Trade_Name?: string;
  Sample_Type_Name?: string;
  items?: OrderItem[];
}



// ฟังก์ชันแปลงวันที่และเวลาเป็นรูปแบบ DD/MM/YYYY HH:mm:ss
function formatOrderDateTime(dateVal?: string): string {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// ฟังก์ชันจัดรูปแบบยอดเงิน ฿1,191.20
function formatCurrency(amount: number): string {
  const num = Number(amount) || 0;
  return `฿${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function OrdersContent({
  isPaymentTab,
  tabParam,
}: {
  isPaymentTab: boolean;
  tabParam: string | null;
}) {
  const { customer, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<OrderSummary[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('ubr_cached_orders');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('ubr_cached_orders');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch { }
    }
    return true;
  });
  const [filterSts, setFilterSts] = useState<string>(isPaymentTab ? 'to_pay' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Animated sliding tab indicator
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; isReady: boolean }>({
    left: 0,
    width: 0,
    isReady: false,
  });
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);

  // ซิงค์แท็บเริ่มต้นตาม Query Param ?tab=... (หากไม่มี query param จะตั้งค่าเป็น "ทั้งหมด" เสมอ)
  useEffect(() => {
    const validTabs = ['all', 'to_pay', 'processing', 'receipt_issued', 'cancelled'];
    if (tabParam) {
      if (tabParam === 'payment') {
        setFilterSts('to_pay');
        try {
          sessionStorage.setItem('ubr_orders_active_tab', 'to_pay');
        } catch { }
      } else if (validTabs.includes(tabParam)) {
        setFilterSts(tabParam);
        try {
          sessionStorage.setItem('ubr_orders_active_tab', tabParam);
        } catch { }
      }
    } else {
      // หากไม่มี query param ให้เลือกแท็บ "ทั้งหมด" (all) เสมอ
      setFilterSts('all');
      try {
        sessionStorage.setItem('ubr_orders_active_tab', 'all');
      } catch { }
    }
  }, [tabParam]);

  // เมื่อเปิดหน้าครั้งแรกสุดและยังไม่มีแคช ให้รีเซ็ต scroll ไปบนสุด เพื่อให้ Loading อยู่กึ่งกลางสายตาพอดี
  useEffect(() => {
    if (loading && orders.length === 0) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [loading, orders.length]);

  // คำนวณตำแหน่งและสไลด์แท็บที่เลือก (Sliding Active Capsule Indicator)
  useEffect(() => {
    const updateIndicator = () => {
      const tabEl = tabRefs.current[filterSts];
      if (tabEl && tabsContainerRef.current) {
        setIndicatorStyle({
          left: tabEl.offsetLeft,
          width: tabEl.offsetWidth,
          isReady: true,
        });

        // เลื่อนแท็บที่เลือกให้อยู่ในมุมมองอัตโนมัติเมื่อเปิดครั้งแรก
        const container = tabsContainerRef.current;
        if (filterSts === 'all') {
          container.scrollTo({ left: 0, behavior: 'instant' });
        } else {
          const scrollLeft = tabEl.offsetLeft - (container.clientWidth / 2) + (tabEl.offsetWidth / 2);
          container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'instant' });
        }
      }
    };

    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [filterSts, isPaymentTab]);

  const handleTabChange = (tabKey: string) => {
    setFilterSts(tabKey);
    setCurrentPage(1);
    try {
      sessionStorage.setItem('ubr_orders_active_tab', tabKey);
      const newUrl = tabKey === 'all' ? '/orders/history' : `/orders/history?tab=${tabKey}`;
      window.history.replaceState(null, '', newUrl);
    } catch { }

    const tabEl = tabRefs.current[tabKey];
    if (tabEl && tabsContainerRef.current) {
      // อัปเดตตำแหน่งเพื่อเริ่มแอนิเมชันเลื่อนสไลด์ทันที
      setIndicatorStyle({
        left: tabEl.offsetLeft,
        width: tabEl.offsetWidth,
        isReady: true,
      });

      // เลื่อนแท็บให้อยู่ในมุมมองอัตโนมัติเมื่ออยู่บนจอมือถือ
      const container = tabsContainerRef.current;
      if (tabKey === 'all') {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const scrollLeft = tabEl.offsetLeft - (container.clientWidth / 2) + (tabEl.offsetWidth / 2);
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    async function fetchOrders() {
      if (!customer) return;
      if (orders.length === 0) {
        setLoading(true);
      }
      try {
        const res = await fetch('/api/orders?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          try {
            sessionStorage.setItem('ubr_cached_orders', JSON.stringify(data.orders));
          } catch { }
        }
      } catch (e) {
        console.error('Failed to load orders', e);
      } finally {
        setLoading(false);
      }
    }

    if (customer) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [customer, authLoading]);

  // Shopee-Style Tabs ตามเงื่อนไข Doc_Sts
  const statusTabs = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'to_pay', label: 'รอชำระ' },
    { key: 'processing', label: 'กำลังดำเนินการ' },
    { key: 'receipt_issued', label: 'ออกใบเสร็จแล้ว' },
    { key: 'cancelled', label: 'ยกเลิก' },
  ];

  // กรองตามแท็บสถานะและข้อความค้นหา (Search)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const rawCode = (o.Doc_Sts || '').trim();
      const isCodOrder = (o.money_sts || '').trim() === 'M';
      const code = (isCodOrder && rawCode === '1') ? '0' : rawCode;

      // Payment tab: แสดงเฉพาะรอชำระ (1) และกำลังดำเนินการ (0)
      if (isPaymentTab) {
        if (code !== '1' && code !== '0') return false;
      }

      // 1. กรองตามแท็บสถานะตามรหัส Doc_Sts โดยตรง
      if (filterSts === 'to_pay') {
        // แท็บ "รอชำระ": สำหรับการโอนเงินที่ยังไม่ชำระเท่านั้น (COD จะไม่มาโผล่ในรอชำระ)
        if (code !== '1' || isCodOrder) return false;
      } else if (filterSts === 'processing') {
        // แท็บ "กำลังดำเนินการ": แสดงออเดอร์สถานะ '0' รวมถึง COD ทั้งหมด
        if (code !== '0') return false;
      } else if (filterSts === 'receipt_issued') {
        if (code !== '3') return false;
      } else if (filterSts === 'cancelled') {
        if (code !== '4') return false;
      }

      // 2. กรองตามคำค้นหา (ค้นหาตามหมายเลขคำสั่งซื้อ หรือชื่อสินค้า)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchDocNo = (o.Fn_Doc_No || '').toLowerCase().includes(q);
        const matchSample = (o.Sample_Trade_Name || '').toLowerCase().includes(q);
        const matchItems = o.items && o.items.some((it) => (it.Trade_Name || '').toLowerCase().includes(q));
        if (!matchDocNo && !matchSample && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, filterSts, searchQuery]);

  // คำนวณการแบ่งหน้า (Pagination)
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // รีเซ็ตหน้าเป็น 1 หากหน้าปัจจุบันเกิน totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const displayedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  if (authLoading || (loading && orders.length === 0)) {
    return (
      <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
        <WineLoading size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-account-slide-up">



        {/* 1. Status Tabs Bar (Capsule Style with Sliding Indicator) */}
        {!isPaymentTab && (
          <div className="bg-white p-1 rounded-full border border-slate-200 shadow-2xs">
            <div
              ref={tabsContainerRef}
              className="relative flex items-center overflow-x-auto no-scrollbar scroll-smooth overscroll-x-contain touch-pan-x gap-1 px-1 rounded-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Animated Sliding Active Capsule Indicator */}
              <div
                className={`absolute top-0 bottom-0 rounded-full bg-[#800020] shadow-xs pointer-events-none z-0 transition-all duration-300 ${
                  indicatorStyle.isReady ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  left: 0,
                  width: `${indicatorStyle.width}px`,
                  transform: `translateX(${indicatorStyle.left}px)`,
                  transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
                }}
              />

              {statusTabs.map((tab) => {
                const isActive = filterSts === tab.key;
                return (
                  <button
                    key={tab.key}
                    ref={(el) => { tabRefs.current[tab.key] = el; }}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`relative z-10 shrink-0 sm:flex-1 whitespace-nowrap py-2 sm:py-2.5 px-4 sm:px-3 text-center text-[13px] sm:text-sm rounded-full transition-colors duration-200 cursor-pointer select-none active:scale-[0.97] ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100/50'
                    }`}
                  >
                    <span className="inline-block transition-transform duration-150 whitespace-nowrap">
                      {tab.label}
                    </span>
                    {/* Fallback capsule before JavaScript measurements */}
                    {!indicatorStyle.isReady && isActive && (
                      <div className="absolute inset-0 rounded-full bg-[#800020] -z-10 shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Shopee Search Box Bar */}
        <div className="bg-[#eaeaea] sm:bg-[#f0f2f5] rounded-full px-5 py-2.5 flex items-center gap-3 border border-slate-200/60 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="คุณสามารถค้นหาโดยใช้หมายเลขคำสั่งซื้อ หรือชื่อสินค้า"
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none border-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer transition-colors"
              title="ล้างคำค้นหา"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 3. Orders Content Area */}
        {loading ? (
          <div className="w-full min-h-[360px] sm:min-h-[420px] flex flex-col items-center justify-center">
            <WineLoading size="md" />
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-16 sm:py-20 px-4 text-center flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center">
              <EmptyOrdersIllustration className="w-36 h-36 sm:w-40 sm:h-40" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                {searchQuery ? 'ไม่พบรายการสั่งซื้อ' : 'ยังไม่มีการสั่งซื้อ'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {searchQuery
                  ? `ไม่พบคำสั่งซื้อที่ตรงกับ "${searchQuery}"`
                  : 'คุณยังไม่มีประวัติการสั่งซื้อในหมวดหมู่นี้'}
              </p>
            </div>
          </div>
        ) : (
          <div key={`${filterSts}-${currentPage}`} className="space-y-3 animate-tab-fade">
            {displayedOrders.map((order) => {
              const isCodOrder = (order.money_sts || '').trim() === 'M';
              const rawDocSts = (order.Doc_Sts || '').trim();
              const docStsCode = (isCodOrder && rawDocSts === '1') ? '0' : rawDocSts;
              const payableAmount = order.fn_deposit_H && Number(order.fn_deposit_H) > 0
                ? Number(order.fn_deposit_H)
                : Number(order.Fn_Total) || 0;

              {/* ===== Payment Tab: Compact Payment-Focused Card ===== */ }
              if (isPaymentTab) {
                const isPending = docStsCode === '1' && !isCodOrder;
                return (
                  <div
                    key={order.Fn_Doc_No}
                    className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    {/* Compact Header */}
                    <div className="p-3.5 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 bg-white border-b border-slate-200">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium text-slate-500">
                            หมายเลขคำสั่งซื้อ:
                          </span>
                          <Link
                            href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#800020] tracking-tight font-mono transition-colors"
                          >
                            {order.Fn_Doc_No}
                          </Link>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 sm:text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>วันที่และเวลาที่สั่งซื้อ: {formatOrderDateTime(order.Fn_Doc_Date)}</span>
                        </div>
                      </div>
                      {/* Payment Status Stamp */}
                      {isPending ? (
                        <PaidStamp
                          shape="badge"
                          label="รอชำระ"
                          subLabel="PENDING"
                          color="red"
                        />
                      ) : isCodOrder ? (
                        <PaidStamp
                          shape="badge"
                          label="ชำระเงินปลายทาง"
                          subLabel="C.O.D"
                          color="blue"
                        />
                      ) : (
                        <PaidStamp
                          shape="badge"
                          label="ชำระแล้ว"
                          subLabel="PAID"
                          color="green"
                        />
                      )}
                    </div>

                    {/* Compact Body: Summary + Amount */}
                    <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-700 line-clamp-1">
                          {order.Sample_Trade_Name || `คำสั่งซื้อ #${order.Fn_Doc_No}`}
                          {order.ItemCount && order.ItemCount > 1 && (
                            <span className="text-slate-400 ml-1">+{order.ItemCount - 1} รายการ</span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                            {order.money_sts === 'M' ? (
                              <>
                                <img
                                  src="/images/cod_logo.png"
                                  alt="COD"
                                  className="h-3 w-auto object-contain shrink-0"
                                />
                                <span>เก็บเงินปลายทาง</span>
                              </>
                            ) : (
                              <>
                                <img
                                  src="/images/thai_qr_payment.svg"
                                  alt="Thai QR Payment"
                                  className="w-3.5 h-3.5 object-contain rounded-[1px] shrink-0"
                                />
                                <span>QR พร้อมเพย์</span>
                              </>
                            )}
                          </span>
                          {order.fn_deposit_H && Number(order.fn_deposit_H) > 0 && (
                            <span className="text-[#FF0000] font-semibold">• มัดจำ</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[11px] ${order.fn_deposit_H && Number(order.fn_deposit_H) > 0 ? 'text-[#FF0000] font-semibold' : 'text-slate-400'}`}>
                          {order.fn_deposit_H && Number(order.fn_deposit_H) > 0 ? 'ยอดมัดจำที่ต้องชำระ' : 'ยอดชำระ'}
                        </p>
                        <p className={`text-lg sm:text-xl font-bold ${order.fn_deposit_H && Number(order.fn_deposit_H) > 0 ? 'text-[#FF0000]' : 'text-[#FF6B00]'}`}>
                          {formatCurrency(payableAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Compact Actions */}
                    <div className="bg-slate-50/50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-end gap-2 sm:gap-2.5 flex-wrap">
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                        className="whitespace-nowrap h-[38px] px-3.5 sm:px-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98] text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center justify-center text-center"
                      >
                        ดูรายละเอียด
                      </Link>
                      {isPending && (
                        <Link
                          href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                          className="whitespace-nowrap h-[38px] px-3.5 sm:px-4 rounded-full bg-black hover:bg-neutral-800 active:bg-neutral-900 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center justify-center text-center"
                        >
                          ชำระเงิน
                        </Link>
                      )}
                    </div>
                  </div>
                );
              }

              {/* ===== Normal Orders Tab: Full Order Card ===== */ }
              return (
                <div
                  key={order.Fn_Doc_No}
                  className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300 hover:shadow-md"
                >
                  {/* Card Header: Store info + Badge + Doc No + Date | Status */}
                  <div className="p-3.5 sm:px-6 sm:py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
                    {/* Left: Order Number & Date */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-500">
                          หมายเลขคำสั่งซื้อ:
                        </span>
                        <Link
                          href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#800020] tracking-tight font-mono transition-colors"
                          title="ดูรายละเอียดคำสั่งซื้อ"
                        >
                          {order.Fn_Doc_No}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 sm:text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>วันที่และเวลาที่สั่งซื้อ: {formatOrderDateTime(order.Fn_Doc_Date)}</span>
                      </div>
                    </div>

                    {/* Right: Status text & icon */}
                    <div className="flex items-center gap-2 ml-auto">
                      {docStsCode === '3' ? (
                        <div className="text-xs sm:text-sm text-emerald-600 font-semibold">
                          <span>ออกใบเสร็จแล้ว</span>
                        </div>
                      ) : docStsCode === '4' ? (
                        <div className="text-xs sm:text-sm text-slate-400 font-medium">
                          <span>ยกเลิก Order</span>
                        </div>
                      ) : (docStsCode === '1' && !isCodOrder) ? (
                        <div className="text-xs sm:text-sm text-red-600 font-bold">
                          <span>รอชำระ</span>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-amber-600 font-semibold">
                          <span>กำลังดำเนินการ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Order Items */}
                  <div className="divide-y divide-slate-100/80">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => {
                        const itemQty = Number(item.Qty || 1);
                        const unitPrice = Number(item.Sale_Price != null && item.Sale_Price > 0 ? item.Sale_Price : item.Sale_Price1 || 0);
                        const lineTotal = Number(item.Line_Total) > 0 ? Number(item.Line_Total) : (unitPrice * itemQty);
                        const originalLineTotal = Number(item.Sale_Price1 || 0) * itemQty;

                        return (
                          <Link
                            key={`${item.Trade_Id}-${idx}`}
                            href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                            className="p-3.5 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50/70 transition-colors group cursor-pointer block"
                          >
                            {/* Thumbnail Image */}
                            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded border border-slate-200 bg-white shrink-0 flex items-center justify-center overflow-hidden">
                              <ProductImage
                                src={item.Trade_Part_Image || '/images/ubr_beverage_logo.png'}
                                alt={item.Trade_Name}
                                objectFit="auto"
                                priority={true}
                                fallbackSrc="/images/ubr_beverage_logo.png"
                              />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2 leading-relaxed">
                                {item.Trade_Name}
                              </h4>
                              <div className="text-xs text-slate-600 mt-1">
                                x{item.Qty}
                              </div>
                            </div>

                            {/* Pricing: ราคารวมของสินค้ารายการนั้นๆ (Line Total) */}
                            <div className="text-right shrink-0">
                              {item.Sale_Price1 && item.Sale_Price1 > (item.Sale_Price || 0) ? (
                                <div className="text-xs text-slate-400 line-through">
                                  ฿{originalLineTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                </div>
                              ) : null}
                              <div className="text-xs sm:text-sm font-semibold text-[#FF6B00]">
                                ฿{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      /* Fallback when line items are not loaded */
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                        className="p-4 sm:px-6 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-16 h-16 rounded border border-slate-100 bg-white shrink-0 flex items-center justify-center overflow-hidden">
                          <ProductImage
                            src="/images/ubr_beverage_logo.png"
                            alt="UBR"
                            objectFit="auto"
                            priority={true}
                            fallbackSrc="/images/ubr_beverage_logo.png"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-slate-900">
                            {order.Sample_Trade_Name || `คำสั่งซื้อ #${order.Fn_Doc_No}`}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            จำนวน {order.ItemCount || 1} รายการ
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-[#FF6B00]">
                            {formatCurrency(order.Fn_Total)}
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Card Summary Row with Payment Method & Financial Breakdown */}
                  <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-end">
                    {(() => {
                      const totalOrderAmount = Number(order.Fn_Total) || 0;
                      const depositAmount = Number(order.fn_deposit_H) || 0;
                      const remainingAmount = Math.max(0, totalOrderAmount - depositAmount);

                      return (
                        <div className="w-full sm:w-[420px] space-y-2 text-xs sm:text-sm">
                          {/* วิธีการชำระเงิน */}
                          <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 gap-2">
                            <span className="whitespace-nowrap">วิธีการชำระเงิน (Payment Method)</span>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                              {isCodOrder ? (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-medium shadow-2xs select-none shrink-0 whitespace-nowrap">
                                  <img
                                    src="/images/cod_logo.png"
                                    alt="COD"
                                    className="h-3.5 sm:h-4 w-auto object-contain shrink-0"
                                  />
                                  <span className="whitespace-nowrap">เก็บเงินปลายทาง</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-medium shadow-2xs select-none shrink-0 whitespace-nowrap">
                                  <img
                                    src="/images/thai_qr_payment.svg"
                                    alt="Thai QR Payment"
                                    className="w-4 sm:w-4.5 h-4 sm:h-4.5 object-contain rounded-[2px] shrink-0"
                                  />
                                  <span className="whitespace-nowrap">QR พร้อมเพย์</span>
                                </div>
                              )}

                              {/* Slip / Verification Status Badge */}
                              {order.FILE_NAME_PIC && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>แนบสลิปแล้ว</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {/* ยอดรวมทั้งสิ้น (Grand Total) */}
                          <div className="flex justify-between items-center font-bold text-[#FF6B00] gap-2">
                            <span className="whitespace-nowrap">ยอดรวมทั้งสิ้น (Grand Total)</span>
                            <span className="font-bold tabular-nums whitespace-nowrap">
                              {formatCurrency(totalOrderAmount)}
                            </span>
                          </div>

                          {/* Dashed separator */}
                          <div className="border-t border-dashed border-slate-200 my-1.5" />

                          {/* ยอดมัดจำที่ต้องชำระ (Deposit) */}
                          <div className="flex justify-between items-center font-bold text-[#FF0000] gap-2">
                            <span className="whitespace-nowrap">
                              {docStsCode === '1' ? 'ยอดมัดจำที่ต้องชำระ (Deposit)' : 'ยอดมัดจำที่ชำระ (Deposit)'}
                            </span>
                            <span className="text-sm sm:text-base font-bold tabular-nums whitespace-nowrap">
                              {formatCurrency(depositAmount)}
                            </span>
                          </div>

                          {/* ยอดคงเหลือชำระเมื่อรับมอบ / Remaining */}
                          <div className="flex justify-between items-center text-slate-400 gap-2">
                            <span className="whitespace-nowrap">ยอดคงเหลือชำระเมื่อรับมอบ (Remaining)</span>
                            <span className="text-slate-500 font-medium tabular-nums whitespace-nowrap">
                              {formatCurrency(remainingAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card Actions Row */}
                  <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-end gap-2 sm:gap-2.5 flex-wrap">
                    {/* Secondary Button: ดูรายละเอียดคำสั่งซื้อ */}
                    <Link
                      href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                      className="whitespace-nowrap h-[38px] px-3.5 sm:px-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98] text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center justify-center text-center"
                    >
                      ดูรายละเอียดคำสั่งซื้อ
                    </Link>

                    {/* Primary Button: ดำเนินการชำระเงิน or ดูใบสั่งซื้อ */}
                    {docStsCode === '3' || docStsCode === '0' ? (
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/purchase-order-viewer`}
                        className="whitespace-nowrap h-[38px] px-3.5 sm:px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center justify-center text-center"
                      >
                        ดูใบสั่งซื้อ
                      </Link>
                    ) : docStsCode === '1' ? (
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                        className="whitespace-nowrap h-[38px] px-3.5 sm:px-4 rounded-full bg-black hover:bg-neutral-800 active:bg-neutral-900 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs inline-flex items-center justify-center text-center"
                      >
                        ดำเนินการชำระเงิน
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Bottom Pagination & Count Bar */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 px-1 pt-2">
            <div>
              <span>ทั้งหมด {totalItems} คำสั่งซื้อ</span>
            </div>

            <div className="flex items-center gap-6 flex-wrap justify-end">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span>แสดง</span>
                <div className="relative inline-block">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white border border-slate-200 rounded-[8px] apple-squircle-xs pl-3 pr-7 py-1 text-xs sm:text-sm text-slate-800 cursor-pointer focus:outline-none focus:border-[#800020] shadow-2xs"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span>รายการต่อหน้า</span>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 border border-slate-200 rounded-full p-1 bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2 text-xs font-medium text-slate-700">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
  );
}

function OrdersHistoryInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const isPaymentTab = tabParam === 'payment';

  return (
    <AccountLayout activeItemOverride={isPaymentTab ? 'payment' : 'orders'}>
      <OrdersContent isPaymentTab={isPaymentTab} tabParam={tabParam} />
    </AccountLayout>
  );
}

export default function OrdersHistoryPage() {
  return (
    <Suspense
      fallback={
        <AccountLayout activeItemOverride="orders">
          <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
            <WineLoading size="md" />
          </div>
        </AccountLayout>
      }
    >
      <OrdersHistoryInner />
    </Suspense>
  );
}
