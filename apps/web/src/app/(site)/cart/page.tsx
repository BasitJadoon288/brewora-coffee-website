'use client';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import CartSummary from '@/components/CartSummary';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/toast';
import { Empty, Loading } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { CartLine, toQuoteItems } from '@/lib/cart-logic';
import { money } from '@/lib/types';
import { getCoupon, setCouponStore } from '@/lib/util';
import { useQuote } from '@/lib/useQuote';
export default function CartPage() {
  const { lines, loading, setQty, remove } = useCart(); const toast = useToast();
  const [coupon, setCoupon] = useState(''); const [code, setCode] = useState(''); const [cerr, setCerr] = useState('');
  useEffect(() => { const c = getCoupon(); setCoupon(c); setCode(c); }, []);
  const { data: q, error, isFetching } = useQuote(lines, coupon);
  async function act(fn: () => Promise<void>) { try { await fn(); } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not update cart', 'err'); } }
  async function apply(e: React.FormEvent) {
    e.preventDefault(); setCerr(''); const c = code.trim().toUpperCase();
    if (!c) { setCoupon(''); setCouponStore(''); return; }
    try { await api('/cart/quote', { method: 'POST', body: { items: toQuoteItems(lines), couponCode: c } }); setCoupon(c); setCouponStore(c); toast('Coupon applied'); }
    catch (x) { setCerr(x instanceof ApiError ? x.message : 'Could not apply coupon'); }
  }
  if (loading) return <Loading />;
  if (lines.length === 0) return <div className="container-x py-16"><Empty title="Your cart is empty" text="Add some coffee to get started."><Link href="/shop" className="btn-gold">Continue shopping</Link></Empty></div>;
  const unavailable = lines.some((l: CartLine) => l.available === false); const blocked = !!error || !q || unavailable;
  return <div className="container-x py-10"><h1 className="font-display text-4xl text-espresso">Shopping cart</h1>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-4">{lines.map(l => <li key={l.key} className="flex gap-4 rounded-2xl bg-white p-4 shadow-soft"><ProductImage src={l.image} alt={l.name} className="h-24 w-24 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1"><Link href={l.slug ? `/product/${l.slug}` : '#'} className="font-display text-lg text-espresso hover:underline">{l.name}</Link>{l.variant && <p className="text-sm text-charcoal/60">{l.variant}</p>}
          {l.available === false && <p role="alert" className="text-sm text-red-700">Not enough stock — reduce quantity or remove.</p>}<p className="mt-1 text-sm">{money(l.unitPrice)}</p>
          <div className="mt-2 flex items-center gap-4"><div className="flex items-center rounded-full border border-espresso/20"><button aria-label={`Decrease ${l.name}`} className="p-2 disabled:opacity-40" disabled={l.quantity <= 1} onClick={() => act(() => setQty(l, l.quantity - 1))}><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center text-sm" aria-live="polite">{l.quantity}</span><button aria-label={`Increase ${l.name}`} className="p-2" onClick={() => act(() => setQty(l, l.quantity + 1))}><Plus className="h-4 w-4" /></button></div>
            <button onClick={() => act(() => remove(l))} className="flex items-center gap-1 text-sm text-red-700 hover:underline"><Trash2 className="h-4 w-4" aria-hidden />Remove</button></div></div>
        <p className="font-semibold text-espresso">{money(l.unitPrice * l.quantity)}</p></li>)}</ul>
      <aside className="h-fit space-y-5 rounded-2xl bg-white p-6 shadow-soft"><h2 className="font-display text-xl text-espresso">Order summary</h2>
        <form onSubmit={apply} className="flex gap-2"><label htmlFor="cc" className="sr-only">Coupon code</label><input id="cc" className="input" placeholder="Coupon code" value={code} onChange={e => setCode(e.target.value)} /><button className="btn-dark px-4">Apply</button></form>
        {cerr && <p role="alert" className="text-sm text-red-700">{cerr}</p>}
        {q ? <CartSummary q={q} /> : error ? <p role="alert" className="text-sm text-red-700">{error instanceof ApiError ? error.message : 'Could not calculate totals'}</p> : <p className="text-sm text-charcoal/60">{isFetching ? 'Calculating…' : ''}</p>}
        {blocked ? <button disabled className="btn-gold w-full opacity-50">Proceed to checkout</button> : <Link href="/checkout" className="btn-gold w-full">Proceed to checkout</Link>}
        <Link href="/shop" className="block text-center text-sm text-espresso underline">Continue shopping</Link></aside></div></div>;
}
