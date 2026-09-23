'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AccountLayout from '@/components/AccountLayout';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Search,
  X,
  Clock,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react';

interface OrderSummary {
  Fn_Doc_No: string;
  Fn_Doc_Date: string;
  Doc_Sts: string;
  Doc_Sts_Name: string;
  Customer_Id: string;
  Fn_Total: number;
  fn_deposit_H?: number;
  money_sts: string;
  money_sts_name: string;
  FILE_NAME_PIC?: string;
  ItemCount: number;
  Sample_Trade_Name?: string;
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

function PurchasesContent() {
  const { customer, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

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

  // กรองเฉพาะคำสั่งซื้อแบบโอนเงิน (PromptPay/Transfer) และ Doc_Sts = '1' (รอชำระ) หรือ '0' (กำลังดำเนินการ/ชำระแล้ว) + ค้นหา
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // แสดงเฉพาะคำสั่งซื้อที่เป็นการโอนเงิน (ไม่รวมเก็บเงินปลายทาง COD)
      const isTransfer =
        (o.money_sts || '').trim().toUpperCase() === 'T' ||
        (o.money_sts_name && o.money_sts_name.includes('โอน')) ||
        (o.money_sts_name && o.money_sts_name.toLowerCase().includes('promptpay'));

      if (!isTransfer) return false;

      const code = (o.Doc_Sts || '').trim();

      // แสดงเฉพาะรอชำระ (1) และกำลังดำเนินการ (0)
      if (code !== '1' && code !== '0') return false;

      // กรองตามหมายเลขคำสั่งซื้อ (Order Number) เท่านั้น
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchDocNo = (o.Fn_Doc_No || '').toLowerCase().includes(q);
        if (!matchDocNo) return false;
      }

      return true;
    });
  }, [orders, searchQuery]);

  // คำนวณการแบ่งหน้า (Pagination)
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

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
    <AccountLayout activeItemOverride="payment">
      <div className="space-y-4">



        {/* Search Box */}
        <div className="bg-[#eaeaea] sm:bg-[#f0f2f5] rounded-xs px-4 py-2.5 flex items-center gap-3 border border-slate-200/60 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาด้วยหมายเลขคำสั่งซื้อ"
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

        {/* Content Area */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xs border border-slate-100 p-5 space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-48" />
                  <div className="h-6 bg-slate-100 rounded-full w-20" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-slate-100 rounded w-60" />
                  <div className="h-6 bg-slate-200 rounded w-28" />
                </div>
                <div className="h-9 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="bg-white rounded-xs border border-slate-100/90 shadow-[0_1px_1px_0_rgba(0,0,0,0.03)] py-20 px-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">ไม่พบรายการชำระเงิน</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `ไม่พบคำสั่งซื้อที่ตรงกับ "${searchQuery}"`
                : 'ยังไม่มีรายการที่รอชำระเงินหรือที่ชำระแล้วในขณะนี้'}
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#c81415] text-white font-bold text-xs hover:bg-[#b01011] active:bg-[#960d0e] transition-colors shadow-xs"
              >
                <span>ไปเลือกซื้อสินค้า</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOrders.map((order) => {
              const docStsCode = (order.Doc_Sts || '').trim();
              const isPending = docStsCode === '1';
              const payableAmount = order.fn_deposit_H && Number(order.fn_deposit_H) > 0
                ? Number(order.fn_deposit_H)
                : Number(order.Fn_Total) || 0;

              return (
                <div
                  key={order.Fn_Doc_No}
                  className="bg-white rounded-xs border border-slate-100/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] overflow-hidden transition-shadow hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.06)]"
                >
                  {/* Row 1: Order Info + Amount */}
                  <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
                    {/* Left: Order Number & Date */}
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
                    {/* Right: Amount */}
                    <div className="text-right shrink-0">
                      <span className="text-base sm:text-lg font-bold text-[#c81415]">
                        {formatCurrency(payableAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Status + Actions */}
                  <div className="px-4 sm:px-6 py-2.5 border-t border-slate-100/80 bg-slate-50/40 flex items-center justify-between gap-3">
                    {/* Left: Status Badge */}
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] sm:text-xs font-semibold">
                        <Clock className="w-3 h-3" />
                        รอชำระ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] sm:text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        ชำระแล้ว
                      </span>
                    )}
                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <Link
                          href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                          className="px-4 py-1.5 rounded-full bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center justify-center"
                        >
                          ชำระเงิน
                        </Link>
                      )}
                      {order.FILE_NAME_PIC && order.FILE_NAME_PIC.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            const filePic = order.FILE_NAME_PIC?.trim() || '';
                            const url = filePic.startsWith('http') || filePic.startsWith('/uploads/')
                              ? filePic
                              : filePic.includes('/')
                                ? `/uploads/slips/${filePic}`
                                : `/uploads/slips/${order.Fn_Doc_No}/${filePic}`;
                            setSlipPreview(url);
                          }}
                          className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center justify-center cursor-pointer"
                        >
                          ดูสลิป
                        </button>
                      )}
                      <Link
                        href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}`}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors shadow-xs inline-flex items-center justify-center"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600 px-1 pt-2">
            <div>
              <span>ทั้งหมด {totalItems} รายการ</span>
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

      {/* Slip Lightbox Modal */}
      {slipPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSlipPreview(null)}
        >
          <div
            className="relative bg-white rounded-sm shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#c81415]" />
                สลิปการโอนเงิน
              </span>
              <button
                type="button"
                onClick={() => setSlipPreview(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Slip Image */}
            <div className="p-4 flex items-center justify-center bg-slate-50 overflow-auto max-h-[calc(85vh-56px)]">
              <img
                src={slipPreview}
                alt="สลิปการโอนเงิน"
                className="max-w-full h-auto rounded-xs shadow-xs"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (slipPreview && slipPreview.includes('/uploads/slips/') && !target.dataset.triedFallback) {
                    target.dataset.triedFallback = 'true';
                    const parts = slipPreview.split('/uploads/slips/');
                    if (parts[1] && parts[1].includes('/')) {
                      const plainName = parts[1].split('/').pop();
                      target.src = `/uploads/slips/${plainName}`;
                      return;
                    }
                  }
                  target.alt = 'ไม่สามารถโหลดรูปสลิปได้';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense fallback={<div className="max-w-[1600px] mx-auto p-8 animate-pulse">กำลังโหลดข้อมูลการชำระเงิน...</div>}>
      <PurchasesContent />
    </Suspense>
  );
}
