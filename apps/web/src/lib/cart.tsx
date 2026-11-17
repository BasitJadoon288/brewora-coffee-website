'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth';
import { api } from './api';
import { addLine, CartLine, countOf, lineKey, parseStored, removeLine, setQuantity, subTotalOf, toQuoteItems } from './cart-logic';

const KEY = 'brewora_cart';
interface CartCtx { lines: CartLine[]; count: number; subTotal: number; loading: boolean; add(l: Omit<CartLine, 'key' | 'id'>): Promise<void>; setQty(l: CartLine, q: number): Promise<void>; remove(l: CartLine): Promise<void>; clearLocal(): void; refresh(): Promise<void> }
const Ctx = createContext<CartCtx>(null as unknown as CartCtx);
export const useCart = () => useContext(Ctx);
const toLine = (i: any): CartLine => ({ key: lineKey(i.productId, i.variant), id: i.id, productId: i.productId, variant: i.variant || undefined, quantity: i.quantity, name: i.name ?? 'Unavailable product', slug: i.slug ?? '', image: i.image, unitPrice: i.unitPrice, available: i.available, stockQuantity: i.stockQuantity });

/** Guests: localStorage. Signed-in customers: server cart. Guest items are merged on login. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth(); const authed = !!user;
  const [guest, setGuest] = useState<CartLine[]>([]); const [server, setServer] = useState<CartLine[]>([]); const [loading, setLoading] = useState(true);
  const persist = (l: CartLine[]) => { setGuest(l); try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* storage unavailable */ } };
  useEffect(() => { try { setGuest(parseStored(localStorage.getItem(KEY))); } catch { /* ignore */ } }, []);
  const refresh = useCallback(async () => { if (authed) setServer(((await api('/cart')).items as any[]).map(toLine)); }, [authed]);
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoading(true);
      try {
        if (authed) {
          const g = parseStored(localStorage.getItem(KEY));
          if (g.length) { await api('/cart/merge', { method: 'POST', body: { items: toQuoteItems(g) } }); localStorage.removeItem(KEY); setGuest([]); }
          await refresh();
        } else setServer([]);
      } catch { /* cart stays as-is */ } finally { setLoading(false); }
    })();
  }, [authed, authLoading, refresh]);

  const lines = authed ? server : guest;
  const value = useMemo<CartCtx>(() => ({
    lines, count: countOf(lines), subTotal: subTotalOf(lines), loading,
    add: async l => { if (authed) setServer((((await api('/cart/items', { method: 'POST', body: { productId: l.productId, variant: l.variant, quantity: l.quantity } })).items) as any[]).map(toLine)); else persist(addLine(guest, l)); },
    setQty: async (l, q) => { if (authed) setServer((((await api(`/cart/items/${l.id}`, { method: 'PUT', body: { quantity: q } })).items) as any[]).map(toLine)); else persist(setQuantity(guest, l.key, q)); },
    remove: async l => { if (authed) setServer((((await api(`/cart/items/${l.id}`, { method: 'DELETE' })).items) as any[]).map(toLine)); else persist(removeLine(guest, l.key)); },
    clearLocal: () => persist([]), refresh,
  }), [lines, loading, authed, guest, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
