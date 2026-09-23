'use client';

import React from 'react';

export type InputVariant = 'underline' | 'outline';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  label?: string;
  error?: string;
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
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
              className={`w-full py-2.5 sm:py-3 bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-[15px] focus:outline-none ${
                leftIcon ? 'pl-1' : 'px-1'
              } ${rightIcon ? 'pr-10' : ''} ${className}`}
              {...props}
            />
            {rightIcon && <span className="absolute right-1 shrink-0">{rightIcon}</span>}
          </div>
          {error && <p className="text-xs text-red-600 pt-0.5">{error}</p>}
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
            className={`w-full rounded-sm bg-slate-50 border text-slate-900 placeholder-slate-400 text-xs sm:text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-slate-800 focus:ring-slate-800/10'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 shrink-0">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-600 pt-0.5">{error}</p>}
        {!error && helperText && <p className="text-[11px] text-slate-400 pt-0.5">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
