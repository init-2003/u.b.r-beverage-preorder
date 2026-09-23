'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export interface Customer {
  customerId: string;
  cusUser?: string;
  customerName: string;
  customerTel: string;
  customerAddress: string;
  customerZip: string;
  customerLevel: number;
}

interface AuthContextType {
  customer: Customer | null;
  loading: boolean;
  login: (cus: Customer) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isLoginModalOpen: boolean;
  openLoginModal: (onSuccess?: () => void) => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGOUT_STORAGE_KEY = 'ubr_logout_timestamp';
const AUTH_SYNC_CHANNEL = 'ubr_auth_sync';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [onLoginSuccess, setOnLoginSuccess] = useState<(() => void) | null>(null);

  const customerRef = useRef<Customer | null>(customer);
  const loginTimestampRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  useEffect(() => {
    customerRef.current = customer;
  }, [customer]);

  const handleRemoteLogout = () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setCustomer(null);
    setIsLoginModalOpen(false);
    try {
      localStorage.removeItem('ubr_cart_items');
      localStorage.removeItem('ubr_cart_selected_trade_ids');
      sessionStorage.removeItem('ubr_cart_selected_ids');
      sessionStorage.removeItem('ubr_direct_checkout');
    } catch {}
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/' || window.location.search) {
        window.location.href = '/';
      } else {
        window.location.reload();
      }
    }
  };

  const refreshAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.customer) {
        setCustomer(data.customer);
        loginTimestampRef.current = Date.now();
      } else {
        setCustomer(null);
      }
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();

    // Multi-tab sync: Listen for BroadcastChannel messages
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        bc.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            handleRemoteLogout();
          } else if (event.data?.type === 'LOGIN' && event.data.customer) {
            loginTimestampRef.current = Date.now();
            setCustomer(event.data.customer);
          }
        };
      } catch {}
    }

    // Multi-tab sync: Listen for localStorage storage events across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOGOUT_STORAGE_KEY && e.newValue) {
        handleRemoteLogout();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Multi-tab sync: Check auth state when switching back to this tab (focus / visibilitychange)
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'hidden') return;

      // 1. Check if a logout occurred in another tab
      const lastLogout = Number(localStorage.getItem(LOGOUT_STORAGE_KEY) || '0');
      if (lastLogout > loginTimestampRef.current) {
        handleRemoteLogout();
        return;
      }

      // 2. If this tab currently thinks user is logged in, verify session with backend
      if (customerRef.current) {
        try {
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          if (!data.authenticated) {
            handleRemoteLogout();
          }
        } catch {
          // Ignore network errors to prevent unnecessary logouts
        }
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  const openLoginModal = (onSuccess?: () => void) => {
    if (onSuccess) {
      setOnLoginSuccess(() => onSuccess);
    } else {
      setOnLoginSuccess(null);
    }
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setOnLoginSuccess(null);
  };

  const login = (cus: Customer) => {
    loginTimestampRef.current = Date.now();
    try {
      localStorage.removeItem(LOGOUT_STORAGE_KEY);
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        bc.postMessage({ type: 'LOGIN', customer: cus });
        bc.close();
      }
    } catch {}

    setCustomer(cus);
    setIsLoginModalOpen(false);
    if (onLoginSuccess) {
      const cb = onLoginSuccess;
      setOnLoginSuccess(null);
      cb();
    }
  };

  const logout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setCustomer(null);
      const timestamp = Date.now().toString();
      try {
        localStorage.setItem(LOGOUT_STORAGE_KEY, timestamp);
        localStorage.removeItem('ubr_cart_items');
        localStorage.removeItem('ubr_cart_selected_trade_ids');
        sessionStorage.removeItem('ubr_cart_selected_ids');
        sessionStorage.removeItem('ubr_direct_checkout');
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
          bc.postMessage({ type: 'LOGOUT', timestamp });
          bc.close();
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        loading,
        login,
        logout,
        refreshAuth,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
