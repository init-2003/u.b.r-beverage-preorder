'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CompanyLogo from './CompanyLogo';

export default function Footer() {
  const pathname = usePathname();

  // ซ่อน Footer ในหน้าเอกสารเดี่ยว (Standalone A4 Document)
  if (pathname?.includes('/purchase-order') || pathname?.includes('/a4')) {
    return null;
  }

  return (
    <footer className="bg-[#414b56] text-slate-300 py-8 border-t border-[#333b44] mt-auto text-center text-xs shadow-md print:hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        <div className="flex justify-center items-center gap-2 mb-2">
          <CompanyLogo size="sm" lightText={true} />
        </div>
        {/* Legal & Policy Links */}
        <div className="flex justify-center items-center gap-4 sm:gap-6 text-slate-300 text-xs">
          <Link
            href="/cookie-policy"
            className="hover:text-white transition-colors"
          >
            นโยบายคุกกี้
          </Link>
          <span className="text-slate-500">•</span>
          <Link
            href="/privacy-policy"
            className="hover:text-white transition-colors"
          >
            นโยบายความเป็นส่วนตัว
          </Link>
        </div>
        <div className="flex justify-center gap-4 text-slate-400 pt-3 border-t border-slate-500/30 max-w-xl mx-auto text-[10px] sm:text-[11px] whitespace-normal sm:whitespace-nowrap px-2 text-center">
          <span>© 2026 Ubon Rung Rueang Beverage Limited Partnership. All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}
