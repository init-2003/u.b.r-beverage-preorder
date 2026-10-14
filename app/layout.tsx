import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { BreadcrumbProvider } from '@/context/BreadcrumbContext';
import Navbar from '@/components/Navbar';
import AddToCartModal from '@/components/AddToCartModal';
import CartSuccessToast from '@/components/CartSuccessToast';
import Footer from '@/components/Footer';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import CheckoutDraftManager from '@/components/checkout/CheckoutDraftManager';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

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
    <html lang="th" className="h-full bg-white" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window !== 'undefined' && !window.ethereum) {
                    window.ethereum = {};
                  }
                } catch (err) {}

                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(e) {
                    var msg = (e && e.message) ? String(e.message) : '';
                    var fn = (e && e.filename) ? String(e.filename) : '';
                    if (
                      msg.indexOf('ethereum') !== -1 ||
                      msg.indexOf('selectedAddress') !== -1 ||
                      fn.indexOf('extension') !== -1
                    ) {
                      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                      if (e.preventDefault) e.preventDefault();
                      return true;
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(e) {
                    var reason = (e && e.reason) ? (e.reason.message || String(e.reason)) : '';
                    if (
                      reason.indexOf('ethereum') !== -1 ||
                      reason.indexOf('selectedAddress') !== -1
                    ) {
                      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                      if (e.preventDefault) e.preventDefault();
                      return true;
                    }
                  }, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-white text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <BreadcrumbProvider>
              <Navbar />
              <main className="flex-1 flex flex-col w-full">{children}</main>
              <AddToCartModal />
              <CartSuccessToast />
              <Footer />
              <CookieConsentBanner />
              <CheckoutDraftManager />
            </BreadcrumbProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
