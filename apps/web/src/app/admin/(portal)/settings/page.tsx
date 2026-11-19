'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/toast';
import { Field, Loading } from '@/components/ui';
import ImageField from '@/components/admin/ImageField';
import { Card, fieldErrors, PageTitle } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
type S = Record<string, any>;
export default function Settings() {
  const qc = useQueryClient(); const toast = useToast(); const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: () => api<S>('/admin/settings') });
  const [s, setS] = useState<S>({}); const [ready, setReady] = useState(false); const [errs, setErrs] = useState<Record<string, string[]>>({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setS(data); setReady(true); } }, [data]);
  if (!ready) return <Loading />;
  const top = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.type === 'number' ? e.target.value : e.target.value });
  const nested = (g: string, k: string, val: unknown) => setS({ ...s, [g]: { ...(s[g] ?? {}), [k]: val } }); const E = (k: string) => errs[k]?.[0];
  const text = (label: string, k: string, hint?: string, type = 'text') => <Field label={label} htmlFor={`s-${k}`} error={E(k)} hint={hint}><input id={`s-${k}`} type={type} step={type === 'number' ? 'any' : undefined} className="input" value={s[k] ?? ''} onChange={top(k)} /></Field>;
  const sub = (g: string, label: string, k: string) => <Field label={label} htmlFor={`s-${g}-${k}`}><input id={`s-${g}-${k}`} className="input" value={s[g]?.[k] ?? ''} onChange={e => nested(g, k, e.target.value)} /></Field>;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrs({});
    const body: S = { storeName: s.storeName, logo: s.logo ?? '', phone: s.phone ?? '', whatsapp: s.whatsapp ?? '', address: s.address ?? '', deliveryCharges: Number(s.deliveryCharges), freeDeliveryThreshold: Number(s.freeDeliveryThreshold), taxPercent: Number(s.taxPercent), currency: String(s.currency).toUpperCase(), lowStockThreshold: Number(s.lowStockThreshold),
      paymentMethods: s.paymentMethods, bank: Object.fromEntries(['bankName', 'accountTitle', 'accountNumber', 'iban', 'instructions'].map(k => [k, s.bank?.[k] ?? ''])), social: Object.fromEntries(['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'].map(k => [k, s.social?.[k] ?? ''])) };
    if (s.contactEmail) body.contactEmail = s.contactEmail;
    try { await api('/admin/settings', { method: 'PUT', body }); toast('Settings saved'); qc.invalidateQueries({ queryKey: ['admin-settings'] }); qc.invalidateQueries({ queryKey: ['settings'] }); }
    catch (x) { setErrs(fieldErrors(x)); toast(x instanceof ApiError ? x.message : 'Could not save', 'err'); } finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-6" noValidate><PageTitle title="Store settings" sub="Changes apply to the website immediately." />
    <Card title="Store"><div className="grid gap-4 md:grid-cols-2">{text('Store name', 'storeName')}{text('Contact email', 'contactEmail')}{text('Phone', 'phone')}{text('WhatsApp number', 'whatsapp')}<div className="md:col-span-2">{text('Business address', 'address')}</div>
      <div className="md:col-span-2"><ImageField label="Logo" value={s.logo ?? ''} onChange={v => setS({ ...s, logo: v })} folder="logo" spec="logo" /></div></div></Card>
    <Card title="Delivery, tax & currency"><div className="grid gap-4 md:grid-cols-3">{text('Delivery charges (Rs.)', 'deliveryCharges', undefined, 'number')}{text('Free delivery above (Rs.)', 'freeDeliveryThreshold', '0 = never free', 'number')}{text('Tax (%)', 'taxPercent', undefined, 'number')}{text('Currency code', 'currency', 'Prices are stored in PKR')}{text('Low-stock alert at or below', 'lowStockThreshold', undefined, 'number')}</div></Card>
    <Card title="Payment methods"><div className="space-y-2 text-sm">{(['COD', 'BankTransfer', 'JazzCash', 'EasyPaisa'] as const).map(m => <label key={m} className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[#C58B52]" checked={!!s.paymentMethods?.[m]} onChange={e => nested('paymentMethods', m, e.target.checked)} />{{ COD: 'Cash on Delivery', BankTransfer: 'Bank Transfer', JazzCash: 'JazzCash (needs merchant credentials on the server)', EasyPaisa: 'EasyPaisa (needs merchant credentials on the server)' }[m]}</label>)}</div>
      <p className="mt-3 text-xs text-charcoal/60">An online method that is enabled here but not configured on the server will leave the order pending and tell the customer payment is unavailable.</p></Card>
    <Card title="Bank transfer details (shown to customers)"><div className="grid gap-4 md:grid-cols-2">{sub('bank', 'Bank name', 'bankName')}{sub('bank', 'Account title', 'accountTitle')}{sub('bank', 'Account number', 'accountNumber')}{sub('bank', 'IBAN', 'iban')}<div className="md:col-span-2">{sub('bank', 'Instructions', 'instructions')}</div></div></Card>
    <Card title="Social media links"><div className="grid gap-4 md:grid-cols-2">{sub('social', 'Facebook URL', 'facebook')}{sub('social', 'Instagram URL', 'instagram')}{sub('social', 'Twitter / X URL', 'twitter')}{sub('social', 'TikTok URL', 'tiktok')}{sub('social', 'YouTube URL', 'youtube')}</div></Card>
    <button disabled={busy} className="btn-gold disabled:opacity-60">{busy ? 'Saving…' : 'Save settings'}</button></form>;
}
