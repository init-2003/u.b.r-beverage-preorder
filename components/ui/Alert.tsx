'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, { container: string; iconColor: string; defaultIcon: React.ReactNode }> = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-700',
    iconColor: 'text-red-500',
    defaultIcon: <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconColor: 'text-emerald-600',
    defaultIcon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    iconColor: 'text-amber-600',
    defaultIcon: <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />,
  },
  info: {
    container: 'bg-sky-50 border-sky-200 text-sky-800',
    iconColor: 'text-sky-600',
    defaultIcon: <Info className="w-4 h-4 shrink-0 text-sky-600" />,
  },
};

export function Alert({
  variant = 'error',
  title,
  icon,
  className = '',
  children,
  ...props
}: AlertProps) {
  const current = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-sm border text-xs sm:text-sm flex items-start gap-2.5 leading-snug ${current.container} ${className}`.trim()}
      {...props}
    >
      <span className="mt-0.5">{icon || current.defaultIcon}</span>
      <div className="space-y-0.5 min-w-0">
        {title && <h5 className="font-bold">{title}</h5>}
        {children && <div className="text-xs leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

export default Alert;
