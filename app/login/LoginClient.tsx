'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginHeader, LoginForm } from '@/components/ui';
import { CompanyLogo } from '@/components/CompanyLogo';

export default function LoginClient() {
  const { customer, loading } = useAuth();
  const searchParams = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const previewLoading = searchParams.get('preview_loading') === 'true' || searchParams.get('loading') === 'true';
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ดึงข้อมูลรหัสลูกค้าและรหัสผ่านจาก URL Search Params (รองรับทั้ง &cuspass= และแบบพิมพ์ติดกัน cususer=...cuspass=...)
  const { urlUser, urlPass, shouldAutoLogin } = React.useMemo(() => {
    let u =
      searchParams.get('cususer') ||
      searchParams.get('user') ||
      searchParams.get('username') ||
      searchParams.get('Cus_User') ||
      searchParams.get('cus_user') ||
      '';
    let p =
      searchParams.get('cuspass') ||
      searchParams.get('pass') ||
      searchParams.get('password') ||
      searchParams.get('Cus_SPass') ||
      searchParams.get('cus_spass') ||
      '';

    // กรณีส่งพารามิเตอร์แบบพิมพ์ติดกัน เช่น ?cususer=C6000004cuspass=C6000004
    if (u && !p) {
      if (u.includes('cuspass=')) {
        const parts = u.split('cuspass=');
        u = parts[0] || '';
        p = parts[1] || '';
      } else if (u.includes('pass=')) {
        const parts = u.split('pass=');
        u = parts[0] || '';
        p = parts[1] || '';
      }
    }

    const autoParam = searchParams.get('auto');
    const auto = autoParam !== 'false' && Boolean(u && p);

    return {
      urlUser: u.trim(),
      urlPass: p.trim(),
      shouldAutoLogin: auto,
    };
  }, [searchParams]);

  // ถ้าล็อกอินอยู่แล้ว ให้ redirect ไปยังหน้าหลัก (/) เสมอ
  useEffect(() => {
    if (previewLoading) return;
    if (shouldAutoLogin || (urlUser && urlPass)) return;
    if (!loading && customer) {
      setIsLoggingIn(true);
      try {
        sessionStorage.setItem('ubr_sidebar_collapsed', 'false');
        sessionStorage.setItem('ubr_sidebar_collapsed_wide', 'false');
        document.cookie = 'ubr_sidebar_collapsed=false; path=/; max-age=31536000; SameSite=Lax';
        document.cookie = 'ubr_sidebar_collapsed_wide=false; path=/; max-age=31536000; SameSite=Lax';
        sessionStorage.removeItem('ubr_orders_active_tab');
        sessionStorage.setItem('ubr_orders_active_tab', 'all');
      } catch {}
      window.location.href = '/';
    }
  }, [customer, loading, previewLoading, shouldAutoLogin, urlUser, urlPass]);

  const handleLoginSuccess = () => {
    setIsLoggingIn(true);
    try {
      // เมื่อ Login ใหม่ รีเซ็ตค่าตั้งต้น: เปิด sidebar เสมอ (Expanded), รีเซ็ตตำแหน่ง scroll เป็น 0, ล้างหมวดหมู่ค้าง, และรีเซ็ตแท็บคำสั่งซื้อเป็น "ทั้งหมด"
      sessionStorage.setItem('ubr_home_scroll_y', '0');
      sessionStorage.removeItem('ubr_navigating_away');
      sessionStorage.setItem('ubr_sidebar_collapsed', 'false');
      sessionStorage.setItem('ubr_sidebar_collapsed_wide', 'false');
      document.cookie = 'ubr_sidebar_collapsed=false; path=/; max-age=31536000; SameSite=Lax';
      document.cookie = 'ubr_sidebar_collapsed_wide=false; path=/; max-age=31536000; SameSite=Lax';
      localStorage.removeItem('ubr_selected_category');
      localStorage.removeItem('ubr_selected_submenu_id');
      localStorage.removeItem('ubr_selected_type_id');
      sessionStorage.removeItem('ubr_orders_active_tab');
      sessionStorage.setItem('ubr_orders_active_tab', 'all');
      localStorage.removeItem('ubr_orders_active_tab');
    } catch {}
    // ทุกครั้งที่ Login ใหม่ ให้เปิดหน้าหลัก (/) ขึ้นมาเสมอตามความต้องการของผู้ใช้
    window.location.href = '/';
  };

  const showTopLoading = isLoggingIn || isSubmitting || (!loading && customer);

  return (
    <div className="flex-1 flex flex-col bg-white w-full min-h-screen min-h-[100dvh]">
      {/* Top Header Row — แถบด้าน Logo สี #800020 พร้อมแถบโหลดด้านบน */}
      <header className="w-full bg-[#800020] shadow-sm relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center group min-w-0 transition-opacity hover:opacity-95"
            title="หน้าหลัก หจก.อุบลรุ่งเรืองเบฟเวอเรจ"
          >
            <CompanyLogo size="md" lightText={true} suffix="(Pre-order)" />
          </Link>
        </div>

        {/* Top Header Loading Bar: แถบโหลดสีทองแอมเบอร์เรืองแสงวิ่งตามขอบล่างของแถบ Logo */}
        {showTopLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[#580016] overflow-hidden">
            <div className="h-full w-2/5 bg-gradient-to-r from-transparent via-[#ffd700] to-amber-400 animate-top-loading-bar shadow-[0_0_12px_rgba(255,215,0,0.9)]" />
          </div>
        )}
      </header>

      {/* Main Area: ตรงกลาง สีขาว โปร่งสบาย ไร้กรอบการ์ด (Seamless Canvas) */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12 sm:pt-16 md:pt-20 pb-16 px-3 sm:px-4 bg-white">
        <div className="w-full max-w-[420px] text-slate-800">
          {/* Header: หัวข้อ "เข้าสู่ระบบ" ชิดซ้าย พร้อมคำอธิบายบรรทัดถัดไป */}
          <LoginHeader
            showLogo={false}
            title="เข้าสู่ระบบ"
            subtitle="ใช้บัญชีลูกค้าในการเข้าสู่ระบบ"
            titleId="login-page-title"
            align="left"
            className="mb-6 sm:mb-8"
          />

          {/* ฟอร์มเข้าสู่ระบบ (รหัสลูกค้า, รหัสผ่าน, แสดงรหัสผ่าน, จดจำการเข้าสู่ระบบ, ซัพพอร์ตโน้ต, ปุ่มแดงเบอร์กันดี) */}
          <LoginForm
            onSuccess={handleLoginSuccess}
            autoFocus={!urlUser}
            onLoadingChange={setIsSubmitting}
            initialUsername={urlUser}
            initialPassword={urlPass}
            autoSubmit={shouldAutoLogin}
          />
        </div>
      </div>
    </div>
  );
}
