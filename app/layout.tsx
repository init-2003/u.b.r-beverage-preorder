import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { BreadcrumbProvider } from '@/context/BreadcrumbContext';
import Navbar from '@/components/Navbar';
import LoginModal from '@/components/LoginModal';
import AddToCartModal from '@/components/AddToCartModal';
import Footer from '@/components/Footer';
import CookieConsentBanner from '@/components/CookieConsentBanner';

export const metadata: Metadata = {
  title: 'U.B.R Beverage Online Store',
  description: 'ระบบ Pre-Order หจก.อุบลรุ่งเรืองเบฟเวอเรจ',
  icons: {
    icon: '/apple-icon.png',
    shortcut: '/apple-icon.png',
    apple: '/apple-icon.png',
  },
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
              <Footer />
              <CookieConsentBanner />
            </BreadcrumbProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
