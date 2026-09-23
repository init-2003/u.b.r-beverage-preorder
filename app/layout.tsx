import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { BreadcrumbProvider } from '@/context/BreadcrumbContext';
import Navbar from '@/components/Navbar';
import CompanyLogo from '@/components/CompanyLogo';
import LoginModal from '@/components/LoginModal';
import AddToCartModal from '@/components/AddToCartModal';
import CookieConsentBanner from '@/components/CookieConsentBanner';

export const metadata: Metadata = {
  title: 'U.B.R Beverage Online Store',
  description: 'ระบบ Pre-Order หจก.อุบลรุ่งเรืองเบฟเวอเรจ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <head>
      </head>
      <body className="min-h-screen flex flex-col bg-[#f5f5f5] text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <BreadcrumbProvider>
              <Navbar />
              <main className="flex-1 flex flex-col w-full min-h-[calc(100vh+80px)] pb-16 sm:pb-24">{children}</main>
              <LoginModal />
              <AddToCartModal />

            {/* Slate Footer (#414b56) */}
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
                <div className="flex justify-center gap-4 text-slate-400 pt-3 border-t border-slate-500/30 max-w-xl mx-auto text-[10px] sm:text-[11px] whitespace-nowrap overflow-x-auto">
                  <span>© 2026 Ubon Rung Rueang Beverage Limited Partnership. All Rights Reserved</span>
                </div>
              </div>
            </footer>
              <CookieConsentBanner />
            </BreadcrumbProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
