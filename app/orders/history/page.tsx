'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AccountLayout from '@/components/AccountLayout';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Search,
  X,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { EmptyOrdersIllustration } from '@/components/EmptyOrdersIllustration';


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

// ฟังก์ชันแปลงวันที่เป็นรูปแบบ d/M/yy (เช่น 6/5/25, 20/7/24)
function formatOrderDate(dateVal?: string): string {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
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

function OrdersContent() {
  const { customer, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const isPaymentTab = tabParam === 'payment';

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSts, setFilterSts] = useState<string>(isPaymentTab ? 'to_pay' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ซิงค์แท็บเริ่มต้นตาม Query Param ?tab=... หรือจาก sessionStorage
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
      // หากไม่มี query param ให้ดึงแท็บล่าสุดที่เลือกไว้จาก sessionStorage
      try {
        const savedTab = sessionStorage.getItem('ubr_orders_active_tab');
        if (savedTab && validTabs.includes(savedTab)) {
          setFilterSts(savedTab);
          if (savedTab !== 'all') {
            window.history.replaceState(null, '', `/orders/history?tab=${savedTab}`);
          }
        }
      } catch { }
    }
  }, [tabParam]);

  const handleTabChange = (tabKey: string) => {
    setFilterSts(tabKey);
    setCurrentPage(1);
    try {
      sessionStorage.setItem('ubr_orders_active_tab', tabKey);
      const newUrl = tabKey === 'all' ? '/orders/history' : `/orders/history?tab=${tabKey}`;
      window.history.replaceState(null, '', newUrl);
    } catch { }
  };

  useEffect(() => {
    async function fetchOrders() {
      if (!customer) return;
      setLoading(true);
      try {
        const res = await fetch('/api/orders?limit=100');
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
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

  return (
    <AccountLayout activeItemOverride={isPaymentTab ? 'payment' : 'orders'}>
      <div className="space-y-4">



        {/* 1. Shopee Status Tabs Bar — ซ่อนเมื่อ tab=payment */}
        {!isPaymentTab && (
          <div className="bg-white rounded-xs border border-slate-100/90 shadow-[0_1px_1px_0_rgba(0,0,0,0.03)] overflow-hidden">
            <div
              className="flex items-center overflow-x-auto no-scrollbar border-b border-slate-200/80"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {statusTabs.map((tab) => {
                const isActive = filterSts === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex-1 min-w-[90px] sm:min-w-[120px] py-3.5 sm:py-4 text-center text-xs sm:text-sm transition-colors relative cursor-pointer select-none ${isActive
                      ? 'text-[#c81415] font-bold'
                      : 'text-slate-700 hover:text-[#c81415] font-medium'
                      }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#c81415]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Shopee Search Box Bar */}
        <div className="bg-[#eaeaea] sm:bg-[#f0f2f5] rounded-xs px-4 py-2.5 flex items-center gap-3 border border-slate-200/60 shadow-2xs">
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
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xs border border-slate-100 p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-48" />
                  <div className="h-4 bg-slate-200 rounded w-24" />
                </div>
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-8 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-xs border border-slate-100/90 shadow-[0_1px_1px_0_rgba(0,0,0,0.03)] py-16 sm:py-20 px-4 text-center flex flex-col items-center justify-center space-y-4">
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
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-2.5 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ไปเลือกซื้อสินค้า</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
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
                    className="bg-white rounded-xs border border-slate-100/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] overflow-hidden transition-shadow hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.06)]"
                  >
                    {/* Compact Header */}
                    <div className="p-3.5 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 bg-white border-b border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium text-slate-500">
                            หมายเลขคำสั่งซื้อ:
                          </span>
                          <Link
                            href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#c81415] tracking-tight font-mono transition-colors"
                          >
                            {order.Fn_Doc_No}
                          </Link>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 sm:text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>วันที่และเวลาที่สั่งซื้อ: {formatOrderDateTime(order.Fn_Doc_Date)}</span>
                        </div>
                      </div>
                      {/* Payment Status Badge */}
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          รอชำระ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ชำระแล้ว
                        </span>
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
                        <p className="text-[11px] text-slate-400 mt-1">
                          {order.money_sts === 'M' ? 'เก็บเงินปลายทาง' : 'โอนผ่านบัญชี'}
                          {order.fn_deposit_H && Number(order.fn_deposit_H) > 0 && ' • มัดจำ'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-slate-400">ยอดชำระ</p>
                        <p className="text-lg sm:text-xl font-bold text-[#c81415]">
                          {formatCurrency(payableAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Compact Actions */}
                    <div className="bg-slate-50/50 border-t border-slate-100/80 px-4 sm:px-6 py-3 flex items-center justify-end gap-2.5">
                      {isPending && (
                        <Link
                          href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                          className="px-5 py-2 rounded-xs bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white text-xs sm:text-sm font-medium transition-colors shadow-xs"
                        >
                          ชำระเงิน
                        </Link>
                      )}
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                        className="px-4 py-2 rounded-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors shadow-xs"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                );
              }

              {/* ===== Normal Orders Tab: Full Order Card ===== */ }
              return (
                <div
                  key={order.Fn_Doc_No}
                  className="bg-white rounded-xs border border-slate-100/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] overflow-hidden transition-shadow hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.06)]"
                >
                  {/* Card Header: Store info + Badge + Doc No + Date | Status */}
                  <div className="p-3.5 sm:px-6 sm:py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                    {/* Left: Order Number & Date */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-500">
                          หมายเลขคำสั่งซื้อ:
                        </span>
                        <Link
                          href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#c81415] tracking-tight font-mono transition-colors"
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
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600 font-semibold">
                          <Truck className="w-4 h-4 shrink-0" />
                          <span>ออกใบเสร็จแล้ว</span>
                        </div>
                      ) : docStsCode === '4' ? (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>ยกเลิก Order</span>
                        </div>
                      ) : (docStsCode === '1' && !isCodOrder) ? (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-orange-600 font-semibold">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>รอชำระ</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-amber-600 font-semibold">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>กำลังดำเนินการ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Order Items */}
                  <div className="divide-y divide-slate-100/80">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <Link
                          key={`${item.Trade_Id}-${idx}`}
                          href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                          className="p-3.5 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50/70 transition-colors group cursor-pointer block"
                        >
                          {/* Thumbnail Image */}
                          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xs border border-slate-100 bg-white shrink-0 p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={item.Trade_Part_Image && item.Trade_Part_Image.trim() ? item.Trade_Part_Image : '/images/ubr_beverage_logo.png'}
                              alt={item.Trade_Name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
                              }}
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-xs sm:text-sm font-medium text-slate-900 line-clamp-2 group-hover:text-[#c81415] transition-colors leading-relaxed">
                              {item.Trade_Name}
                            </h4>
                            <div className="text-xs text-slate-600 mt-1">
                              x{item.Qty}
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="text-right shrink-0">
                            {item.Sale_Price1 && item.Sale_Price1 > item.Sale_Price ? (
                              <div className="text-xs text-slate-400 line-through">
                                ฿{Number(item.Sale_Price1).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                              </div>
                            ) : null}
                            <div className="text-xs sm:text-sm font-semibold text-[#c81415]">
                              ฿{Number(item.Sale_Price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      /* Fallback when line items are not loaded */
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                        className="p-4 sm:px-6 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-xs border border-slate-100 bg-white shrink-0 p-1 flex items-center justify-center">
                          <img src="/images/ubr_beverage_logo.png" alt="UBR" className="w-full h-full object-contain" />
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
                          <span className="text-sm font-semibold text-[#c81415]">
                            {formatCurrency(order.Fn_Total)}
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Card Summary Row matching Image 2 */}
                  <div className="bg-white border-t border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-end">
                    {(() => {
                      const totalOrderAmount = Number(order.Fn_Total) || 0;
                      const depositAmount = Number(order.fn_deposit_H) || 0;
                      const remainingAmount = Math.max(0, totalOrderAmount - depositAmount);

                      return (
                        <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm">
                          {/* ยอดรวมทั้งสิ้น (Grand Total) */}
                          <div className="flex justify-between items-center font-bold text-slate-900">
                            <span>ยอดรวมทั้งสิ้น (Grand Total)</span>
                            <span className="font-bold tabular-nums">
                              {formatCurrency(totalOrderAmount)}
                            </span>
                          </div>

                          {depositAmount > 0 && (
                            <>
                              {/* Dashed separator */}
                              <div className="border-t border-dashed border-slate-200 my-1.5" />

                              {/* ยอดมัดจำที่ต้องชำระ (Deposit) */}
                              <div className="flex justify-between items-center font-bold text-[#c81415]">
                                <span>ยอดมัดจำที่ชำระ (Deposit)</span>
                                <span className="text-sm sm:text-base font-bold tabular-nums">
                                  {formatCurrency(depositAmount)}
                                </span>
                              </div>

                              {/* คงเหลือชำระเมื่อสินค้ามาถึง (Remaining) */}
                              <div className="flex justify-between items-center text-slate-400">
                                <span>คงเหลือชำระเมื่อสินค้ามาถึง (Remaining)</span>
                                <span className="text-slate-500 font-medium tabular-nums">
                                  {formatCurrency(remainingAmount)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card Actions Row */}
                  <div className="bg-white border-t border-slate-100/80 px-4 sm:px-6 py-3 flex items-center justify-end gap-2.5 flex-wrap">
                    {/* Primary Button */}
                    {docStsCode === '3' ? (
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/view-purchase-order`}
                        className="px-6 py-2 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white text-xs sm:text-sm font-medium transition-colors shadow-xs inline-flex items-center justify-center"
                      >
                        ดูใบสั่งซื้อ
                      </Link>
                    ) : docStsCode === '1' ? (
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                        className="px-6 py-2 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white text-xs sm:text-sm font-medium transition-colors shadow-xs inline-flex items-center justify-center"
                      >
                        ชำระเงิน
                      </Link>
                    ) : null}

                    {/* Secondary Button */}
                    <Link
                      href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                      className="px-5 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors shadow-xs inline-flex items-center justify-center"
                    >
                      ดูรายละเอียดคำสั่งซื้อ
                    </Link>
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
                    className="appearance-none bg-white border border-slate-200 rounded-xs pl-3 pr-7 py-1 text-xs sm:text-sm text-slate-800 cursor-pointer focus:outline-none focus:border-[#c81415] shadow-2xs"
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
    </AccountLayout>
  );
}

export default function OrdersHistoryPage() {
  return (
    <Suspense fallback={<div className="max-w-[1600px] mx-auto p-8 animate-pulse">กำลังโหลดข้อมูลคำสั่งซื้อ...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
