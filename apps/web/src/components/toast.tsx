'use client';
import { createContext, useCallback, useContext, useState } from 'react';
type T = { id: number; msg: string; kind: 'ok' | 'err' };
const Ctx = createContext<(msg: string, kind?: 'ok' | 'err') => void>(() => undefined);
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random(); setItems(x => [...x, { id, msg, kind }]); setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 4000);
  }, []);
  return <Ctx.Provider value={push}>{children}
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {items.map(i => <div key={i.id} className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm shadow-soft ${i.kind === 'ok' ? 'bg-espresso text-cream' : 'bg-red-700 text-white'}`}>{i.msg}</div>)}
    </div></Ctx.Provider>;
}
