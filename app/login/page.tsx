import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ U.B.R Beverage Online Store',
  description: 'เข้าสู่ระบบสั่งจองสินค้า U.B.R Beverage Online Store',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col bg-white w-full min-h-screen min-h-[100dvh]">
          <header className="w-full bg-[#800020] shadow-sm relative overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center">
              <div className="h-9 w-40 bg-white/10 rounded" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[#580016] overflow-hidden">
              <div className="h-full w-2/5 bg-gradient-to-r from-transparent via-[#ffd700] to-amber-400 animate-top-loading-bar shadow-[0_0_12px_rgba(255,215,0,0.9)]" />
            </div>
          </header>
          <div className="flex-1 flex flex-col items-center justify-start pt-12 sm:pt-16 md:pt-20 pb-16 px-4 bg-white" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
