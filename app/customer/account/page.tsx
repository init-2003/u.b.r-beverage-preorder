'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CustomerProfileData } from '@/components/EditProfileModal';
import AccountLayout from '@/components/AccountLayout';
import { AlertCircle, User } from 'lucide-react';
import { WineLoading } from '@/components/WineLoading';

function AccountContent() {
  const { customer, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/customer/account');
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          return;
        }
        setErrorMsg(data.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        return;
      }

      setProfile(data.profile);
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && customer) {
      fetchProfile();
    }
  }, [customer, authLoading]);

  if (authLoading || (loading && !profile)) {
    return (
      <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
        <WineLoading size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-account-slide-up">
        {/* Page Title (Desktop only, mobile shows in mobile bar with hamburger button) */}
        <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <span>บัญชีของฉัน</span>
            </h1>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-[14px] apple-squircle-card bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 1. Header Profile Overview Card */}
        <div className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                <User className="w-7 h-7 text-slate-500 stroke-[1.8]" />
              </div>
              <div className="space-y-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {profile?.customerName || 'ไม่ระบุชื่อร้านค้า/ลูกค้า'}
                </h2>
                <div className="text-xs text-slate-500">
                  <span className="text-slate-600 font-medium">
                    รหัสลูกค้า: <strong className="text-slate-800 font-bold font-mono">{profile?.customerId || '-'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2 & 3. Standalone Details Cards Grid (Mobile stacks, Desktop 2 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 2: ข้อมูลการติดต่อ */}
          <div className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-3.5 sm:px-6 py-3.5 border-b border-slate-200 bg-white sm:bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                ข้อมูลการติดต่อ
              </h3>
            </div>
            <div className="p-3.5 sm:p-6 divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">ชื่อผู้ติดต่อ / ผู้ประสานงาน:</span>
                <span className="font-medium text-slate-900 text-right truncate">
                  {profile?.customerContact || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                <span className="font-medium text-slate-900 text-right tabular-nums">
                  {profile?.customerTel || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">อีเมล:</span>
                <span className="font-medium text-slate-900 text-right truncate">
                  {profile?.customerEmail || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">เบอร์โทรสาร (แฟกซ์):</span>
                <span className="font-medium text-slate-900 text-right tabular-nums">
                  {profile?.customerFax || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: ข้อมูลภาษีและการออกเอกสาร */}
          <div className="bg-white rounded-[14px] apple-squircle-card border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-3.5 sm:px-6 py-3.5 border-b border-slate-200 bg-white sm:bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                ข้อมูลภาษีและการออกเอกสาร
              </h3>
            </div>
            <div className="p-3.5 sm:p-6 divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">เลขประจำตัวผู้เสียภาษี:</span>
                <span className="font-medium text-slate-900 text-right tabular-nums">
                  {profile?.customerTax || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">สาขา:</span>
                <span className="font-medium text-slate-900 text-right">
                  {profile?.customerBranch || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">ชื่อสำหรับออกใบกำกับภาษี:</span>
                <span className="font-medium text-slate-900 text-right truncate">
                  {profile?.customerName || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 gap-3">
                <span className="text-slate-500">ประเภทลูกค้า:</span>
                <span className="font-medium text-slate-900 text-right">
                  {profile?.customerType || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default function CustomerAccountPage() {
  return (
    <AccountLayout activeItemOverride="account">
      <Suspense
        fallback={
          <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
            <WineLoading size="md" />
          </div>
        }
      >
        <AccountContent />
      </Suspense>
    </AccountLayout>
  );
}
