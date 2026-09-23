'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import PromptPayQrCard from '@/components/checkout/PromptPayQrCard';
import PaymentSuccessModal from '@/components/payment/PaymentSuccessModal';
import PaymentErrorModal from '@/components/payment/PaymentErrorModal';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  UploadCloud,
  FileImage,
  Trash2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface OrderInfo {
  Fn_Doc_No: string;
  Fn_Doc_Date: string;
  Fn_Total: number;
  fn_deposit_H?: number;
  money_sts: string;
  money_sts_name: string;
  Doc_Sts?: string;
  Doc_Sts_Name?: string;
  FILE_NAME_PIC?: string;
  shipping?: {
    Customer_Name: string;
    Customer_Tel: string;
  };
  Customer_Name?: string;
}

function OrderPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDocNo = searchParams.get('docNo') || '';
  const { setCustomTitle } = useBreadcrumb();
  const { customer, loading: authLoading } = useAuth();

  const [docNo, setDocNo] = useState<string>(queryDocNo);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Slip upload states
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!queryDocNo && typeof window !== 'undefined') {
      try {
        const savedDocNo = sessionStorage.getItem('ubr_last_order_doc_no');
        if (savedDocNo) {
          setDocNo(savedDocNo);
        }
      } catch (err) {
        console.error('Failed to read last order from session:', err);
      }
    } else if (queryDocNo) {
      setDocNo(queryDocNo);
    }
  }, [queryDocNo]);

  useEffect(() => {
    if (docNo) {
      setCustomTitle(`ชำระเงิน ${docNo}`);
    } else {
      setCustomTitle('ชำระเงิน');
    }
  }, [docNo, setCustomTitle]);

  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace('/');
    }
  }, [authLoading, customer, router]);

  useEffect(() => {
    async function loadOrder() {
      if (authLoading) return;
      if (!customer) {
        setLoading(false);
        router.replace('/');
        return;
      }
      if (!docNo) {
        if (mounted) {
          setErrorMsg('ไม่พบข้อมูลคำสั่งซื้อที่ต้องการชำระเงิน');
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(docNo)}`);
        const data = await res.json();
        if (res.status === 401 || res.status === 403) {
          router.replace('/');
          return;
        }
        if (data.success && data.order) {
          setOrder(data.order);
          // หากคำสั่งซื้อนี้มีสลิปแนบอยู่แล้ว ให้เปิดหน้ารายละเอียดคำสั่งซื้อทันที
          if (data.order.FILE_NAME_PIC && docNo) {
            router.replace(`/orders/${encodeURIComponent(docNo)}`);
            return;
          }
        } else {
          setErrorMsg(data.message || 'ไม่พบข้อมูลคำสั่งซื้อ');
        }
      } catch (err: any) {
        setErrorMsg('เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ: ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [docNo, mounted, router, customer, authLoading]);

  // Calculate amount to pay
  const payableAmount = order
    ? order.fn_deposit_H && order.fn_deposit_H > 0
      ? order.fn_deposit_H
      : order.Fn_Total || 0
    : 0;

  // Handle Slip selection
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

  // Handle Slip Upload and Verification
  const handleUploadSlip = async () => {
    if (!slipFile || !docNo) return;
    setUploadingSlip(true);
    setUploadErrorMsg('');
    setUploadSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', slipFile);
      formData.append('docNo', docNo);
      formData.append('expectedAmount', String(payableAmount));

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

      setSlipFile(null);
      setSlipPreview(null);
      setShowSuccessModal(true);
    } catch (err: any) {
      const msg = err.message || 'สลิปไม่ถูกต้อง! กรุณาอัปโหลดสลิปที่ถูกต้อง';
      setUploadErrorMsg(msg);
      setShowErrorModal(true);
    } finally {
      setUploadingSlip(false);
    }
  };

  if (authLoading || !customer || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-16">
        <div className="w-10 h-10 border-3 border-[#c81415] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 text-center space-y-4 bg-white rounded-sm border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)]">
          <h2 className="text-base font-bold text-rose-600">เกิดข้อผิดพลาด</h2>
          <p className="text-xs text-slate-500">{errorMsg || 'ไม่พบข้อมูลคำสั่งซื้อ'}</p>
          <Link
            href="/orders/history"
            className="inline-block px-5 py-2.5 rounded-sm bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            กลับไปหน้ารายการสั่งซื้อ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f5] py-8 sm:py-12 px-4 font-sans">
      {/* Top Heading matching reference */}
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          สแกน QR เพื่อชำระเงิน
        </h1>
        <p className="text-base sm:text-lg font-medium text-slate-700">
          ด้วยแอปพลิเคชันธนาคาร
        </p>
      </div>

      {/* Main Payment Card (Shopee Micro-Border Style) */}
      <PromptPayQrCard amount={payableAmount} docNo={docNo} />

      {/* Inline Slip Upload & Auto-verification Section */}
      <div className="w-full max-w-[400px] mt-6 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-[#c81415]" />
            <span>แนบสลิปเพื่อยืนยันการชำระเงิน</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">ตรวจ QR อัตโนมัติ</span>
        </div>

        {!slipPreview ? (
          /* Dropzone / Upload Trigger */
          <label className="group relative border-2 border-dashed border-slate-200 hover:border-[#c81415] hover:bg-red-50/20 rounded-lg p-5 transition-all flex flex-col items-center justify-center text-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleSlipChange}
              className="hidden"
            />
            <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-red-100 flex items-center justify-center text-slate-600 group-hover:text-[#c81415] transition-colors mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#c81415] transition-colors">
              คลิกเพื่ออัปโหลดสลิป
            </span>
          </label>
        ) : (
          /* Slip Selected & Preview Panel */
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              {/* Slip Header Info */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
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

              {/* Slip Image Full View */}
              <div className="flex justify-center items-center max-h-[220px] overflow-hidden rounded bg-white border border-slate-200/60 p-1 shadow-2xs">
                <img
                  src={slipPreview}
                  alt="Slip preview"
                  className="max-h-[210px] w-auto max-w-full object-contain rounded"
                />
              </div>

              {/* Expected Payable Amount */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-500">ยอดที่ต้องตรงกับสลิป:</span>
                <span className="font-bold text-[#c81415] text-sm">
                  ฿{payableAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                </span>
              </div>
            </div>

            {/* Confirm & Verify Button */}
            <button
              type="button"
              onClick={handleUploadSlip}
              disabled={uploadingSlip}
              className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {uploadingSlip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบ QR Code และยอดเงิน...</span>
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
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-[400px] text-center mt-6 space-y-2">
        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          หลังสแกนชำระเงินเรียบร้อย ระบบจะตรวจสอบและยืนยันคำสั่งซื้อโดยอัตโนมัติ<br />
          หรือไปที่หน้า{' '}
          <Link
            href={`/orders/${encodeURIComponent(docNo)}`}
            className="underline font-bold text-[#ea580c] hover:text-[#c2410c]"
          >
            ตรวจสอบการชำระ
          </Link>
        </p>
      </div>

      {/* Success Lottie Animation Modal */}
      {showSuccessModal && <PaymentSuccessModal docNo={docNo} />}

      {/* Error Lottie Animation Modal */}
      {showErrorModal && (
        <PaymentErrorModal
          message={uploadErrorMsg}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
}

export default function OrderPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลการชำระเงิน...</p>
        </div>
      }
    >
      <OrderPaymentContent />
    </Suspense>
  );
}
