'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import {
  CheckCircle2,
  Truck,
  QrCode,
  Upload,
  Printer,
  Download,
  Loader2,
  MapPin,
  FileText,
  Clock,
  Package,
  CreditCard,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  Eye,
  XCircle,
  RefreshCw,
  UploadCloud,
  FileImage,
  Trash2,
  Lock,
} from 'lucide-react';
import PaymentErrorModal from '@/components/payment/PaymentErrorModal';
import { useAuth } from '@/context/AuthContext';

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

  // Slip upload states
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Lock body scroll when slip modal is open
  useEffect(() => {
    if (showSlipModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showSlipModal]);

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
      setUploadSuccessMsg('');
      setUploadErrorMsg('');
    }
  };

  const handleClearSlip = () => {
    setSlipFile(null);
    setSlipPreview(null);
    setUploadSuccessMsg('');
    setUploadErrorMsg('');
  };

  const handleUploadSlip = async () => {
    if (!slipFile || !docNo) return;
    setUploadingSlip(true);
    setUploadErrorMsg('');
    setUploadSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', slipFile);
      formData.append('docNo', docNo);
      formData.append('expectedAmount', String(deposit > 0 ? deposit : totalAmount));

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(
          uploadData.message ||
            'สลิปไม่ถูกต้อง! กรุณาอัปโหลดสลิปที่ถูกต้อง'
        );
      }

      const filename = uploadData.filename;

      // อัปเดต state ทันที เนื่องจาก /api/upload ได้ปรับปรุงฐานข้อมูลเป็น Doc_Sts = '0' เรียบร้อยแล้ว
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              FILE_NAME_PIC: filename,
              Doc_Sts: '0',
              Doc_Sts_Name: 'กำลังดำเนินการ',
            }
          : prev
      );
      setUploadSuccessMsg(
        uploadData.message ||
          '✓ ตรวจสอบ QR Code และยอดเงินในสลิปถูกต้องเรียบร้อยแล้ว สถานะเปลี่ยนเป็นกำลังดำเนินการ'
      );
      setSlipFile(null);
      setSlipPreview(null);
    } catch (err: any) {
      const msg = err.message || 'สลิปไม่ถูกต้อง! กรุณาอัปโหลดสลิปที่ถูกต้อง';
      setUploadErrorMsg(msg);
      setShowErrorModal(true);
    } finally {
      setUploadingSlip(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
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
      a.download = `PurchaseOrderNo${order.Fn_Doc_No}.pdf`;
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

  const fetchOrder = async (isManual = false) => {
    if (!docNo) return;
    if (authLoading) return;
    if (!customer) {
      setLoading(false);
      router.replace('/');
      return;
    }
    if (isManual) setRefreshing(true);
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
      if (isManual) setRefreshing(false);
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
      <div className="flex-1 bg-[#f5f5f5] py-16 px-4 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#c81415] border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="flex-1 bg-[#f5f5f5] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-200 text-center space-y-4">
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

  return (
    <div className="flex-1 flex flex-col w-full bg-[#f5f5f5] py-5 sm:py-8">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

        {/* ================= 1. SHOPEE STATUS & STEPPER HEADER BANNER ================= */}
        <div className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden">
          {/* Header row: Doc No + Order Date + Status + PO Print Link */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">หมายเลขคำสั่งซื้อ:</span>
                <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {order.Fn_Doc_No}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>วันที่และเวลาที่สั่งซื้อ: {formatOrderDate(order.confirm_at || order.Fn_Doc_Date)}</span>
              </p>
            </div>

            {/* Action buttons on top right */}
            {docStsCode === '3' && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-2xs hover:shadow transition-all cursor-pointer ${
                    downloadingPdf ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  title="ดาวน์โหลดไฟล์ใบสั่งซื้อ PDF"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังดาวน์โหลด...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดใบสั่งซื้อ</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/view-purchase-order`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] active:bg-[#1e3a8a] text-white font-bold text-xs shadow-2xs hover:shadow transition-all"
                  title="เปิดดูและพิมพ์ใบสั่งซื้อ A4"
                >
                  <Eye className="w-3.5 h-3.5" />
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
                <div className="absolute top-4.5 left-[16.666%] right-[16.666%] h-0.5 bg-slate-200 -z-0">
                  <div
                    className={`h-full transition-all duration-500 ${
                      docStsCode === '3'
                        ? 'w-full bg-emerald-600'
                        : (docStsCode === '0' || isCod)
                        ? 'w-1/2 bg-[#c81415]'
                        : 'w-0 bg-[#c81415]'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 relative z-10">
                  {/* Step 1: สั่งซื้อสำเร็จ (สำหรับ COD) หรือ รอชำระ (สำหรับโอนเงิน) */}
                  {(() => {
                    const isStep1Complete =
                      docStsCode === '0' ||
                      docStsCode === '3' ||
                      isCod ||
                      Boolean(order.FILE_NAME_PIC);

                    return (
                      <div className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                            isStep1Complete
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : 'bg-[#c81415] text-white ring-4 ring-red-100'
                          }`}
                        >
                          {isStep1Complete ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isStep1Complete ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {isCod ? 'สั่งซื้อสำเร็จ' : 'รอชำระ'}
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

                  {/* Step 2: กำลังดำเนินการ */}
                  {(() => {
                    const isStep2Complete = docStsCode === '3';
                    const isStep2Active = docStsCode === '0' || (isCod && docStsCode !== '3' && docStsCode !== '4');

                    return (
                      <div className="flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                            isStep2Complete
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : isStep2Active
                              ? 'bg-[#c81415] text-white ring-4 ring-red-100'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isStep2Complete ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isStep2Complete
                              ? 'text-emerald-700'
                              : isStep2Active
                              ? 'text-slate-900'
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

                  {/* Step 3: ออกใบเสร็จแล้ว */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                        docStsCode === '3'
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        docStsCode === '3' ? 'text-emerald-700 font-bold' : 'text-slate-400'
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
        <div className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden">
          {/* Signature envelope ribbon strip */}
          <div className="h-[3px] w-full bg-[repeating-linear-gradient(45deg,#6fa6d6,#6fa6d6_33px,transparent_0,transparent_41px,#f18d9b_0,#f18d9b_74px,transparent_0,transparent_82px)]" />

          <div className="p-4 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-[#c81415] font-bold text-sm sm:text-base">
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
        <div className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden">
          {/* Seamless Card Header matching checkout style */}
          <div className="px-5 sm:px-6 pt-4 pb-2 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                รายการสินค้า
              </h2>
            </div>

            <div className="hidden sm:grid grid-cols-4 gap-3 text-xs text-slate-400 font-normal w-[58%] select-none">
              <span className="text-center">จำนวน</span>
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
                    ? item.Trade_Part_Image.startsWith('/')
                      ? item.Trade_Part_Image
                      : `/${item.Trade_Part_Image}`
                    : '/images/ubr_beverage_logo.png';

                  return (
                    <div key={item.Trade_Id || idx} className="p-4 space-y-3">
                      {/* Product Info Row: Image + Name */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded shrink-0 flex items-center justify-center p-1 overflow-hidden shadow-2xs">
                          <img
                            src={imageSrc}
                            alt={item.Trade_Name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
                            }}
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
                            <span>หน่วย: <strong className="text-slate-700">{item.Unit_Name || 'หน่วย'}</strong></span>
                            <span>•</span>
                            <span>รหัส: <span className="text-slate-600">{item.Trade_Id}</span></span>
                          </div>
                          {unitDeposit > 0 && (
                            <p className="text-[10px] text-red-800 font-bold bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded w-fit">
                              มัดจำ ฿{unitDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{item.Unit_Name || 'หน่วย'}
                            </p>
                          )}
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
                            <span className="block text-xs font-bold text-[#c81415] tabular-nums leading-tight">
                              ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {unitDeposit > 0 && item.Qty > 1 && (
                              <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
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
                      ? item.Trade_Part_Image.startsWith('/')
                        ? item.Trade_Part_Image
                        : `/${item.Trade_Part_Image}`
                      : '/images/ubr_beverage_logo.png';

                    return (
                      <div key={item.Trade_Id || idx} className="px-5 sm:px-6 py-5">
                        <div className="flex items-center justify-between">
                          {/* Product Image & Info */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-100 rounded shrink-0 flex items-center justify-center p-1.5 overflow-hidden">
                              <img
                                src={imageSrc}
                                alt={item.Trade_Name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/ubr_beverage_logo.png';
                                }}
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
                                <span>หน่วย: <strong className="text-slate-700">{item.Unit_Name || 'หน่วย'}</strong></span>
                                <span>•</span>
                                <span>รหัส: <span className="text-slate-600">{item.Trade_Id}</span></span>
                              </div>
                              {unitDeposit > 0 && (
                                <p className="text-[10px] text-red-800 font-bold bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded w-fit">
                                  มัดจำ ฿{unitDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{item.Unit_Name || 'หน่วย'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right 4 Columns matching header: จำนวน | ราคาต่อหน่วย | ราคารวม | ยอดมัดจำ */}
                          <div className="w-[58%] grid grid-cols-4 gap-3 items-center shrink-0">
                            {/* 1. จำนวน */}
                            <div className="text-center font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
                              {item.Qty.toLocaleString()}
                            </div>

                            {/* 2. ราคาต่อหน่วย */}
                            <div className="text-center">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                                ฿{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {/* 3. ราคารวม */}
                            <div className="text-center">
                              <div className="font-bold text-slate-900 text-xs sm:text-sm tabular-nums">
                                ฿{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>

                            {/* 4. ยอดมัดจำ */}
                            <div className="text-right pr-2">
                              <div className="font-bold text-[#c81415] text-xs sm:text-base tabular-nums">
                                ฿{lineDeposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {unitDeposit > 0 && item.Qty > 1 && (
                                <div className="text-[10px] text-slate-400 font-medium">
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
            <div className="p-4 sm:px-6 bg-amber-50/40 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
              <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-slate-900">หมายเหตุคำสั่งซื้อ: </strong>
                <span>{order.shipping?.Customer_Remark || order.Fn_Remark}</span>
              </div>
            </div>
          )}
        </div>

        {/* ================= 4. PAYMENT METHOD & SLIP UPLOAD CARD ================= */}
        <div className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              <span>ข้อมูลและการชำระเงิน</span>
            </div>

            <span className="text-xs font-bold text-slate-700">
              วิธีชำระ: <span className="text-[#c81415]">{order.money_sts === 'T' ? 'โอนเงินผ่านบัญชีธนาคาร' : 'เก็บเงินปลายทาง'}</span>
            </span>
          </div>

          {/* If PromptPay */}
          {order.money_sts === 'T' ? (
            <div className="space-y-4">
              {/* Slip already uploaded */}
              {order.FILE_NAME_PIC ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-900">
                        แนบหลักฐานสลิปการโอนเงินแล้ว
                      </div>
                      {order.Due_Date_Pay && (
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          ชำระเงินเมื่อ: {formatOrderDate(order.Due_Date_Pay)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowSlipModal(true)}
                      className="px-4 py-2 rounded-sm bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูรูปสลิปที่แนบ</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No slip yet: Show prompt to upload */
                <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        รอชำระ
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ยอดมัดจำ: <strong className="text-slate-900 font-bold">฿{deposit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</strong> • สามารถสแกน QR Code หรือแนบสลิปด้านล่าง
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/orders/${encodeURIComponent(order.Fn_Doc_No)}/payment`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-sm bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <QrCode className="w-4 h-4 text-white" />
                    <span>สแกน QR Code ชำระเงิน</span>
                  </Link>
                </div>
              )}

              {/* Inline Slip Upload Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#c81415]" />
                    <span>{order.FILE_NAME_PIC ? 'อัปโหลดสลิปใบใหม่ (หากต้องการเปลี่ยน)' : 'แนบสลิปเพื่อยืนยันการชำระเงิน'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">ตรวจ QR อัตโนมัติ</span>
                </div>

                {!slipPreview ? (
                  <label className="group relative border-2 border-dashed border-slate-300 hover:border-[#c81415] hover:bg-red-50/20 rounded-lg p-5 transition-all flex flex-col items-center justify-center text-center cursor-pointer bg-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlipChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-red-100 flex items-center justify-center text-slate-600 group-hover:text-[#c81415] transition-colors mb-2">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#c81415] transition-colors">
                      คลิกเพื่ออัปโหลดสลิป
                    </span>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      {/* Slip Header Info */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 min-w-0">
                          <FileImage className="w-3.5 h-3.5 text-[#c81415] shrink-0" />
                          <span className="truncate text-[11px] text-slate-600 font-medium">
                            {slipFile?.name || 'สลิปหลักฐานการโอน'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={handleClearSlip}
                          disabled={uploadingSlip}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50 shrink-0 ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>เปลี่ยนรูป</span>
                        </button>
                      </div>

                      {/* Slip Image View */}
                      <div className="flex justify-center items-center max-h-[220px] overflow-hidden rounded bg-slate-50 border border-slate-100 p-1">
                        <img
                          src={slipPreview}
                          alt="Slip preview"
                          className="max-h-[210px] w-auto max-w-full object-contain rounded"
                        />
                      </div>

                      {/* Expected Amount */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">ยอดที่ต้องตรงกับสลิป:</span>
                        <span className="font-bold text-[#c81415] text-sm">
                          ฿{(deposit > 0 ? deposit : totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                        </span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={handleUploadSlip}
                      disabled={uploadingSlip}
                      className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {uploadingSlip ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>กำลังตรวจสอบ QR Code และยอดเงินในสลิป...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ตรวจสอบและส่งสลิป</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {uploadSuccessMsg && (
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* If COD */
            <div className="bg-blue-50/70 border border-blue-200 rounded-sm p-4 flex items-center gap-3 text-blue-900">
              <Truck className="w-6 h-6 text-blue-700 shrink-0" />
              <div className="text-xs sm:text-sm font-bold">
                ชำระเงินปลายทาง (Cash on Delivery)
              </div>
            </div>
          )}
        </div>

        {/* ================= 5. FINANCIAL SUMMARY CARD (SHOPEE STYLE) ================= */}
        <div className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 p-5 sm:p-6 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
            สรุปยอดคำสั่งซื้อ
          </h3>

          <div className="space-y-2 text-xs sm:text-sm text-slate-600">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">ยอดรวมทั้งสิ้น (Grand Total)</span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                ฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {deposit > 0 && (
              <>
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                  <span className="font-bold text-[#c81415]">ยอดมัดจำที่ต้องชำระ (Deposit)</span>
                  <span className="text-base sm:text-xl font-black text-[#c81415]">
                    ฿{deposit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span>คงเหลือชำระเมื่อสินค้ามาถึง (Remaining)</span>
                  <span className="font-bold text-slate-800">
                    ฿{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================= 6. ACTION TOOLBAR WITH PO DOWNLOAD BUTTON ================= */}
        <div className="bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/orders/history"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
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

      {/* Modal for viewing uploaded slip */}
      {showSlipModal && order.FILE_NAME_PIC && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-hidden touch-none"
          onClick={() => setShowSlipModal(false)}
        >
          <div
            className="bg-white rounded-sm max-w-lg w-full overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-sm text-slate-900">หลักฐานสลิปการโอนเงิน</h4>
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
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
            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 rounded-sm bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <PaymentErrorModal
          message={uploadErrorMsg}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
}
