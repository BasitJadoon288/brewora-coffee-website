'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth';
import { api } from './api';
interface Ctx { ids: Set<string>; has(id: string): boolean; toggle(id: string): Promise<'added' | 'removed' | 'login'> }
const WCtx = createContext<Ctx>(null as unknown as Ctx);
export const useWishlist = () => useContext(WCtx);
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => { if (!user) { setIds(new Set()); return; } api<{ products: { id: string }[] }>('/wishlist').then(w => setIds(new Set(w.products.map(p => p.id)))).catch(() => undefined); }, [user]);
  const toggle = useCallback(async (id: string) => {
    if (!user) return 'login' as const;
    if (ids.has(id)) { await api(`/wishlist/${id}`, { method: 'DELETE' }); setIds(s => { const n = new Set(s); n.delete(id); return n; }); return 'removed' as const; }
    await api(`/wishlist/${id}`, { method: 'POST' }); setIds(s => new Set(s).add(id)); return 'added' as const;
  }, [user, ids]);
  const value = useMemo(() => ({ ids, has: (id: string) => ids.has(id), toggle }), [ids, toggle]);
  return <WCtx.Provider value={value}>{children}</WCtx.Provider>;
}
