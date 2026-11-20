'use client';
import { useEffect, useRef } from 'react';

/** 6-box one-time-code input: auto-advance, backspace navigation, paste of the whole code, numeric keypad on mobile, OS/browser autofill. */
export default function OtpInput({ value, onChange, onComplete, disabled, autoFocus = true, length = 6, invalid }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; disabled?: boolean; autoFocus?: boolean; length?: number; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { if (autoFocus) refs.current[0]?.focus(); }, [autoFocus]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const commit = (next: string) => { const v = next.replace(/\D/g, '').slice(0, length); onChange(v); if (v.length === length) onComplete?.(v); return v; };
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  return <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="6-digit verification code">
    {digits.map((d, i) => <input key={i} ref={el => { refs.current[i] = el; }} value={d} disabled={disabled} inputMode="numeric" pattern="[0-9]*" maxLength={i === 0 ? length : 1} // first box accepts a whole autofilled/pasted code
      autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Digit ${i + 1}`} aria-invalid={invalid || undefined}
      className={`h-12 w-10 rounded-lg border bg-white text-center text-xl font-semibold text-espresso outline-none transition focus:border-caramel focus:ring-2 focus:ring-caramel/30 disabled:opacity-60 sm:h-14 sm:w-12 sm:text-2xl ${invalid ? 'border-red-500' : 'border-espresso/20'}`}
      onFocus={e => e.target.select()}
      onChange={e => { const c = e.target.value.replace(/\D/g, ''); if (!c) return; if (c.length > 1) { const v = commit(value.slice(0, i) + c); focus(v.length >= length ? length - 1 : v.length); return; } commit(value.slice(0, i) + c + value.slice(i + 1)); focus(i + 1 < length ? i + 1 : length - 1); }}
      onKeyDown={e => {
        if (e.key === 'Backspace') { e.preventDefault(); if (d) onChange(value.slice(0, i) + value.slice(i + 1)); else if (i > 0) { onChange(value.slice(0, i - 1) + value.slice(i)); focus(i - 1); } }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1); }
      }}
      onPaste={e => { e.preventDefault(); const v = commit(e.clipboardData.getData('text')); focus(v.length >= length ? length - 1 : v.length); }} />)}
  </div>;
}
