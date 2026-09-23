'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

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

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        customerName: profile.customerName || '',
        customerContact: profile.customerContact || '',
        customerTel: profile.customerTel || '',
        customerEmail: profile.customerEmail || '',
        customerAddress: profile.customerAddress || '',
        customerZip: profile.customerZip || '',
        customerTax: profile.customerTax || '',
        customerBranch: profile.customerBranch || '',
      });
    }
    setErrorMsg('');
  }, [profile, isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/customer/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
        return;
      }

      onProfileUpdated();
      onClose();
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-sm shadow-2xl border border-slate-100/80 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <h2 className="text-lg font-black text-slate-900">ที่อยู่จัดส่งสินค้า</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Only Shipping Address */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ที่อยู่จัดส่งสินค้า
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500 focus:bg-white transition-all"
                  placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด"
                />
              </div>
            </div>

            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัสไปรษณีย์
              </label>
              <input
                type="text"
                maxLength={5}
                value={formData.customerZip}
                onChange={(e) => setFormData({ ...formData, customerZip: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-500 focus:bg-white transition-all"
                placeholder="รหัสไปรษณีย์"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
