'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import {
  QrCode,
  Clock,
  ArrowLeft,
  AlertCircle,
  XCircle,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PaidStamp from '@/components/orders/PaidStamp';
import { StepPaymentIllustration } from '@/components/orders/StepPaymentIllustration';
import { StepProcessingIllustration } from '@/components/orders/StepProcessingIllustration';
import { StepReceiptIllustration } from '@/components/orders/StepReceiptIllustration';
import { StepCancelledIllustration } from '@/components/orders/StepCancelledIllustration';
import { WineLoading } from '@/components/WineLoading';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatDepositPrice } from '@/lib/deposit';

interface OrderDetail {
  Branch_Id: string;
  Fn_Doc_No: string;
  Fn_Doc_Date: string;
  Doc_Sts: string;
  Doc_Sts_Name: string;
  Customer_Id: string;
  Customer_Name?: string;
  Customer_Tel?: string;
  Customer_Address?: string;
  Customer_Zip?: string;
  Fn_Total: number;
  fn_deposit_H?: number;
  Fn_Amount: number;
  money_sts: string;
  money_sts_name: string;
  Fn_Doc_No_local?: string;
  FILE_NAME_PIC?: string;
  confirm_at?: string;
  Due_Date_Pay?: string;
  Fn_Remark?: string;
  shipping: {
    Customer_Name: string;
    Customer_Tel: string;
    Customer_Address: string;
    Customer_Zip: string;
    Customer_Email?: string;
    Customer_Remark?: string;
    Pb_Now?: string;
  };
  items: Array<{
    ID_NO: number;
    Trade_Id: string;
    Trade_Name: string;
    Trade_NameEN?: string;
    Trade_Part_Image?: string;
    Qty: number;
    Unit_Name: string;
    Type_Name: string;
    Sale_Price: number;
    Sale_Price1?: number;
    Line_Total: number;
    fn_deposit_D?: number;
    Type_Free: string;
    Trade_TrakDay_Text?: string;
  }>;
}

