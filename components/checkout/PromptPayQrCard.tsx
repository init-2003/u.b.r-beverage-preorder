'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share2, Check } from 'lucide-react';
import { generateKShopQrDataUrl, USE_TEST_PROMPTPAY, TEST_PROMPTPAY_PHONE } from '@/lib/kshopQr';

export interface PromptPayQrCardProps {
  amount: number;
  docNo?: string;
  customerName?: string;
  className?: string;
}

export default function PromptPayQrCard({
  amount,
  docNo,
  className = '',
}: PromptPayQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(true);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const payableAmount = typeof amount === 'number' && amount > 0 ? amount : 0;
  const formattedAmount = payableAmount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    let isMounted = true;
    setQrLoading(true);

    generateKShopQrDataUrl(payableAmount, 360)
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setQrLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate K-Shop QR:', err);
        if (isMounted) setQrLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [payableAmount]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = docNo
      ? `PromptPay_${docNo}_THB${payableAmount.toFixed(2)}.png`
      : `PromptPay_Deposit_THB${payableAmount.toFixed(2)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareQr = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && qrDataUrl) {
      try {
        const res = await fetch(qrDataUrl);
        const blob = await res.blob();
        const filename = docNo ? `PromptPay_${docNo}.png` : 'PromptPay.png';
        const file = new File([blob], filename, { type: 'image/png' });
        await navigator.share({
          title: docNo ? `ชำระเงินคำสั่งซื้อ ${docNo}` : 'ชำระเงินมัดจำสินค้า',
          text: `สแกน QR Code เพื่อชำระเงินมัดจำ ${formattedAmount} บาท (หจก. อุบลรุ่งเรืองเบฟเวอเรจ)`,
          files: [file],
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    // Fallback: Copy payment details
    const text = docNo
      ? `ชำระเงินคำสั่งซื้อ ${docNo} ยอดชำระ ${formattedAmount} บาท - หจก. อุบลรุ่งเรืองเบฟเวอเรจ`
      : `ยอดชำระเงินมัดจำ ${formattedAmount} บาท - หจก. อุบลรุ่งเรืองเบฟเวอเรจ`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div
      className={`w-full max-w-[400px] bg-white rounded-sm shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] border border-slate-100/80 overflow-hidden ${className}`}
    >
      {/* Navy Header Banner with Official THAI QR PAYMENT Logo */}
      <div className="bg-[#1A3763] px-6 py-3 flex items-center justify-center">
        <img
          src="/Thai%20QR%20Payment%20Logo.svg"
          alt="THAI QR PAYMENT"
          className="h-11 sm:h-12 w-auto max-w-[260px] object-contain"
        />
      </div>

      {/* Card Body */}
      <div className="p-6 flex flex-col items-center space-y-4">
        {/* PromptPay Official Logo Badge */}
        <div className="pt-0.5">
          <img
            src="/images/promptpay_logo.png"
            alt="PromptPay พร้อมเพย์"
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </div>

        {/* QR Code Container with subtle frame matching reference */}
        <div className="p-3 bg-white border border-slate-200 rounded-sm shadow-xs">
          {qrLoading ? (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-slate-400">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">กำลังสร้าง QR Code...</span>
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={docNo ? `QR Code ชำระเงิน ${docNo}` : 'QR Code พร้อมเพย์'}
              className="w-56 h-56 object-contain rounded-sm"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-rose-500">
              ไม่สามารถสร้าง QR Code ได้
            </div>
          )}
        </div>

        {/* Merchant Name */}
        <div className="text-center pt-1 space-y-0.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            หจก. อุบลรุ่งเรืองเบฟเวอเรจ
          </h2>
          {USE_TEST_PROMPTPAY && (
            <div className="pt-0.5">
              <span className="inline-flex items-center text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                พร้อมเพย์ทดสอบ: {TEST_PROMPTPAY_PHONE.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
              </span>
            </div>
          )}
          {docNo && (
            <p className="text-xs text-slate-500 pt-0.5">
              เลขคำสั่งซื้อ: <span className="font-bold text-slate-800">{docNo}</span>
            </p>
          )}
        </div>

        {/* Amount Row matching reference */}
        <div className="text-center pt-0.5">
          <span className="text-base sm:text-lg font-bold text-slate-900">ยอดชำระ </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#c81415] tabular-nums mx-1 font-sans">
            {formattedAmount}
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900"> บาท</span>
        </div>
      </div>

      {/* Action Buttons inside bottom of card matching reference */}
      <div className="border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={handleDownloadQr}
          disabled={!qrDataUrl || qrLoading}
          className="py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>บันทึก QR</span>
        </button>
        <button
          type="button"
          onClick={handleShareQr}
          disabled={!qrDataUrl || qrLoading}
          className="py-3.5 px-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-colors cursor-pointer disabled:opacity-50"
        >
          {copiedShare ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>แชร์ QR</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
