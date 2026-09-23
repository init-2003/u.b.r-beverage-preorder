'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'yellow' | 'primary' | 'outline' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  yellow: 'bg-[#ffd200] hover:bg-[#ffc800] active:bg-[#f0be00] text-slate-950 font-bold shadow-xs hover:shadow',
  primary: 'bg-[#c81415] hover:bg-[#b01011] active:bg-[#960d0e] text-white font-bold shadow-xs hover:shadow',
  outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold border border-slate-300 shadow-2xs',
  secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900',
  danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'py-2 px-4 text-xs rounded-full',
  md: 'py-2.5 px-5 text-sm rounded-full',
  lg: 'py-3.5 px-6 text-base rounded-full',
  icon: 'p-2 rounded-full flex items-center justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
    const variantClass = variantStyles[variant];
    const sizeClass = sizeStyles[size];
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
