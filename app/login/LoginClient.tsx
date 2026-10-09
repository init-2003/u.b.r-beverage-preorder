'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginHeader, LoginForm } from '@/components/ui';
import { Alert } from '@/components/ui/Alert';
import { CompanyLogo } from '@/components/CompanyLogo';

export default function LoginClient() {
  const { customer, loading } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const [globalError, setGlobalError] = useState('');
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

  // ถ้าล็อกอินอยู่แล้ว ให้ redirect ไปยังหน้าที่ต้องการทันที (เว้นแต่กำลังส่งพารามิเตอร์มาล็อกอินใหม่)
  useEffect(() => {
    if (previewLoading) return;
    if (shouldAutoLogin || (urlUser && urlPass)) return;
    if (!loading && customer) {
      setIsLoggingIn(true);
      window.location.href = redirectUrl;
    }
  }, [customer, loading, redirectUrl, previewLoading, shouldAutoLogin, urlUser, urlPass]);

  const handleLoginSuccess = () => {
    setIsLoggingIn(true);
    // ใช้ window.location.href แทน router.replace เพื่อทำ Full Browser Navigation
    // ป้องกันปัญหา Next.js App Router Client Cache จำผล Redirect เดิมของหน้า / (307 -> /login) ก่อนล็อกอิน
    window.location.href = redirectUrl;
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
            <CompanyLogo size="md" lightText={true} />
          </Link>
        </div>

        {/* Top Header Loading Bar: แถบโหลดสีทองแอมเบอร์เรืองแสงวิ่งตามขอบล่างของแถบ Logo */}
        {showTopLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[#580016] overflow-hidden">
            <div className="h-full w-2/5 bg-gradient-to-r from-transparent via-[#ffd700] to-amber-400 animate-top-loading-bar shadow-[0_0_12px_rgba(255,215,0,0.9)]" />
          </div>
        )}
      </header>

      {/* Main Area: ตรงกลาง สีขาว */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12 sm:pt-16 md:pt-20 pb-16 px-4 bg-white">
        {/* Card Wrapper with relative positioning for zero-layout-shift floating alert */}
        <div className="relative w-full max-w-[460px]">
          {/* Error Alert — ลอยอยู่เหนือการ์ด (absolute) โดยไม่ดันการ์ดลงมาเด็ดขาด */}
          {globalError && (
            <div className="absolute bottom-full left-0 right-0 mb-3 sm:mb-3.5 z-30 pointer-events-auto">
              <Alert variant="error" className="shadow-lg border-red-200">
                {globalError}
              </Alert>
            </div>
          )}

          {/* Modal Card Design (ยาวสูงขึ้นด้วย py-12 sm:py-16 และระยะเว้นช่องไฟที่โปร่งสบาย) */}
          <div className="bg-white rounded-lg py-12 sm:py-16 px-6 sm:px-11 w-full shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative border border-slate-200/90 text-slate-800">

            {/* Header: มีเฉพาะหัวข้อ "เข้าสู่ระบบ" ชิดซ้าย */}
            <LoginHeader
              showLogo={false}
              subtitle=""
              title="เข้าสู่ระบบ"
              titleId="login-page-title"
              align="left"
              className="mb-8 sm:mb-11"
            />

            {/* ฟอร์มเข้าสู่ระบบ (รหัสลูกค้า, รหัสผ่าน, Remember Me, ซัพพอร์ตโน้ต, ปุ่มแดงเบอร์กันดี) */}
            <LoginForm
              onSuccess={handleLoginSuccess}
              autoFocus={!urlUser}
              onGlobalError={setGlobalError}
              onLoadingChange={setIsSubmitting}
              initialUsername={urlUser}
              initialPassword={urlPass}
              autoSubmit={shouldAutoLogin}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
