'use client';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth';
import OrderSummary from '@/components/OrderSummary';
import { useToast } from '@/components/toast';
import { Field, Loading } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Order } from '@/lib/types';
import { postForm } from '@/lib/util';
type Bank = { bankName?: string; accountTitle?: string; accountNumber?: string; iban?: string; instructions?: string };
function Confirmation({ id }: { id: string }) {
  const { user, loading } = useAuth(); const toast = useToast(); const sp = useSearchParams(); const payment = sp.get('payment');
  const [o, setO] = useState<Order | null>(null); const [missing, setMissing] = useState(false); const [bank, setBank] = useState<Bank | null>(null); const [ref, setRef] = useState(''); const [sender, setSender] = useState(''); const [busy, setBusy] = useState(false);
  // Show the order saved at checkout straight away (no waiting for sign-in/network), then refresh it from the server when possible.
  const lastOrder = (): Order | null => { try { const s = JSON.parse(sessionStorage.getItem('brewora_last_order') ?? 'null'); return s?.id === id ? s : null; } catch { return null; } };
  useEffect(() => { const s = lastOrder(); if (s) setO(s); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loading) return;
    (async () => {
      try { if (user) { setO(await api<Order>(`/orders/${id}`)); return; } } catch { /* keep the order saved at checkout */ }
      if (!lastOrder()) setMissing(true);
    })();
  }, [loading, user, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (o?.paymentMethod === 'BankTransfer' && o.paymentStatus === 'Pending') api<{ bank: Bank }>(`/payments/${id}/initiate?email=${encodeURIComponent(o.customerDetails.email)}`, { method: 'POST' }).then(r => setBank(r.bank)).catch(() => undefined); }, [o, id]);
  async function sendRef(e: React.FormEvent) { e.preventDefault(); if (!o) return; setBusy(true); try { await api(`/payments/${id}/bank-reference`, { method: 'POST', body: { reference: ref, senderName: sender || undefined, email: o.customerDetails.email } }); toast('Reference received. We will verify your payment shortly.'); setRef(''); } catch (x) { toast(x instanceof ApiError ? (x.errors?.reference?.[0] ?? x.message) : 'Could not submit', 'err'); } finally { setBusy(false); } }
  async function payNow() { if (!o) return; try { const r = await api<{ url: string; fields: Record<string, string> }>(`/payments/${id}/initiate?email=${encodeURIComponent(o.customerDetails.email)}`, { method: 'POST' }); postForm(r.url, r.fields); } catch (x) { toast(x instanceof ApiError ? x.message : 'Online payment is unavailable', 'err'); } }
  if (!o && (loading || !missing)) return <Loading />;
  if (!o) return <div className="container-x max-w-xl py-16 text-center"><h1 className="font-display text-3xl text-espresso">Thank you!</h1><p className="mt-3 text-charcoal/70">Your order was received. Use your confirmation email to track it.</p><Link href="/track-order" className="btn-dark mt-6">Track an order</Link></div>;
  const failed = payment === 'failed'; const online = o.paymentMethod === 'JazzCash' || o.paymentMethod === 'EasyPaisa';
  return <div className="container-x max-w-3xl py-12">
    <div className="text-center">{failed ? <XCircle className="mx-auto h-14 w-14 text-red-600" aria-hidden /> : <CheckCircle2 className="mx-auto h-14 w-14 text-green-700" aria-hidden />}
      <h1 className="mt-3 font-display text-4xl text-espresso">{failed ? 'Payment not completed' : 'Thank you for your order!'}</h1>
      <p className="mt-2 text-charcoal/70">Order number <b>{o.orderNumber}</b>. A confirmation has been sent to {o.customerDetails.email}.</p></div>
    {online && o.paymentStatus !== 'Paid' && <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900"><p>{failed ? 'Your payment was not confirmed.' : 'Your payment has not been confirmed yet.'} Your order is saved as pending.</p><button onClick={payNow} className="btn-dark mt-3">Pay now</button></div>}
    {bank && <div className="mt-6 rounded-2xl bg-white p-6 shadow-soft"><h2 className="font-display text-xl text-espresso">Bank transfer instructions</h2>
      <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">{bank.bankName && <><dt className="text-charcoal/60">Bank</dt><dd>{bank.bankName}</dd></>}{bank.accountTitle && <><dt className="text-charcoal/60">Account title</dt><dd>{bank.accountTitle}</dd></>}{bank.accountNumber && <><dt className="text-charcoal/60">Account number</dt><dd>{bank.accountNumber}</dd></>}{bank.iban && <><dt className="text-charcoal/60">IBAN</dt><dd>{bank.iban}</dd></>}<dt className="text-charcoal/60">Payment reference</dt><dd>{o.orderNumber}</dd></dl>
      {bank.instructions && <p className="mt-3 text-sm text-charcoal/70">{bank.instructions}</p>}
      <form onSubmit={sendRef} className="mt-5 space-y-3 border-t border-espresso/10 pt-5"><p className="text-sm font-semibold">After transferring, submit your transaction reference</p>
        <Field label="Transaction reference" htmlFor="tr"><input id="tr" className="input" minLength={4} value={ref} onChange={e => setRef(e.target.value)} required /></Field><Field label="Sender name (optional)" htmlFor="sn"><input id="sn" className="input" value={sender} onChange={e => setSender(e.target.value)} /></Field>
        <button disabled={busy} className="btn-dark disabled:opacity-60">{busy ? 'Submitting…' : 'Submit reference'}</button></form></div>}
    <div className="mt-8"><OrderSummary o={o} /></div>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href={`/track-order?order=${encodeURIComponent(o.orderNumber)}&email=${encodeURIComponent(o.customerDetails.email)}`} className="btn-dark">Track order</Link><Link href="/shop" className="btn border border-espresso text-espresso hover:bg-espresso hover:text-cream">Continue shopping</Link></div></div>;
}
export default function Page({ params }: { params: { id: string } }) { return <Suspense fallback={<Loading />}><Confirmation id={params.id} /></Suspense>; }