function formatOrderDate(dateVal?: string) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatCustomerPhoneAndName(name: string, tel: string) {
  const trimmedName = (name || '').trim();
  const rawTel = (tel || '').trim();
  const digitsOnly = rawTel.replace(/[^0-9]/g, '');

  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    const formattedTel = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel,
    };
  }

  if (!digitsOnly.startsWith('0') && digitsOnly.length === 9) {
    const withZero = `0${digitsOnly}`;
    const formattedTel = `${withZero.slice(0, 3)} ${withZero.slice(3, 6)} ${withZero.slice(6)}`;
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel,
    };
  }

  if (digitsOnly.startsWith('0') && digitsOnly.length === 9) {
    const formattedTel = `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel,
    };
  }

  if (rawTel) {
    return {
      displayName: trimmedName || 'ผู้สั่งซื้อ',
      formattedTel: rawTel,
    };
  }

  return {
    displayName: trimmedName || 'ผู้สั่งซื้อ',
    formattedTel: '-',
  };
}

interface OrderDetailPageProps {
  forcedDocNo?: string | null;
}

export default function OrderDetailPage({ forcedDocNo }: OrderDetailPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const docNo = forcedDocNo || (params?.docNo as string);
  const { setCustomTitle } = useBreadcrumb();
  const { customer, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Slip viewer modal states
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipModalVisible, setSlipModalVisible] = useState(false);
  const slipModalTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openSlipModal = () => {
    if (slipModalTimerRef.current) {
      clearTimeout(slipModalTimerRef.current);
      slipModalTimerRef.current = null;
    }
    setShowSlipModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlipModalVisible(true);
      });
    });
  };

  const closeSlipModal = () => {
    if (slipModalTimerRef.current) {
      clearTimeout(slipModalTimerRef.current);
    }
    setSlipModalVisible(false);
    slipModalTimerRef.current = setTimeout(() => {
      setShowSlipModal(false);
      slipModalTimerRef.current = null;
    }, 220);
  };

  // Lock body scroll and listen for Escape key when slip modal is open
  useEffect(() => {
    if (!showSlipModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSlipModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSlipModal]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (slipModalTimerRef.current) {
        clearTimeout(slipModalTimerRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace('/');
    }
  }, [authLoading, customer, router]);

  const fetchOrder = async () => {
    if (!docNo) return;
    if (authLoading) return;
    if (!customer) {
      setLoading(false);
      router.replace('/');
      return;
    }
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(docNo)}`);
      const data = await res.json();
      if (res.status === 401 || res.status === 403) {
        router.replace('/');
        return;
      }
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setErrorMsg(data.message || 'ไม่พบข้อมูลคำสั่งซื้อ');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docNo) {
      setCustomTitle(order?.Fn_Doc_No || docNo);
      try {
        sessionStorage.setItem('ubr_active_order_doc_no', docNo);
      } catch { }
    }
  }, [docNo, order?.Fn_Doc_No, setCustomTitle]);

  useEffect(() => {
    fetchOrder();
  }, [docNo, customer, authLoading]);

  if (authLoading || !customer || loading) {
    return (
      <div className="flex-1 min-h-[calc(100vh-200px)] bg-white px-4 flex items-center justify-center">
        <WineLoading size="md" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="flex-1 bg-white py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 apple-squircle-card rounded-[14px] shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-200 text-center space-y-4 animate-order-slide-up">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">ไม่พบคำสั่งซื้อ</h2>
          <p className="text-xs text-slate-500">{errorMsg || 'ไม่พบข้อมูลคำสั่งซื้อที่ท่านค้นหา'}</p>
          <div className="pt-2">
            <Link
              href="/orders/history"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition-colors shadow-2xs min-h-[42px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับไปหน้ารายการสั่งซื้อ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Financial calculations
  const totalAmount = Number(order.Fn_Total) > 0
    ? Number(order.Fn_Total)
    : (order.items && order.items.length > 0
      ? order.items.reduce((acc, it) => {
        const p = Number(it.Sale_Price != null && it.Sale_Price > 0 ? it.Sale_Price : it.Sale_Price1 || 0);
        return acc + (p * Number(it.Qty || 0));
      }, 0)
      : 0);

  const deposit = Number(order.fn_deposit_H) || 0;
  const remaining = Math.max(0, totalAmount - deposit);

  const customerName = order.shipping?.Customer_Name || order.Customer_Name || 'ลูกค้าพรีออเดอร์';
  const customerTel = order.shipping?.Customer_Tel || order.Customer_Tel || '-';
  const fullAddress = [
    order.shipping?.Customer_Address || order.Customer_Address || '',
    order.shipping?.Customer_Zip || order.Customer_Zip || '',
  ].filter(Boolean).join(' ');

  const isCod = order.money_sts === 'M';
  const rawDocSts = (order.Doc_Sts || '').trim();
  // เก็บเงินปลายทาง (COD) สถานะคือ กำลังดำเนินการ ('0') ทันที ไม่ใช้ รอชำระ ('1')
  const docStsCode = (isCod && rawDocSts === '1') ? '0' : rawDocSts;

  // ตรวจสอบว่าออเดอร์นี้ชำระเงินแล้วหรือไม่ (ออกใบเสร็จแล้ว, มีสลิปที่แนบ, หรือมีวันที่ชำระเงิน)
  // เก็บเงินปลายทาง (COD) ไม่ต้องขึ้นตราปั๊มชำระเงินแล้ว
  const isPaid =
    !isCod && (
      docStsCode === '3' ||
      Boolean(order.FILE_NAME_PIC) ||
      Boolean(order.Due_Date_Pay) ||
      (order.money_sts === 'T' && docStsCode === '0')
    );

  const totalItemsCount = order.items && order.items.length > 0
    ? order.items.reduce((sum, item) => sum + (Number(item.Qty) || 0), 0)
    : 0;

  return (
    <div className="flex-1 flex flex-col w-full bg-white pt-6 sm:pt-8 pb-16 sm:pb-24 min-h-[calc(100vh+80px)] min-h-[calc(100dvh+80px)]">
      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 space-y-3 sm:space-y-6">

        {/* ================= 1. STATUS & STEPPER HEADER BANNER CARD ================= */}
        <div
          className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden animate-order-slide-up"
          style={{ animationDelay: '40ms' }}
        >
          {/* Header row: Doc No + Order Date + Status */}
          <div className="p-3.5 sm:px-6 sm:py-5 border-b border-slate-200 bg-white sm:bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">หมายเลขคำสั่งซื้อ:</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-mono">
                  {order.Fn_Doc_No}
                </span>
                {isCod ? (
                  <PaidStamp
                    shape="badge"
                    label="ชำระเงินปลายทาง"
                    subLabel="C.O.D"
                    color="blue"
                  />
                ) : isPaid ? (
                  <PaidStamp
                    shape="badge"
                    label="ชำระเงินแล้ว"
                    subLabel="PAID"
                    color="green"
                  />
                ) : docStsCode !== '4' ? (
                  <PaidStamp
                    shape="badge"
                    label="รอชำระ"
                    subLabel="PENDING"
                    color="red"
                  />
                ) : null}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>วันที่และเวลาที่สั่งซื้อ: {formatOrderDate(order.confirm_at || order.Fn_Doc_Date)}</span>
              </p>
            </div>
          </div>

          {/* Stepper Timeline or Cancelled Status */}
          {docStsCode === '4' ? (
            <div className="p-5 sm:px-8 sm:py-6 bg-red-50/40 border-t sm:border-t-0 border-red-100/80 flex items-center gap-4">
              <StepCancelledIllustration className="w-13 h-13 sm:w-16 sm:h-16 shrink-0 transition-transform duration-200 hover:scale-105" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-red-950">
                  ยกเลิก Order
                </h3>
                <p className="text-xs sm:text-sm text-red-600/90 mt-0.5">
                  คำสั่งซื้อนี้ถูกยกเลิกแล้ว
                </p>
              </div>
            </div>
          ) : (
            <div className="py-5 sm:py-7 px-0">
              <div className="max-w-2xl mx-auto relative">
                {/* Stepper Progress Line */}
                <div className="absolute top-6 sm:top-7 left-[16.666%] right-[16.666%] h-1 bg-slate-200 -z-0 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${docStsCode === '3'
                      ? 'w-full bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-600'
                      : (docStsCode === '0' || isCod)
                        ? 'w-1/2 bg-gradient-to-r from-blue-600 to-amber-500'
                        : 'w-0'
                      }`}
                  />
                </div>

                <div className="grid grid-cols-3 relative z-10">
                  {/* Step 1: สั่งซื้อสำเร็จ (สำหรับ COD) หรือ รอชำระ (สำหรับโอนเงิน) - โทนสีน้ำเงิน */}
                  {(() => {
                    const isStep1Complete =
                      docStsCode === '0' ||
                      docStsCode === '3' ||
                      isCod ||
                      Boolean(order.FILE_NAME_PIC);

                    return (
                      <div className="flex flex-col items-center text-center space-y-1.5 group">
                        <StepPaymentIllustration
                          status={isStep1Complete ? 'completed' : 'pending'}
                          className="w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-200 group-hover:scale-105"
                        />
                        <span
                          className={`text-xs sm:text-sm font-bold ${isStep1Complete ? 'text-blue-700' : 'text-[#800020]'
                            }`}
                        >
                          {isCod ? 'สั่งซื้อสำเร็จ' : isStep1Complete ? 'ชำระเงินแล้ว' : 'รอชำระ'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {isCod
                            ? 'เก็บเงินปลายทาง'
                            : isStep1Complete
                              ? 'ชำระเงินแล้ว'
                              : 'รอชำระเงินมัดจำ'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Step 2: กำลังดำเนินการ - โทนสีส้ม/อำพัน */}
                  {(() => {
                    const isStep2Complete = docStsCode === '3';
                    const isStep2Active = docStsCode === '0' || (isCod && docStsCode !== '3' && docStsCode !== '4');

                    return (
                      <div className="flex flex-col items-center text-center space-y-1.5 group">
                        <StepProcessingIllustration
                          status={isStep2Complete ? 'completed' : isStep2Active ? 'active' : 'inactive'}
                          className="w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-200 group-hover:scale-105"
                        />
                        <span
                          className={`text-xs sm:text-sm font-bold ${isStep2Complete
                            ? 'text-amber-700'
                            : isStep2Active
                              ? 'text-amber-600'
                              : 'text-slate-400'
                            }`}
                        >
                          กำลังดำเนินการ
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {isStep2Complete
                            ? 'ดำเนินการเสร็จสิ้น'
                            : isStep2Active
                              ? 'คำสั่งซื้ออยู่ระหว่างดำเนินการ'
                              : 'รอการตรวจสอบ'}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Step 3: ออกใบเสร็จแล้ว - โทนสีเขียวมรกต */}
                  <div className="flex flex-col items-center text-center space-y-1.5 group">
                    <StepReceiptIllustration
                      status={docStsCode === '3' ? 'completed' : 'inactive'}
                      className="w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-200 group-hover:scale-105"
                    />
                    <span
                      className={`text-xs sm:text-sm font-bold ${docStsCode === '3' ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                    >
                      ออกใบเสร็จแล้ว
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {docStsCode === '3' ? 'ออกใบเสร็จเรียบร้อย' : 'รอออกใบเสร็จ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 2. DELIVERY ADDRESS CARD (MATCHING CHECKOUT) ================= */}
        <div
          className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden animate-order-slide-up"
          style={{ animationDelay: '40ms' }}
        >
          {/* Signature envelope ribbon strip */}
          <div className="h-[3px] w-full bg-[repeating-linear-gradient(45deg,#6fa6d6,#6fa6d6_33px,transparent_0,transparent_41px,#f18d9b_0,#f18d9b_74px,transparent_0,transparent_82px)]" />

          <div className="p-3.5 sm:p-6">
            {/* Header: Pin + ที่อยู่ในการจัดส่ง */}
            <div className="flex items-center gap-2 mb-3.5">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              </svg>
              <h2 className="text-sm sm:text-base font-bold text-black tracking-tight">
                ที่อยู่ในการจัดส่ง
              </h2>
            </div>

            {/* Display Mode matching Checkout layout */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8 flex-1">
                {/* Name & Phone (Bold) */}
                <div className="sm:w-60 shrink-0 space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                    {formatCustomerPhoneAndName(customerName, customerTel).displayName}
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                    {formatCustomerPhoneAndName(customerName, customerTel).formattedTel}
                  </div>
                </div>

                {/* Full Address */}
                <div className="flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-center gap-2.5 flex-wrap">
                  {fullAddress ? (
                    <>
                      <span>{fullAddress}</span>
                      <span className="text-[10px] text-red-600 border border-red-600 px-2 py-0.5 rounded-full shrink-0 font-medium select-none">
                        ค่าเริ่มต้น
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">
                      ไม่ได้ระบุที่อยู่จัดส่ง
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. ORDERED ITEMS CARD (MATCHING CHECKOUT) ================= */}
        <div
          className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden animate-order-slide-up"
          style={{ animationDelay: '80ms' }}
        >
          {/* Table Header Row */}
          <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                รายการสินค้า
              </h2>
            </div>

            <div className="hidden sm:grid grid-cols-5 gap-2 sm:gap-3 text-xs text-slate-400 font-normal w-[58%] select-none">
              <span className="text-center">จำนวน</span>
              <span className="text-center">หน่วย</span>
              <span className="text-center">ราคาต่อหน่วย</span>
              <span className="text-center text-[#FF6B00] font-semibold">ราคารวม</span>
              <span className="text-right pr-0 text-[#FF0000] font-semibold">ยอดมัดจำ</span>
            </div>
          </div>

          {/* MOBILE VIEW (< 640px) */}
          <div className="block sm:hidden">
            <div>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  const unitPrice = Number(item.Sale_Price != null && item.Sale_Price > 0 ? item.Sale_Price : item.Sale_Price1 || 0);
                  const lineTotal = Number(item.Line_Total) > 0 ? Number(item.Line_Total) : (unitPrice * Number(item.Qty || 0));
                  const itemQty = Number(item.Qty || 0) || 1;
                  const lineDeposit = Number(item.fn_deposit_D) || 0;
                  const unitDeposit = lineDeposit / itemQty;

                  const imageSrc = item.Trade_Part_Image
                    ? item.Trade_Part_Image.startsWith('/') || item.Trade_Part_Image.startsWith('http')
                      ? item.Trade_Part_Image
                      : `/${item.Trade_Part_Image}`
                    : '/images/ubr_beverage_logo.png';

                  return (
                    <div key={item.Trade_Id || idx} className="p-3 sm:p-4 space-y-3">
                      {/* Product Info Row: Image + Name */}
                      <div className="flex items-center gap-3">
                        {/* Mobile Product Image: Large & Borderless matching cart */}
                        <Link
                          href={`/products/${encodeURIComponent(item.Trade_Id)}`}
                          className="w-20 h-20 xs:w-24 xs:h-24 shrink-0 flex items-center justify-center select-none"
                        >
                          <ProductImage
                            src={imageSrc}
                            alt={item.Trade_Name}
                            objectFit="contain"
                            className="w-full h-full"
                            priority={true}
                            fallbackSrc="/images/ubr_beverage_logo.png"
                          />
                        </Link>

                        <div className="min-w-0 flex-1 space-y-1">
                          <Link
                            href={`/products/${encodeURIComponent(item.Trade_Id)}`}
                            className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug hover:text-[#800020] transition-colors"
                          >
                            {item.Trade_Name}
                          </Link>
                          {item.Trade_NameEN && (
                            <p className="text-[11px] text-slate-400 truncate italic">
                              {item.Trade_NameEN}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-xs text-slate-500">
                            <span>SKU: <span className="text-slate-600">{item.Trade_Id}</span></span>
                            <span>•</span>
                            <span>หน่วย: <strong className="text-slate-700">{item.Unit_Name || 'หน่วย'}</strong></span>
                            {item.Trade_TrakDay_Text ? (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                  <Truck className="w-2.5 h-2.5 text-slate-500" />
                                  <span>จัดส่ง {item.Trade_TrakDay_Text}</span>
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* 4-Column Stats Row: จำนวน | ราคา/หน่วย | ราคารวม | ยอดมัดจำ */}
                      <div className="grid grid-cols-4 gap-1 items-start text-center pt-2 px-0.5 pb-2">
                        {/* Col 1: จำนวน */}
                        <div className="flex flex-col items-center justify-start min-w-0">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-none truncate">
                              จำนวน
                            </span>
                          </div>
                          <div className="h-7 flex items-center justify-center mt-1">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
                              {item.Qty.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Col 2: ราคา/หน่วย */}
                        <div className="flex flex-col items-center justify-start min-w-0">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-none truncate">
                              ราคา/หน่วย
                            </span>
                          </div>
                          <div className="h-7 flex items-center justify-center mt-1">
                            <span className="block text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                              ฿{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Col 3: ราคารวม */}
                        <div className="flex flex-col items-center justify-start min-w-0">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] sm:text-xs font-bold text-[#FF6B00] leading-none truncate">
                              ราคารวม
                            </span>
                          </div>
                          <div className="h-7 flex items-center justify-center mt-1">
                            <span className="block text-xs sm:text-sm font-bold text-[#FF6B00] tabular-nums">
                              ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Col 4: ยอดมัดจำ */}
                        <div className="flex flex-col items-center justify-start min-w-0">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] sm:text-xs font-bold text-[#FF0000] leading-none truncate">
                              ยอดมัดจำ
                            </span>
                          </div>
                          <div className="h-7 flex flex-col items-center justify-center mt-1">
                            <span className="block text-xs sm:text-sm font-bold text-[#FF0000] tabular-nums leading-tight">
                              ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {unitDeposit > 0 && item.Qty > 1 && (
                              <span className="text-[10px] sm:text-xs text-[#FF0000] font-medium leading-none mt-0.5 truncate">
                                (฿{formatDepositPrice(unitDeposit)}/{item.Unit_Name || 'หน่วย'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  ไม่มีข้อมูลรายการสินค้า
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP VIEW (>= 640px) matching checkout */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="min-w-[560px] sm:min-w-0">
              <div>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    const unitPrice = Number(item.Sale_Price != null && item.Sale_Price > 0 ? item.Sale_Price : item.Sale_Price1 || 0);
                    const lineTotal = Number(item.Line_Total) > 0 ? Number(item.Line_Total) : (unitPrice * Number(item.Qty || 0));
                    const itemQty = Number(item.Qty || 0) || 1;
                    const lineDeposit = Number(item.fn_deposit_D) || 0;
                    const unitDeposit = lineDeposit / itemQty;

                    const imageSrc = item.Trade_Part_Image
                      ? item.Trade_Part_Image.startsWith('/') || item.Trade_Part_Image.startsWith('http')
                        ? item.Trade_Part_Image
                        : `/${item.Trade_Part_Image}`
                      : '/images/ubr_beverage_logo.png';

                    return (
                      <div key={item.Trade_Id || idx} className="px-6 py-5">
                        <div className="flex items-center justify-between">
                          {/* Product Image & Info */}
                          <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                            {/* Product Image: Large & Borderless matching cart */}
                            <Link
                              href={`/products/${encodeURIComponent(item.Trade_Id)}`}
                              className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105"
                            >
                              <ProductImage
                                src={imageSrc}
                                alt={item.Trade_Name}
                                objectFit="contain"
                                className="w-full h-full"
                                priority={true}
                                fallbackSrc="/images/ubr_beverage_logo.png"
                              />
                            </Link>

                            <div className="min-w-0 flex-1 space-y-1">
                              <Link
                                href={`/products/${encodeURIComponent(item.Trade_Id)}`}
                                className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug hover:text-[#800020] transition-colors"
                              >
                                {item.Trade_Name}
                              </Link>
                              {item.Trade_NameEN && (
                                <p className="text-[11px] text-slate-400 truncate italic">
                                  {item.Trade_NameEN}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                                <span>SKU: <span className="text-slate-600">{item.Trade_Id}</span></span>
                                {item.Trade_TrakDay_Text ? (
                                  <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                                    <Truck className="w-3 h-3 text-slate-500" />
                                    <span>จัดส่ง {item.Trade_TrakDay_Text}</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Right 5 Columns matching header: จำนวน | หน่วย | ราคาต่อหน่วย | ราคารวม | ยอดมัดจำ */}
                          <div className="w-[58%] grid grid-cols-5 gap-2 sm:gap-3 items-center shrink-0">
                            {/* 1. จำนวน */}
                            <div className="text-center font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
                              {item.Qty.toLocaleString()}
                            </div>

                            {/* 2. หน่วย */}
                            <div className="text-center">
                              <span className="text-xs sm:text-sm font-medium text-slate-700">
                                {item.Unit_Name || 'หน่วย'}
                              </span>
                            </div>

                            {/* 3. ราคาต่อหน่วย */}
                            <div className="text-center">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                                ฿{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {/* 4. ราคารวม */}
                            <div className="text-center">
                              <div className="font-bold text-[#FF6B00] text-xs sm:text-sm tabular-nums">
                                ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {/* 5. ยอดมัดจำ */}
                            <div className="text-right pr-0">
                              <div className="font-bold text-[#FF0000] text-xs sm:text-base tabular-nums">
                                ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {unitDeposit > 0 && item.Qty > 1 && (
                                <div className="text-xs text-[#FF0000] font-medium">
                                  (฿{formatDepositPrice(unitDeposit)}/{item.Unit_Name || 'หน่วย'})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    ไม่มีข้อมูลรายการสินค้า
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Bottom Bar: Order Remark (Shopee Style) & Order Total */}
          <div className="border-t border-dashed border-slate-200 px-3.5 sm:px-6 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white">
            <div className="flex-1 flex items-center gap-2.5 max-w-xl">
              <span className="text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
                หมายเหตุ:
              </span>
              <div className="flex-1 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm">
                {order.shipping?.Customer_Remark || order.Fn_Remark || '-'}
              </div>
            </div>

            <div className="flex items-center justify-end text-right shrink-0">
              <span className="text-xs sm:text-sm text-slate-600">
                คำสั่งซื้อทั้งหมด ({totalItemsCount} ชิ้น)
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Action Bar: "< รายการสั่งซื้อทั้งหมด" (Matching Checkout) */}
        <div
          className="flex items-center justify-between gap-4 pt-1 animate-order-slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <Link
            href="/orders/history"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-colors min-h-[38px]"
          >
            <span>&lt; รายการสั่งซื้อทั้งหมด</span>
          </Link>

          <div className="text-xs sm:text-sm text-slate-400 font-medium flex items-center gap-1">
            <span>ทั้งหมด {totalItemsCount} ชิ้น ในรายการสั่งซื้อ</span>
          </div>
        </div>

        {/* ================= 4. STANDALONE PAYMENT METHOD CARD (MATCHING CHECKOUT) ================= */}
        <div
          className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden animate-order-slide-up"
          style={{ animationDelay: '120ms' }}
        >
          <div className="p-3.5 sm:p-6">
            {/* Desktop View (>= sm): Single horizontal row perfectly centered */}
            <div className="hidden sm:flex sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 whitespace-nowrap">
                  วิธีการชำระเงิน
                </h3>

                {isCod ? (
                  <div className="w-fit inline-flex items-center gap-2 px-3 py-1.5 rounded-[12px] apple-squircle-sm border border-slate-200 bg-white text-slate-700 text-sm font-medium shadow-2xs select-none shrink-0 whitespace-nowrap">
                    <img
                      src="/images/cod_logo.png"
                      alt="COD"
                      className="h-4.5 w-auto object-contain shrink-0"
                    />
                    <span className="whitespace-nowrap font-semibold">เก็บเงินปลายทาง</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-fit inline-flex items-center gap-2 px-3 py-1.5 rounded-[12px] apple-squircle-sm border border-slate-200 bg-white text-slate-700 text-sm font-medium shadow-2xs select-none shrink-0 whitespace-nowrap">
                      <img
                        src="/images/thai_qr_payment.svg"
                        alt="Thai QR Payment"
                        className="w-5 h-5 object-contain rounded-[2px] shrink-0"
                      />
                      <span className="whitespace-nowrap font-semibold">QR พร้อมเพย์</span>
                    </div>

                    {order.FILE_NAME_PIC && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full whitespace-nowrap">
                        <span>แนบสลิปแล้ว</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!isCod && (
                <div className="flex items-center gap-2.5 shrink-0">
                  {order.FILE_NAME_PIC ? (
                    <button
                      type="button"
                      onClick={openSlipModal}
                      className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0 select-none active:scale-95 min-h-[40px]"
                    >
                      <span>ดูสลิป</span>
                    </button>
                  ) : (
                    <Link
                      href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                      className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 active:bg-neutral-900 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-2xs hover:shadow transition-all flex items-center justify-center gap-1.5 shrink-0 min-h-[40px]"
                    >
                      <QrCode className="w-4 h-4 text-white" />
                      <span>สแกน QR Code ชำระเงิน</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Mobile View (< sm): Balanced card without redundant status badge */}
            <div className="flex flex-col gap-3.5 sm:hidden">
              {/* Row 1: Title (left) & Method Badge (right) */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">
                  วิธีการชำระเงิน
                </h3>
                {isCod ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] apple-squircle-sm border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-2xs shrink-0">
                    <img
                      src="/images/cod_logo.png"
                      alt="COD"
                      className="h-4 w-auto object-contain shrink-0"
                    />
                    <span className="font-semibold">เก็บเงินปลายทาง</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] apple-squircle-sm border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-2xs shrink-0">
                    <img
                      src="/images/thai_qr_payment.svg"
                      alt="Thai QR"
                      className="w-4 h-4 object-contain rounded-[2px] shrink-0"
                    />
                    <span className="font-semibold">QR พร้อมเพย์</span>
                  </div>
                )}
              </div>

              {/* Row 2: Action Button */}
              {!isCod && (
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2.5">
                  {order.FILE_NAME_PIC ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                        <span>แนบสลิปแล้ว</span>
                      </span>
                      <button
                        type="button"
                        onClick={openSlipModal}
                        className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0 min-h-[38px]"
                      >
                        <span>ดูสลิป</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                      className="w-full px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 active:bg-neutral-900 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-2xs hover:shadow transition-all flex items-center justify-center gap-2 min-h-[42px]"
                    >
                      <QrCode className="w-4 h-4 text-white shrink-0" />
                      <span>สแกน QR Code ชำระเงิน</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 5. STANDALONE FINANCIAL SUMMARY CARD (MATCHING CHECKOUT) ================= */}
        <div
          className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-2xs overflow-hidden animate-order-slide-up"
          style={{ animationDelay: '140ms' }}
        >
          {/* Financial Breakdown */}
          <div className="p-3.5 sm:p-6 bg-white space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              สรุปยอดคำสั่งซื้อ
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              {/* 1. ยอดรวมทั้งสิ้น (Grand Total) */}
              <div className="flex justify-between items-center font-bold text-[#FF6B00]">
                <span className="text-xs sm:text-sm">ยอดรวมทั้งสิ้น (Grand Total)</span>
                <span className="text-sm sm:text-lg font-black text-[#FF6B00] tabular-nums">
                  ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* 2. ยอดมัดจำที่ต้องชำระ (Deposit) */}
              <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-slate-200">
                <span className="font-bold text-xs sm:text-sm text-[#FF0000]">ยอดมัดจำที่ต้องชำระ (Deposit)</span>
                <span className="text-base sm:text-xl font-black text-[#FF0000] tabular-nums">
                  ฿{deposit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* 3. ยอดคงเหลือชำระเมื่อรับมอบ / Remaining */}
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs sm:text-sm">ยอดคงเหลือชำระเมื่อรับมอบ / Remaining</span>
                <span className="font-bold text-xs sm:text-sm text-slate-800 tabular-nums">
                  ฿{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer inside Summary Card matching Checkout pattern */}
          <div className="border-t border-dashed border-slate-200 p-3.5 sm:px-6 sm:py-5 flex items-center justify-between gap-2.5 bg-white">
            <Link
              href="/"
              className="flex-1 sm:flex-initial min-w-0 px-4 sm:px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold text-xs sm:text-sm transition-all text-center min-h-[42px] inline-flex items-center justify-center whitespace-nowrap"
            >
              สั่งซื้อสินค้าอื่นๆ
            </Link>

            {(docStsCode === '3' || docStsCode === '0') && (
              <Link
                href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/purchase-order-viewer`}
                className="flex-1 sm:flex-initial min-w-0 px-4 sm:px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-2xs hover:shadow transition-all text-center min-h-[42px] inline-flex items-center justify-center whitespace-nowrap ml-auto sm:ml-0"
                title="เปิดดูและพิมพ์ใบสั่งซื้อ A4"
              >
                ดูใบสั่งซื้อ
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* Modal for viewing uploaded slip with smooth open/close animations */}
      {showSlipModal && order.FILE_NAME_PIC && (
        <div
          className={`fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-hidden touch-none transition-opacity duration-200 ease-out ${slipModalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          onClick={closeSlipModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`bg-white apple-squircle-modal max-w-lg w-full overflow-hidden shadow-2xl p-4 space-y-3 transform transition-all duration-200 ease-out ${slipModalVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-2'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm sm:text-base text-slate-900">หลักฐานสลิปการโอนเงิน</h4>
              <button
                type="button"
                onClick={closeSlipModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 text-lg font-bold transition-all cursor-pointer"
                title="ปิดหน้าต่าง"
                aria-label="ปิดหน้าต่าง"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 p-2 rounded-sm border border-slate-100">
              <img
                src={
                  order.FILE_NAME_PIC.startsWith('http') || order.FILE_NAME_PIC.startsWith('/uploads/')
                    ? order.FILE_NAME_PIC
                    : order.FILE_NAME_PIC.includes('/')
                      ? `/uploads/slips/${order.FILE_NAME_PIC}`
                      : `/uploads/slips/${order.Fn_Doc_No || docNo}/${order.FILE_NAME_PIC}`
                }
                alt="Payment Slip"
                className="max-w-full max-h-full object-contain rounded-[10px] apple-squircle-sm"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes(`/uploads/slips/${order.FILE_NAME_PIC}`)) {
                    target.src = `/uploads/slips/${order.FILE_NAME_PIC}`;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
