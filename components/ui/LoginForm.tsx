'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Alert } from './Alert';
import { BouncingDots } from '@/components/loading-ui/bouncing-dots';

export interface LoginFormProps {
  onSuccess?: (customer?: any) => void;
  showSupportNote?: boolean;
  autoFocus?: boolean;
  className?: string;
  onGlobalError?: (error: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const REMEMBER_ME_STORAGE_KEY = 'ubr_remember_me';
const SAVED_USERNAME_STORAGE_KEY = 'ubr_saved_username';

export function LoginForm({
  onSuccess,
  showSupportNote = true,
  autoFocus = true,
  className = '',
  onGlobalError,
  onLoadingChange,
}: LoginFormProps) {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Error แสดงเป็น placeholder ในช่องกรอกที่กรอกผิด (username/password)
  // ส่วน error ที่ไม่เกี่ยวกับช่องใดช่องหนึ่ง (เช่น ขัดข้อง) ยังแสดงเป็น Alert ด้านบน
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRememberTooltip, setShowRememberTooltip] = useState(false);

  React.useEffect(() => {
    try {
      const savedRemember = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
      const savedUser = localStorage.getItem(SAVED_USERNAME_STORAGE_KEY);

      // ครั้งแรก (savedRemember ยังเป็น null): ไม่ติ๊ก (false)
      // ถ้าเคยติ๊กแล้ว ('true'): จำว่าติ๊กต่อไป และใส่ชื่อผู้ใช้ที่บันทึกไว้
      // ถ้าเคยกดติ๊กออก ('false'): จำว่าไม่ติ๊ก (false)
      if (savedRemember === 'true') {
        setRememberMe(true);
        if (savedUser) {
          setUsername(savedUser);
        }
      } else {
        setRememberMe(false);
      }
    } catch {}
  }, []);

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    try {
      localStorage.setItem(REMEMBER_ME_STORAGE_KEY, checked ? 'true' : 'false');
      if (!checked) {
        localStorage.removeItem(SAVED_USERNAME_STORAGE_KEY);
      }
    } catch {}
  };

  // จำแนกข้อความ error จากเซิร์ฟเวอร์ว่าควรไปแสดงที่ช่องไหน
  // - มีคำว่า "รหัสผ่าน"  -> placeholder ของช่องรหัสผ่าน
  // - มีคำว่า "ยูสเซอร์" / "บัญชีลูกค้า" / "รหัสลูกค้า" -> placeholder ของช่องรหัสลูกค้า
  // - อื่น ๆ -> Alert ด้านบนฟอร์ม
  const applyError = (message: string) => {
    if (message.includes('รหัสผ่าน')) {
      setPasswordError(message);
      setPassword('');
    } else if (
      message.includes('ยูสเซอร์') ||
      message.includes('บัญชีลูกค้า') ||
      message.includes('รหัสลูกค้า')
    ) {
      setUsernameError(message);
      setUsername('');
    } else {
      if (onGlobalError) {
        onGlobalError(message);
      } else {
        setFormError(message);
      }
    }
  };

  const clearErrors = () => {
    setUsernameError('');
    setPasswordError('');
    setFormError('');
    if (onGlobalError) {
      onGlobalError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!username.trim()) {
      setUsernameError('กรุณากรอกรหัสลูกค้า');
      return;
    }

    if (!password.trim()) {
      setPasswordError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);

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
        applyError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        setLoading(false);
        onLoadingChange?.(false);
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
      // คงสถานะ loading ไว้ต่อเนื่องขณะกำลัง redirect ไปหน้าเป้าหมาย
    } catch {
      const errMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      if (onGlobalError) {
        onGlobalError(errMsg);
      } else {
        setFormError(errMsg);
      }
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Error Alert — ใช้เฉพาะกรณีที่ไม่ได้ส่งออกไปแสดงนอก card */}
      {!onGlobalError && formError && (
        <Alert variant="error" className="mb-5">
          {formError}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-6.5">
        {/* Field 1: Cus_User */}
        <Input
          variant="floating"
          type="text"
          label="รหัสลูกค้า"
          error={usernameError}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (usernameError) setUsernameError('');
            if (formError) setFormError('');
            if (onGlobalError) onGlobalError('');
          }}
          autoFocus={autoFocus}
        />

