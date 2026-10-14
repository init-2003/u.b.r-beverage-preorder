'use client';

import React, { useState, useEffect } from 'react';

export interface QuantityInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  className = '',
  onFocus,
  ...props
}: QuantityInputProps) {
  const [text, setText] = useState<string>(String(value ?? min));

  useEffect(() => {
    setText(String(value ?? min));
  }, [value, min]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setText(raw);
    if (raw !== '') {
      let num = parseInt(raw, 10);
      if (max != null && num > max) num = max;
      if (num >= min) {
        onChange(num);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (text === '' || isNaN(parseInt(text, 10)) || parseInt(text, 10) < min) {
      setText(String(min));
      onChange(min);
    } else {
      let num = parseInt(text, 10);
      if (max != null && num > max) num = max;
      setText(String(num));
      onChange(num);
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // ไม่คลุมดำ/ไฮไลท์ (ไม่เรียก e.target.select()) ให้ขึ้นเคอร์เซอร์ | ทันที
    const len = e.target.value.length;
    try {
      e.target.setSelectionRange(len, len);
    } catch {}
    if (onFocus) {
      onFocus(e);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className={`text-center outline-none text-base sm:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`.trim()}
      {...props}
    />
  );
}

export default QuantityInput;
