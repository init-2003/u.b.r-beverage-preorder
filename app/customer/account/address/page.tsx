'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import EditProfileModal, { CustomerProfileData } from '@/components/EditProfileModal';
import AccountLayout from '@/components/AccountLayout';
import { AlertCircle } from 'lucide-react';
import { WineLoading } from '@/components/WineLoading';

function AddressContent() {
  const { customer, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTab, setEditTab] = useState<'contact' | 'address' | 'tax'>('address');

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
        setErrorMsg(data.message || 'ไม่สามารถโหลดข้อมูลที่อยู่ได้');
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

  const openEdit = (tab: 'contact' | 'address' | 'tax') => {
    setEditTab(tab);
    setIsEditModalOpen(true);
  };

  if (authLoading || (loading && !profile)) {
    return (
      <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
        <WineLoading size="md" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-account-slide-up">
        {/* Page Title (Desktop only, mobile shows in mobile bar with hamburger button) */}
        <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              ข้อมูลที่อยู่จัดส่งสินค้า
            </h1>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-sm bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Card: ข้อมูลที่อยู่จัดส่งสินค้า */}
        <div id="address-card" className="bg-white rounded-sm border border-slate-100/80 shadow-[0_1px_1px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              {/* รายละเอียดที่อยู่จัดส่งสินค้า */}
              <div className="max-w-xl text-sm text-slate-700 leading-relaxed space-y-1.5">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  ที่อยู่สำหรับจัดส่งสินค้า
                </h2>
                <p className="font-medium text-slate-800 pt-0.5">
                  {profile?.customerName || profile?.customerContact || '-'}
                </p>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {profile?.customerAddress || 'ยังไม่ได้ระบุที่อยู่จัดส่ง'}
                </p>
                {profile?.customerZip && (
                  <p className="text-slate-600 text-xs sm:text-sm">
                    รหัสไปรษณีย์ {profile.customerZip}
                  </p>
                )}
                <p className="text-slate-500 text-xs">ไทย</p>
                <p className="text-slate-500 text-xs">
                  Tel: {profile?.customerTel || '-'}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => openEdit('address')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                  >
                    แก้ไขที่อยู่จัดส่งสินค้า
                  </button>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile & Address Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={fetchProfile}
        initialTab={editTab}
      />
    </>
  );
}

export default function CustomerAddressPage() {
  return (
    <AccountLayout activeItemOverride="address">
      <Suspense
        fallback={
          <div className="w-full min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-center">
            <WineLoading size="md" />
          </div>
        }
      >
        <AddressContent />
      </Suspense>
    </AccountLayout>
  );
}
