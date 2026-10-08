'use client';

import React from 'react';

export type InputVariant = 'underline' | 'outline' | 'floating';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  /** แสดงข้อความ `error` เป็น placeholder สีแดงในช่องกรอกแทนที่จะแสดงเป็นข้อความใต้ช่อง */
  errorAsPlaceholder?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'outline',
      label,
      error,
      errorAsPlaceholder = false,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      id,
      placeholder,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    // ข้อความ error แสดงแทน placeholder ได้เมื่อช่องนั้นว่าง (ค่าจะถูกล้างโดย LoginForm)
    const errorPlaceholder = errorAsPlaceholder ? error || '' : '';
    const effectivePlaceholder = errorPlaceholder || placeholder;
    const placeholderColor = errorPlaceholder
      ? 'placeholder-red-500'
      : 'placeholder-slate-400';

    // Google / Material Design Outlined Floating Label Variant
    if (variant === 'floating') {
      const floatingLabelText = label || placeholder;
      const hasValue = Boolean(
        props.value !== undefined && props.value !== null && String(props.value).length > 0
      );

      return (
        <div className={`relative w-full ${containerClassName}`}>
          <div className="relative flex items-center">
            {leftIcon && (
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                {leftIcon}
              </span>
            )}
            <input
              ref={ref}
              id={inputId}
              placeholder=" "
              className={`peer w-full rounded-md bg-white border text-slate-900 text-sm sm:text-[15px] transition-colors duration-150 focus:outline-none ${
                leftIcon ? 'pl-10' : 'pl-3.5'
              } ${rightIcon ? 'pr-11' : 'pr-3.5'} py-3.5 sm:py-3.5 ${
                error
                  ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                  : 'border-black hover:border-black focus:border-[#800020] focus:ring-1 focus:ring-[#800020]'
              } ${className}`}
              {...props}
            />
            {floatingLabelText && (
              <label
                htmlFor={inputId}
                className={`absolute transition-all duration-200 pointer-events-none select-none bg-white px-1.5 z-10 rounded-xs ${
                  leftIcon ? 'left-9' : 'left-3'
                } ${
                  error
                    ? 'text-red-500 peer-focus:text-red-500'
                    : 'text-slate-600 peer-focus:text-[#800020] peer-focus:font-semibold'
                } ${
                  hasValue
                    ? 'top-0 -translate-y-1/2 text-xs font-semibold'
                    : 'top-1/2 -translate-y-1/2 text-sm sm:text-[15px] peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold'
                }`}
              >
                {floatingLabelText}
              </label>
            )}
            {rightIcon && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 shrink-0 z-10">
                {rightIcon}
              </span>
            )}
          </div>
          {error && !errorAsPlaceholder && (
            <p className="absolute top-full left-1 mt-1 text-xs text-red-600 font-medium select-none pointer-events-none whitespace-nowrap">
              {error}
            </p>
          )}
          {!error && helperText && (
            <p className="text-xs text-slate-500 pt-1.5 pl-1">{helperText}</p>
          )}
        </div>
      );
    }

    if (variant === 'underline') {
      return (
        <div className={`space-y-1 w-full ${containerClassName}`}>
          {label && (
            <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
              {label}
            </label>
          )}
          <div
            className={`relative border-b-2 transition-colors flex items-center ${
              error
                ? 'border-red-500'
                : 'border-slate-300 focus-within:border-black'
            }`}
          >
            {leftIcon && <span className="pr-2 text-slate-400 shrink-0">{leftIcon}</span>}
            <input
              ref={ref}
              id={inputId}
              placeholder={effectivePlaceholder}
              className={`w-full py-2.5 sm:py-3 bg-transparent text-slate-900 ${placeholderColor} text-sm sm:text-[15px] focus:outline-none ${
                leftIcon ? 'pl-1' : 'px-1'
              } ${rightIcon ? 'pr-10' : ''} ${className}`}
              {...props}
            />
            {rightIcon && <span className="absolute right-1 shrink-0">{rightIcon}</span>}
          </div>
          {error && !errorAsPlaceholder && <p className="text-xs text-red-600 pt-0.5">{error}</p>}
          {!error && helperText && <p className="text-xs text-slate-400 pt-0.5">{helperText}</p>}
        </div>
      );
    }

    // Default 'outline' variant
    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            placeholder={effectivePlaceholder}
            className={`w-full rounded-sm bg-slate-50 border text-slate-900 ${placeholderColor} text-xs sm:text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 shrink-0">
              {rightIcon}
            </span>
          )}
        </div>
        {error && !errorAsPlaceholder && <p className="text-xs text-red-600 pt-0.5">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-400 pt-0.5">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
