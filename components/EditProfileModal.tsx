'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface CustomerProfileData {
  customerId: string;
  cusUser: string;
  customerName: string;
  customerTax: string;
  customerBranch: string;
  customerAddress: string;
  customerZip: string;
  customerContact: string;
  customerTel: string;
  customerFax: string;
  customerEmail: string;
  customerType: string;
  customerLevel: number;
  salesEmployeeId?: string;
  salesEmployeeName: string;
  customerPromotion?: string;
  customerSts?: string;
  remark: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfileData | null;
  onProfileUpdated: () => void;
  initialTab?: 'contact' | 'address' | 'tax';
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { refreshAuth } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerContact: '',
    customerTel: '',
    customerEmail: '',
    customerAddress: '',
    customerZip: '',
    customerTax: '',
    customerBranch: '',
  });

  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle open / close animation states
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        closeTimerRef.current = null;
      }, 220);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!visible) return;
    setVisible(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
      onClose();
    }, 220);
  };

  useEffect(() => {
    if (profile) {
      const initialName = profile.customerName || profile.customerContact || '';
      setFormData({
        customerName: initialName,
        customerContact: profile.customerContact || initialName,
        customerTel: profile.customerTel || '',
        customerEmail: profile.customerEmail || '',
        customerAddress: profile.customerAddress || '',
        customerZip: profile.customerZip || '',
        customerTax: profile.customerTax || '',
        customerBranch: profile.customerBranch || '',
      });
      setSaveAsDefault(true);
    }
    setErrorMsg('');
  }, [profile, isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mounted) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, visible]);

  if (!mounted || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerTel.trim() || !formData.customerAddress.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้รับ เบอร์โทรศัพท์ติดต่อ และที่อยู่จัดส่งสินค้าโดยละเอียดให้ครบถ้วน');
      return;
    }
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/customer/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerName: formData.customerName.trim(),
          customerContact: formData.customerContact.trim() || formData.customerName.trim(),
          customerTel: formData.customerTel.trim(),
          customerAddress: formData.customerAddress.trim(),
          customerZip: formData.customerZip.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
        return;
      }

      try {
        if (refreshAuth) {
          await refreshAuth();
        }
      } catch {}

      onProfileUpdated();
      handleClose();
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ease-out ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] transform transition-all duration-200 ease-out ${
          visible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-3'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-black text-slate-900">ที่อยู่จัดส่งสินค้า</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body matching Image 2 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            {/* Row 1: Name and Tel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล / ชื่อร้านค้า <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                      customerContact: e.target.value,
                    }))
                  }
                  placeholder="เช่น สมชาย ใจดี หรือ ร้านต้นมะกรูด"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.customerTel}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerTel: e.target.value }))
                  }
                  placeholder="เช่น 081-2345678"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Row 2: Detailed Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ที่อยู่จัดส่งสินค้าโดยละเอียด <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.customerAddress}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerAddress: e.target.value }))
                }
                placeholder="ระบุบ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด"
                className="w-full p-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                required
              />
            </div>

            {/* Row 3: Zip code & Default Address Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formData.customerZip}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerZip: e.target.value }))
                  }
                  placeholder="รหัสไปรษณีย์ 5 หลัก"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div className="sm:pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black accent-black cursor-pointer"
                  />
                  <span>บันทึกเป็นที่อยู่เริ่มต้นในบัญชีของฉัน</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-6 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-black active:bg-slate-950 rounded-full transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Save className="w-4 h-4 shrink-0" />
              )}
              <span>บันทึก</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
