'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth';
import CartSummary from '@/components/CartSummary';
import { useToast } from '@/components/toast';
import { Empty, Field, Loading } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { toQuoteItems } from '@/lib/cart-logic';
import type { Address, DeliveryArea, Order, PaymentMethod, PublicSettings } from '@/lib/types';
import { money } from '@/lib/types';
import { getCoupon, PHONE_RE, postForm, setCouponStore, uuid } from '@/lib/util';
import { useQuote } from '@/lib/useQuote';
const METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'COD', label: 'Cash on Delivery', hint: 'Pay in cash when your order arrives.' }, { id: 'BankTransfer', label: 'Bank Transfer', hint: 'Transfer to our account, then submit your reference.' },
  { id: 'JazzCash', label: 'JazzCash', hint: 'Pay securely with your JazzCash account.' }, { id: 'EasyPaisa', label: 'EasyPaisa', hint: 'Pay securely with your EasyPaisa account.' }];
export default function Checkout() {
  const { user } = useAuth(); const { lines, loading, clearLocal, refresh } = useCart(); const router = useRouter(); const toast = useToast();
  const [coupon, setCoupon] = useState(''); useEffect(() => setCoupon(getCoupon()), []);
  const [areaId, setAreaId] = useState('');
  const { data: q, error } = useQuote(lines, coupon, areaId);
  const { data: areas } = useQuery({ queryKey: ['delivery-areas'], queryFn: () => api<DeliveryArea[]>('/delivery-areas') });
  const hasAreas = !!areas?.length; const area = areas?.find(a => a.id === areaId);
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api<PublicSettings>('/settings/public') });
  const { data: addresses } = useQuery({ queryKey: ['addresses'], enabled: !!user, queryFn: () => api<Address[]>('/addresses') });
  const [v, setV] = useState({ fullName: '', email: '', phone: '', line1: '', city: '', postalCode: '', notes: '' }); const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const idem = useRef(uuid());
  useEffect(() => { if (user) setV(x => ({ ...x, fullName: x.fullName || user.fullName, email: x.email || user.email, phone: x.phone || user.phoneNumber || '' })); }, [user]);
  useEffect(() => { const d = addresses?.find(a => a.isDefault) ?? addresses?.[0]; if (d) useAddress(d); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [addresses]);
  const enabled = METHODS.filter(m => settings?.paymentMethods?.[m.id]); useEffect(() => { if (!method && enabled.length) setMethod(enabled[0].id); }, [enabled, method]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  function useAddress(a: Address) { setV(x => ({ ...x, fullName: a.fullName, phone: a.phone, line1: a.line1, city: a.city, postalCode: a.postalCode ?? '' })); }
  async function place(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!PHONE_RE.test(v.phone)) return setErr('Enter a valid Pakistani mobile number, e.g. 03001234567');
    if (hasAreas && !areaId) return setErr('Select your delivery area');
    if (!method) return setErr('Select a payment method');
    setBusy(true);
    try {
      const r = await api<{ order: Order }>('/orders', { method: 'POST', body: { items: toQuoteItems(lines), couponCode: coupon || undefined, areaId: areaId || undefined, idempotencyKey: idem.current, paymentMethod: method,
        customer: { fullName: v.fullName, email: v.email, phone: v.phone, notes: v.notes || undefined }, shippingAddress: { line1: v.line1, city: hasAreas ? (area?.city ?? 'Karachi') : v.city, postalCode: v.postalCode || undefined } } });
      try { sessionStorage.setItem('brewora_last_order', JSON.stringify(r.order)); } catch { /* ignore */ }
      clearLocal(); setCouponStore(''); await refresh().catch(() => undefined);
      if (method === 'JazzCash' || method === 'EasyPaisa') {
        try { const init = await api<{ url: string; fields: Record<string, string> }>(`/payments/${r.order.id}/initiate?email=${encodeURIComponent(v.email)}`, { method: 'POST' }); postForm(init.url, init.fields); return; }
        catch (x) { toast(x instanceof ApiError ? x.message : 'Online payment is unavailable right now', 'err'); }
      }
      router.push(`/order-confirmation/${r.order.id}`);
    } catch (x) {
      idem.current = uuid();
      setErr(x instanceof ApiError ? (x.errors ? Object.values(x.errors).flat()[0] ?? x.message : x.message) : 'Could not place your order');
    } finally { setBusy(false); }
  }
  if (loading) return <Loading />;
  if (lines.length === 0) return <div className="container-x py-16"><Empty title="Your cart is empty"><Link href="/shop" className="btn-gold">Continue shopping</Link></Empty></div>;
  return <div className="container-x py-10"><h1 className="font-display text-4xl text-espresso">Checkout</h1>
    {!user && <p className="mt-2 text-sm text-charcoal/70">Have an account? <Link href="/login?next=/checkout" className="font-semibold text-caramel underline">Sign in</Link> for faster checkout.</p>}
    <form onSubmit={place} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]" noValidate><div className="space-y-6">
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-soft"><h2 className="font-display text-xl text-espresso">Delivery details</h2>
        {addresses && addresses.length > 0 && <Field label="Saved addresses" htmlFor="sa"><select id="sa" className="input" onChange={e => { const a = addresses.find(x => x.id === e.target.value); if (a) useAddress(a); }} defaultValue={(addresses.find(a => a.isDefault) ?? addresses[0]).id}>{addresses.map(a => <option key={a.id} value={a.id}>{a.label} — {a.line1}, {a.city}</option>)}</select></Field>}
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" htmlFor="fn"><input id="fn" className="input" autoComplete="name" value={v.fullName} onChange={set('fullName')} required /></Field>
          <Field label="Email" htmlFor="em"><input id="em" type="email" className="input" autoComplete="email" value={v.email} onChange={set('email')} required /></Field></div>
        <Field label="Phone number" htmlFor="ph" hint="e.g. 03001234567"><input id="ph" className="input" autoComplete="tel" value={v.phone} onChange={set('phone')} required /></Field>
        <Field label="Complete address" htmlFor="ad"><input id="ad" className="input" autoComplete="street-address" value={v.line1} onChange={set('line1')} required minLength={5} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">{hasAreas ? <Field label="Delivery area" htmlFor="ar" hint={area ? `Delivery charge: ${area.charge ? money(area.charge) : 'Free'}` : 'Delivery charge depends on your area'}><select id="ar" className="input" value={areaId} onChange={e => setAreaId(e.target.value)} required><option value="">Select your area…</option>{areas!.map(a => <option key={a.id} value={a.id}>{a.name}{a.city ? `, ${a.city}` : ''} — {a.charge ? money(a.charge) : 'Free'}</option>)}</select></Field>
          : <Field label="City" htmlFor="ct"><input id="ct" className="input" autoComplete="address-level2" value={v.city} onChange={set('city')} required /></Field>}<Field label="Postal code" htmlFor="pc"><input id="pc" className="input" autoComplete="postal-code" value={v.postalCode} onChange={set('postalCode')} /></Field></div>
        <Field label="Order notes (optional)" htmlFor="nt"><textarea id="nt" className="input min-h-20" maxLength={500} value={v.notes} onChange={set('notes')} /></Field></section>
      <section className="rounded-2xl bg-white p-6 shadow-soft"><h2 className="font-display text-xl text-espresso">Payment method</h2>
        {enabled.length === 0 ? <p className="mt-3 text-sm text-red-700">No payment methods are available right now.</p> : <div className="mt-4 space-y-3" role="radiogroup" aria-label="Payment method">{enabled.map(m => <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${method === m.id ? 'border-espresso bg-espresso/5' : 'border-espresso/15'}`}>
          <input type="radio" name="pm" className="mt-1 accent-[#3B2418]" checked={method === m.id} onChange={() => setMethod(m.id)} /><span><span className="block font-semibold">{m.label}</span><span className="text-sm text-charcoal/60">{m.hint}</span></span></label>)}</div>}</section></div>
      <aside className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-soft"><h2 className="font-display text-xl text-espresso">Your order</h2>
        <ul className="space-y-2 text-sm">{lines.map(l => <li key={l.key} className="flex justify-between gap-2"><span>{l.name}{l.variant && ` (${l.variant})`} × {l.quantity}</span><span>{money(l.unitPrice * l.quantity)}</span></li>)}</ul>
        {q ? <CartSummary q={q} /> : error ? <p role="alert" className="text-sm text-red-700">{error instanceof ApiError ? error.message : 'Could not calculate totals'} <Link href="/cart" className="underline">Back to cart</Link></p> : <p className="text-sm text-charcoal/60">Calculating…</p>}
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button disabled={busy || !q || !method || (hasAreas && !areaId)} className="btn-gold w-full disabled:opacity-50">{busy ? 'Placing order…' : method === 'JazzCash' || method === 'EasyPaisa' ? 'Place order & pay' : 'Place order'}</button>
        <p className="text-center text-xs text-charcoal/50">Prices are confirmed by our server when you place the order.</p></aside></form></div>;
}
