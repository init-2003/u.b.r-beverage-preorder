import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import HomePageClient from '@/components/HomePageClient';
import { HomeSkeleton } from '@/components/HomeSkeleton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'หจก. อุบลรุ่งเรืองเบฟเวอเรจ (Pre-order)',
  description: 'ระบบสั่งจองสินค้าพรีออเดอร์ หจก. อุบลรุ่งเรืองเบฟเวอเรจ',
};

export default async function HomeAppPage() {
  const cookieStore = await cookies();
  const collapsedCookie =
    cookieStore.get('ubr_sidebar_collapsed_wide')?.value ??
    cookieStore.get('ubr_sidebar_collapsed')?.value;
  const initialCollapsed = collapsedCookie === 'true';

  return (
    <Suspense fallback={<HomeSkeleton isSidebarCollapsed={initialCollapsed} />}>
      <HomePageClient initialCollapsed={initialCollapsed} />
    </Suspense>
  );
}
