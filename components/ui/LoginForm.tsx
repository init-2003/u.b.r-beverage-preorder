'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Alert } from './Alert';

export interface LoginFormProps {
  onSuccess?: (customer?: any) => void;
  showSupportNote?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const REMEMBER_ME_STORAGE_KEY = 'ubr_remember_me';
const SAVED_USERNAME_STORAGE_KEY = 'ubr_saved_username';

export function LoginForm({
  onSuccess,
  showSupportNote = true,
  autoFocus = true,
  className = '',
}: LoginFormProps) {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    try {
      const savedRemember = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
      const savedUser = localStorage.getItem(SAVED_USERNAME_STORAGE_KEY);
      if (savedRemember === 'false') {
        setRememberMe(false);
      } else if (savedUser) {
        setUsername(savedUser);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('กรุณากรอกรหัสลูกค้า');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'true');
          localStorage.setItem(SAVED_USERNAME_STORAGE_KEY, username.trim());
        } else {
          localStorage.setItem(REMEMBER_ME_STORAGE_KEY, 'false');
          localStorage.removeItem(SAVED_USERNAME_STORAGE_KEY);
        }
      } catch {}

      login(data.customer);
      if (onSuccess) {
        onSuccess(data.customer);
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Error Alert */}
      {errorMsg && (
        <Alert variant="error" className="mb-5">
          {errorMsg}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Field 1: Cus_User */}
        <Input
          variant="underline"
          type="text"
          required
          placeholder="รหัสลูกค้า"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus={autoFocus}
        />

        {/* Field 2: Password (Cus_SPass) with Eye Toggle */}
        <div className="space-y-3">
          <Input
            variant="underline"
            type={showPassword ? 'text' : 'password'}
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 p-1.5 transition-colors cursor-pointer"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                tabIndex={-1}
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            }
          />

          {/* Remember Me Option (Circular Checkbox) */}
          <div className="flex items-center pt-0.5">
            <label
              htmlFor="remember-me-checkbox"
              className="group inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-[13px] text-slate-600 hover:text-slate-900 transition-colors"
            >
              <input
                type="checkbox"
                id="remember-me-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only peer"
              />
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900 peer-focus-visible:ring-offset-1 ${
                  rememberMe
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-slate-300 group-hover:border-slate-400'
                }`}
              >
                {rememberMe && (
                  <svg
                    className="w-2.5 h-2.5 text-white stroke-[3.5]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span>Remember me</span>
            </label>
          </div>
        </div>

        {/* Customer Care / Support Note */}
        {showSupportNote && (
          <p className="text-xs text-slate-500 leading-normal text-left pt-0.5">
            สำหรับลูกค้า หจก.อุบลรุ่งเรืองเบฟเวอเรจ สามารถใช้รหัสลูกค้า และรหัสผ่าน ในการเข้าสู่ระบบ ติดต่อสอบถามเพิ่มเติมได้ที่แผนกลูกค้าสัมพันธ์ <span className="font-semibold text-slate-700">045-245-888</span>
          </p>
        )}

        {/* Full Width Primary Brand Red Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          isLoading={loading}
          className="py-3 text-sm sm:text-base font-bold shadow-xs hover:shadow tracking-wide"
        >
          เข้าสู่ระบบ
        </Button>
      </form>
    </div>
  );
}

export default LoginForm;
