'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import {
  QrCode,
  Loader2,
  MapPin,
  Clock,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PaidStamp from '@/components/orders/PaidStamp';
import { CodIllustration } from '@/components/orders/CodIllustration';
import { PaymentQrIllustration } from '@/components/orders/PaymentQrIllustration';
import { SlipVerifiedIllustration } from '@/components/orders/SlipVerifiedIllustration';
import { StepPaymentIllustration } from '@/components/orders/StepPaymentIllustration';
import { StepProcessingIllustration } from '@/components/orders/StepProcessingIllustration';
import { StepReceiptIllustration } from '@/components/orders/StepReceiptIllustration';
import { WineLoading } from '@/components/WineLoading';
import { ProductImage } from '@/components/ui/ProductImage';

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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docNo = params?.docNo as string;
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

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (downloadingPdf || !order) return;
    try {
      setDownloadingPdf(true);
      const res = await fetch(`/api/orders/${encodeURIComponent(order.Fn_Doc_No)}/pdf`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'ไม่สามารถดาวน์โหลดใบสั่งซื้อได้');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PO-${order.Fn_Doc_No}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDownloadingPdf(false);
    }
  };

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
    }
  }, [docNo, order?.Fn_Doc_No, setCustomTitle]);

  useEffect(() => {
    fetchOrder();
  }, [docNo, customer, authLoading]);

  if (authLoading || !customer || loading) {
    return (
      <div className="flex-1 min-h-[calc(100vh-200px)] bg-[#f5f5f5] px-4 flex items-center justify-center">
        <WineLoading size="md" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="flex-1 bg-[#f5f5f5] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-200 text-center space-y-4 animate-order-slide-up">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">ไม่พบคำสั่งซื้อ</h2>
          <p className="text-xs text-slate-500">{errorMsg || 'ไม่พบข้อมูลคำสั่งซื้อที่ท่านค้นหา'}</p>
          <div className="pt-2">
            <Link
              href="/orders/history"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors shadow-2xs"
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

  return (
    <div className="flex-1 flex flex-col w-full bg-[#f5f5f5] py-5 sm:py-8">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

        {/* ================= 1. SHOPEE STATUS & STEPPER HEADER BANNER ================= */}
        <div className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden animate-order-slide-up">
          {/* Header row: Doc No + Order Date + Status + PO Print Link */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
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

            {/* Action buttons on top right */}
            {(docStsCode === '3' || docStsCode === '0') && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow transition-all cursor-pointer ${downloadingPdf ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  title="ดาวน์โหลดไฟล์ใบสั่งซื้อ PDF"
                >
                  {downloadingPdf ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังดาวน์โหลด...</span>
                    </span>
                  ) : (
                    <span>ดาวน์โหลดใบสั่งซื้อ</span>
                  )}
                </button>

                <Link
                  href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/purchase-order-viewer`}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-2xs hover:shadow transition-all"
                  title="เปิดดูและพิมพ์ใบสั่งซื้อ A4"
                >
                  <span>ดูใบสั่งซื้อ</span>
                </Link>
              </div>
            )}
          </div>

          {/* Stepper Timeline or Cancelled Status */}
          {docStsCode === '4' ? (
            <div className="p-5 sm:px-8 sm:py-6 bg-red-50/50 border-t sm:border-t-0 border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-red-900">
                    ยกเลิก Order
                  </h3>
                  <p className="text-xs text-red-600 mt-0.5">
                    คำสั่งซื้อนี้ถูกยกเลิกแล้ว (สถานะเอกสาร: ยกเลิก Order)
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 bg-red-100 text-red-700 rounded-full border border-red-200">
                สถานะ: ยกเลิก Order
              </span>
            </div>
          ) : (
            <div className="p-5 sm:px-8 sm:py-7">
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

        {/* ================= 2. SHOPEE DELIVERY ADDRESS CARD ================= */}
        <div 
          className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden animate-order-slide-up"
          style={{ animationDelay: '40ms' }}
        >
          {/* Signature envelope ribbon strip */}
          <div className="h-[3px] w-full bg-[repeating-linear-gradient(45deg,#6fa6d6,#6fa6d6_33px,transparent_0,transparent_41px,#f18d9b_0,#f18d9b_74px,transparent_0,transparent_82px)]" />

          <div className="p-4 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-black font-bold text-sm sm:text-base">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>ที่อยู่ในการจัดส่ง</span>
            </div>

            <div className="pt-1 pl-6 sm:pl-7 text-xs sm:text-sm space-y-1">
              <div className="font-bold text-slate-900">
                {customerName} • {customerTel}
              </div>
              <div className="text-slate-600 leading-relaxed">
                {fullAddress || 'ไม่ได้ระบุที่อยู่จัดส่ง'}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. SHOPEE ORDERED ITEMS CARD ================= */}
        <div 
          className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden animate-order-slide-up"
          style={{ animationDelay: '80ms' }}
        >
          {/* Seamless Card Header matching checkout style */}
          <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                รายการสินค้า
              </h2>
            </div>

            <div className="hidden sm:grid grid-cols-5 gap-2 sm:gap-3 text-xs text-slate-400 font-normal w-[58%] select-none">
              <span className="text-center">จำนวน</span>
              <span className="text-center">หน่วย</span>
              <span className="text-center">ราคาต่อหน่วย</span>
              <span className="text-center">ราคารวม</span>
              <span className="text-right pr-2">ยอดมัดจำ</span>
            </div>
          </div>

          {/* MOBILE VIEW (< 640px) */}
          <div className="block sm:hidden">
            <div className="divide-y divide-slate-100">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  const unitPrice = Number(item.Sale_Price != null && item.Sale_Price > 0 ? item.Sale_Price : item.Sale_Price1 || 0);
                  const lineTotal = Number(item.Line_Total) > 0 ? Number(item.Line_Total) : (unitPrice * Number(item.Qty || 0));
                  const unitDeposit = Number(item.fn_deposit_D) || 0;
                  const lineDeposit = unitDeposit * Number(item.Qty || 0);

                  const imageSrc = item.Trade_Part_Image
                    ? item.Trade_Part_Image.startsWith('/') || item.Trade_Part_Image.startsWith('http')
                      ? item.Trade_Part_Image
                      : `/${item.Trade_Part_Image}`
                    : '/images/ubr_beverage_logo.png';

                  return (
                    <div key={item.Trade_Id || idx} className="p-4 space-y-3">
                      {/* Product Info Row: Image + Name */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                          <ProductImage
                            src={imageSrc}
                            alt={item.Trade_Name}
                            objectFit="auto"
                            priority={true}
                            fallbackSrc="/images/ubr_beverage_logo.png"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                            {item.Trade_Name}
                          </h4>
                          {item.Trade_NameEN && (
                            <p className="text-[11px] text-slate-400 truncate italic">
                              {item.Trade_NameEN}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                            <span>SKU: <span className="text-slate-600">{item.Trade_Id}</span></span>
                            <span>•</span>
                            <span>หน่วย: <strong className="text-slate-700">{item.Unit_Name || 'หน่วย'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* 4-Column Stats Row: จำนวน: | ราคาต่อหน่วย: | ราคารวม: | ยอดมัดจำ: */}
                      <div className="grid grid-cols-4 gap-1.5 items-start text-center pt-2 px-1 pb-2">
                        {/* Col 1: จำนวน: */}
                        <div className="flex flex-col items-center justify-start">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-slate-800 leading-none">
                              จำนวน:
                            </span>
                          </div>
                          <div className="h-7 flex items-center justify-center mt-1">
                            <span className="font-bold text-xs text-slate-900 tabular-nums">
                              {item.Qty.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Col 2: ราคาต่อหน่วย: */}
                        <div className="flex flex-col items-center justify-start">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-slate-800 leading-none">
                              ราคาต่อหน่วย:
                            </span>
                          </div>
                          <div className="h-7 flex items-center justify-center mt-1">
                            <span className="block text-xs font-bold text-slate-900 tabular-nums">
                              ฿{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Col 3: ราคารวม: */}
                        <div className="flex flex-col items-center justify-start">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-slate-800 leading-none">
                              ราคารวม:
                            </span>
                          </div>
                          <div className="h-7 flex items-center justify-center mt-1">
                            <span className="block text-xs font-bold text-slate-900 tabular-nums">
                              ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Col 4: ยอดมัดจำ: */}
                        <div className="flex flex-col items-center justify-start">
                          <div className="h-5 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-slate-800 leading-none">
                              ยอดมัดจำ:
                            </span>
                          </div>
                          <div className="h-7 flex flex-col items-center justify-center mt-1">
                            <span className="block text-xs font-bold text-[#FF6B00] tabular-nums leading-tight">
                              ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {unitDeposit > 0 && item.Qty > 1 && (
                              <span className="text-[11px] sm:text-xs text-slate-500 font-medium leading-none mt-0.5">
                                (฿{unitDeposit.toLocaleString()}/{item.Unit_Name || 'หน่วย'})
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
              <div className="divide-y divide-slate-100">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    const unitPrice = Number(item.Sale_Price != null && item.Sale_Price > 0 ? item.Sale_Price : item.Sale_Price1 || 0);
                    const lineTotal = Number(item.Line_Total) > 0 ? Number(item.Line_Total) : (unitPrice * Number(item.Qty || 0));
                    const unitDeposit = Number(item.fn_deposit_D) || 0;
                    const lineDeposit = unitDeposit * Number(item.Qty || 0);

                    const imageSrc = item.Trade_Part_Image
                      ? item.Trade_Part_Image.startsWith('/') || item.Trade_Part_Image.startsWith('http')
                        ? item.Trade_Part_Image
                        : `/${item.Trade_Part_Image}`
                      : '/images/ubr_beverage_logo.png';

                    return (
                      <div key={item.Trade_Id || idx} className="px-5 sm:px-6 py-5">
                        <div className="flex items-center justify-between">
                          {/* Product Image & Info */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-100 rounded shrink-0 flex items-center justify-center overflow-hidden">
                              <ProductImage
                                src={imageSrc}
                                alt={item.Trade_Name}
                                objectFit="auto"
                                priority={true}
                                fallbackSrc="/images/ubr_beverage_logo.png"
                              />
                            </div>

                            <div className="min-w-0 space-y-1">
                              <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                                {item.Trade_Name}
                              </h3>
                              {item.Trade_NameEN && (
                                <p className="text-[11px] text-slate-400 truncate italic">
                                  {item.Trade_NameEN}
                                </p>
                              )}
                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                                <span>SKU: <span className="text-slate-600">{item.Trade_Id}</span></span>
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
                              <div className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                                ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {/* 5. ยอดมัดจำ */}
                            <div className="text-right pr-2">
                              <div className="font-bold text-[#FF6B00] text-xs sm:text-base tabular-nums">
                                ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {unitDeposit > 0 && item.Qty > 1 && (
                                <div className="text-xs sm:text-[13px] text-slate-500 font-medium">
                                  (฿{unitDeposit.toLocaleString()}/{item.Unit_Name || 'หน่วย'})
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

          {/* Remark section inside item card */}
          {(order.shipping?.Customer_Remark || order.Fn_Remark) && (
            <div className="p-4 sm:px-6 bg-amber-50/40 border-t border-slate-100 flex items-start text-xs text-slate-700">
              <div>
                <strong className="font-bold text-slate-900">หมายเหตุคำสั่งซื้อ: </strong>
                <span>{order.shipping?.Customer_Remark || order.Fn_Remark}</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= 4. PAYMENT METHOD & SLIP UPLOAD CARD ================= */}
        <div 
          className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 p-4 sm:p-6 space-y-4 animate-order-slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              <span>ข้อมูลและการชำระเงิน</span>
            </div>
          </div>

          {/* If PromptPay */}
          {order.money_sts === 'T' ? (
            <div className="space-y-4">
              {/* Slip already uploaded (Clean unboxed row matching COD style) */}
              {order.FILE_NAME_PIC ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 py-1">
                  <div className="flex items-center gap-3.5">
                    <SlipVerifiedIllustration className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        <span>ชำระเงินแล้ว</span>
                      </div>
                      {order.Due_Date_Pay && (
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                          ชำระเงินเมื่อ:{' '}
                          <strong className="text-emerald-700 font-semibold">
                            {formatOrderDate(order.Due_Date_Pay)}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={openSlipModal}
                      className="w-full sm:w-auto px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0 select-none active:scale-95"
                    >
                      <span>ดูสลิป</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No slip yet: Show prompt to upload with Vector Illustration (Clean unboxed row) */
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 py-1">
                  <div className="flex items-center gap-3.5">
                    <PaymentQrIllustration className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        <span>ชำระผ่าน QR PromptPay</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                        ยอดมัดจำ: <strong className="text-[#FF6B00] font-bold">฿{deposit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</strong> กรุณาสแกน QR Code เพื่อชำระเงิน
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-sm bg-[#800020] hover:bg-[#6b001b] active:bg-[#570016] text-white font-bold text-xs shadow-2xs hover:shadow transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <QrCode className="w-4 h-4 text-white" />
                    <span>สแกน QR Code ชำระเงิน</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* If COD with Vector Illustration (Clean unboxed row) */
            <div className="flex items-center gap-3 sm:gap-3.5 py-1 text-slate-800">
              <CodIllustration className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>ชำระเงินปลายทาง (Cash on Delivery)</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white tracking-wider">
                  COD
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ================= 5. FINANCIAL SUMMARY CARD (SHOPEE STYLE) ================= */}
        <div 
          className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 p-5 sm:p-6 space-y-3 animate-order-slide-up"
          style={{ animationDelay: '120ms' }}
        >
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-sm text-slate-900">
              สรุปยอดคำสั่งซื้อ
            </h3>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            {/* ยอดรวมทั้งสิ้น */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">ยอดรวมทั้งสิ้น (Grand Total)</span>
              <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* ข้อมูลมัดจำ / คงเหลือ */}
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
              <span className="font-bold text-[#FF6B00]">ยอดมัดจำที่ต้องชำระ (Deposit)</span>
              <span className="text-base sm:text-xl font-black text-[#FF6B00] tabular-nums">
                ฿{deposit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>ยอดคงเหลือชำระเมื่อรับมอบ / Remaining</span>
              <span className="font-bold text-slate-800 tabular-nums">
                ฿{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

          </div>
        </div>

        {/* ================= 6. ACTION TOOLBAR WITH PO DOWNLOAD BUTTON ================= */}
        <div 
          className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-order-slide-up"
          style={{ animationDelay: '140ms' }}
        >
          <Link
            href="/orders/history"
            className="text-xs font-bold text-[#800020] hover:text-[#6b001b] transition-colors"
          >
            <span>รายการสั่งซื้อทั้งหมด</span>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-end">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              สั่งซื้อสินค้าอื่นๆ
            </Link>
          </div>
        </div>

      </div>

      {/* Modal for viewing uploaded slip with smooth open/close animations */}
      {showSlipModal && order.FILE_NAME_PIC && (
        <div
          className={`fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-hidden touch-none transition-opacity duration-200 ease-out ${
            slipModalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeSlipModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`bg-white rounded-sm max-w-lg w-full overflow-hidden shadow-2xl p-4 space-y-3 transform transition-all duration-200 ease-out ${
              slipModalVisible
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 translate-y-2'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900">หลักฐานสลิปการโอนเงิน</h4>
              <button
                type="button"
                onClick={closeSlipModal}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-base font-bold transition-colors cursor-pointer"
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
                className="max-w-full max-h-full object-contain rounded-xs"
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
