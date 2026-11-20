'use client';
import { useCallback, useEffect, useState } from 'react';
/** Seconds-remaining timer for "Resend code" buttons. `start()` (re)starts it. */
export function useCountdown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [left]);
  const start = useCallback((s = 60) => setLeft(s), []);
  return { left, start };
}
