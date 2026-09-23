'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface BreadcrumbContextType {
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const pathname = usePathname();

  // Reset custom title and scroll to top on route change
  useEffect(() => {
    setCustomTitle(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return (
    <BreadcrumbContext.Provider value={{ customTitle, setCustomTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}
