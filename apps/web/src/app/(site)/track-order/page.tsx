'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Badge, Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { fmtDate, money } from '@/lib/types';
interface Tracked { orderNumber: string; orderStatus: string; paymentStatus: string; paymentMethod: string; totalAmount: number; createdAt: string; history: { status: string; at: string }[] }
function Form() {
  const sp = useSearchParams(); const [num, setNum] = useState(sp.get('order') ?? ''); const [email, setEmail] = useState(sp.get('email') ?? ''); const [res, setRes] = useState<Tracked | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(''); setRes(null); try { setRes(await api<Tracked>(`/orders/track/${encodeURIComponent(num.trim())}?email=${encodeURIComponent(email.trim())}`)); } catch (x) { setErr(x instanceof ApiError && x.status === 404 ? 'No order found. Check the order number and email.' : 'Could not look up the order.'); } finally { setBusy(false); } }
  return <div className="container-x max-w-xl py-12"><h1 className="font-display text-4xl text-espresso">Track your order</h1>
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-soft"><Field label="Order number" htmlFor="on"><input id="on" className="input" placeholder="BRW-20260101-ABC123" value={num} onChange={e => setNum(e.target.value)} required /></Field>
      <Field label="Email used at checkout" htmlFor="oe"><input id="oe" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}<button disabled={busy} className="btn-dark disabled:opacity-60">{busy ? 'Searching…' : 'Track order'}</button></form>
    {res && <div className="mt-6 rounded-2xl bg-white p-6 shadow-soft"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{res.orderNumber}</p><Badge value={res.orderStatus} /></div>
      <p className="mt-2 text-sm text-charcoal/70">Placed {fmtDate(res.createdAt)} · {money(res.totalAmount)} · {res.paymentMethod} ({res.paymentStatus})</p>
      <ol className="mt-4 space-y-2 border-l-2 border-caramel/40 pl-4">{res.history.map((h, i) => <li key={i} className="text-sm"><b>{h.status}</b> <span className="text-charcoal/50">· {fmtDate(h.at)}</span></li>)}</ol></div>}</div>;
}
export default function TrackOrder() { return <Suspense fallback={null}><Form /></Suspense>; }
