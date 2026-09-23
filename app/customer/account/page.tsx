'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CustomerProfileData } from '@/components/EditProfileModal';
import AccountLayout from '@/components/AccountLayout';
import { AlertCircle, User } from 'lucide-react';

function AccountContent() {
  const router = useRouter();
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
      <AccountLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-sm w-48" />
          <div className="h-64 bg-slate-200 rounded-sm" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-200 rounded-sm" />
            <div className="h-48 bg-slate-200 rounded-sm" />
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Page Title (Desktop only, mobile shows in mobile bar with hamburger button) */}
        <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <span>บัญชีของฉัน</span>
            </h1>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-sm bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 1. Header Profile Overview Card */}
        <div className="bg-white rounded-sm border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6 sm:p-7">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                  <User className="w-7 h-7 text-slate-500 stroke-[1.8]" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      {profile?.customerName || 'ไม่ระบุชื่อร้านค้า/ลูกค้า'}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-sm text-slate-700 font-bold border border-slate-200">
                      รหัสลูกค้า: {profile?.customerId || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of Complete Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              
              {/* Section 1: ข้อมูลการติดต่อ */}
              <div className="space-y-3 p-4 rounded-sm bg-slate-50/70 border border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm pb-1">
                  ข้อมูลการติดต่อ
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">ชื่อผู้ติดต่อ / ผู้ประสานงาน:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerContact || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerTel || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">อีเมล:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerEmail || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">เบอร์โทรสาร (แฟกซ์):</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerFax || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: ข้อมูลภาษีและสาขา */}
              <div className="space-y-3 p-4 rounded-sm bg-slate-50/70 border border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm pb-1">
                  ข้อมูลภาษีและการออกเอกสาร
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">เลขประจำตัวผู้เสียภาษี:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerTax || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">สาขา:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerBranch || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">ชื่อสำหรับออกใบกำกับภาษี:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerName || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">ประเภทลูกค้า:</span>
                    <span className="font-medium text-slate-900 text-right">
                      {profile?.customerType || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </AccountLayout>
  );
}

export default function CustomerAccountPage() {
  return (
    <Suspense fallback={<div className="max-w-[1600px] mx-auto p-8 animate-pulse">กำลังโหลดข้อมูล...</div>}>
      <AccountContent />
    </Suspense>
  );
}