        {/* Field 2: Password (Cus_SPass) */}
        <Input
          variant="floating"
          type={showPassword ? 'text' : 'password'}
          label="รหัสผ่าน"
          error={passwordError}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError('');
            if (formError) setFormError('');
            if (onGlobalError) onGlobalError('');
          }}
        />

        {/* Checkbox Options: แสดงรหัสผ่าน & จดจำการเข้าสู่ระบบ */}
        <div className="space-y-2.5 sm:space-y-3 pt-0.5">
          {/* Checkbox 1: แสดงรหัสผ่าน (Show Password Option) */}
          <div className="flex items-center">
            <label
              htmlFor="show-password-checkbox"
              className="group inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-[13px] text-slate-700 hover:text-slate-900 transition-colors"
            >
              <input
                type="checkbox"
                id="show-password-checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="sr-only peer"
              />
              <span
                className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#800020] peer-focus-visible:ring-offset-1 ${
                  showPassword
                    ? 'bg-[#800020] border-[#800020] text-white shadow-2xs'
                    : 'bg-white border-black group-hover:border-[#800020]'
                }`}
              >
                {showPassword && (
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
              <span>แสดงรหัสผ่าน</span>
            </label>
          </div>

          {/* Checkbox 2: จดจำการเข้าสู่ระบบ (Remember Me Option) */}
          <div className="flex items-center gap-1.5 relative">
            <label
              htmlFor="remember-me-checkbox"
              className="group inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-[13px] text-slate-700 hover:text-slate-900 transition-colors"
            >
              <input
                type="checkbox"
                id="remember-me-checkbox"
                checked={rememberMe}
                onChange={(e) => handleRememberMeChange(e.target.checked)}
                className="sr-only peer"
              />
              <span
                className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#800020] peer-focus-visible:ring-offset-1 ${
                  rememberMe
                    ? 'bg-[#800020] border-[#800020] text-white shadow-2xs'
                    : 'bg-white border-black group-hover:border-[#800020]'
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
              <span>จดจำการเข้าสู่ระบบ</span>
            </label>

            {/* Question Mark Tooltip Trigger */}
            <div className="relative inline-flex items-center group/tip">
              <button
                type="button"
                onClick={() => setShowRememberTooltip(!showRememberTooltip)}
                onBlur={() => setShowRememberTooltip(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer focus:outline-none flex items-center justify-center"
                title="คำอธิบายการจดจำการเข้าสู่ระบบ"
                aria-label="คำอธิบายการจดจำการเข้าสู่ระบบ"
              >
                <HelpCircle className="w-3.5 h-3.5 stroke-[1.8]" />
              </button>

              {/* Tooltip Popover */}
              <div
                className={`absolute left-1/2 -translate-x-6 top-full mt-2 w-64 sm:w-72 bg-white border border-slate-200/90 rounded-sm shadow-xl p-3 z-50 text-[11.5px] sm:text-xs text-slate-700 leading-relaxed text-left transition-all duration-150 ${
                  showRememberTooltip
                    ? 'opacity-100 visible pointer-events-auto'
                    : 'opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible pointer-events-none group-hover/tip:pointer-events-auto'
                }`}
              >
                {/* Arrow pointing up directly below ? icon */}
                <div className="absolute -top-1.5 left-6 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-200/90 rotate-45 shadow-[-2px_-2px_4px_rgba(0,0,0,0.02)]" />

                <p className="relative z-10 font-normal">
                  ระบบจะคงสถานะการเข้าสู่ระบบของคุณบนเว็บไซต์ไว้ แม้จะกดปิดหน้านี้แล้ว โปรดหลีกเลี่ยงการเลือกตัวเลือกนี้ หากคุณกำลังใช้อุปกรณ์สาธารณะหรือใช้อุปกรณ์ร่วมกับผู้อื่น
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Care / Support Note */}
        {showSupportNote && (
          <p className="text-[11.5px] sm:text-xs text-slate-500 leading-relaxed text-left pt-2 sm:pt-3">
            สำหรับลูกค้า หจก.อุบลรุ่งเรืองเบฟเวอเรจ สามารถใช้รหัสลูกค้า{' '}
            <span className="whitespace-nowrap">และรหัสผ่าน</span>
            <br className="hidden sm:inline" />{' '}
            <span className="whitespace-nowrap">ในการเข้าสู่ระบบ</span>{' '}
            ติดต่อสอบถามเพิ่มเติมได้ที่แผนกลูกค้าสัมพันธ์{' '}
            <span className="font-semibold text-slate-700 whitespace-nowrap">045-245-888</span>
          </p>
        )}

        {/* Full Width Primary Brand Red Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={loading}
          className="py-4 text-base font-bold shadow-xs hover:shadow tracking-wide min-h-[54px] sm:min-h-[58px] flex items-center justify-center"
        >
          {loading ? (
            <BouncingDots className="w-10 text-white" />
          ) : (
            'เข้าสู่ระบบ'
          )}
        </Button>
      </form>
    </div>
  );
}

export default LoginForm;
