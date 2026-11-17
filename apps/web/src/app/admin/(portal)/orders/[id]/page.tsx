'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import OrderSummary from '@/components/OrderSummary';
import { useToast } from '@/components/toast';
import { Badge, Field, Loading } from '@/components/ui';
import { Card, PageTitle } from '@/components/admin/kit';
import { api, ApiError, openHtml } from '@/lib/api';
import { fmtDate, money, type Order } from '@/lib/types';
const NEXT: Record<string, string[]> = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Processing', 'Cancelled'], Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered'], Delivered: [], Cancelled: [] };
export default function AdminOrder({ params }: { params: { id: string } }) {
  const qc = useQueryClient(); const toast = useToast(); const { data: o, isLoading } = useQuery({ queryKey: ['admin-order', params.id], queryFn: () => api<Order & { user?: { fullName: string; id: string } | null; payment?: { transactionReference?: string; senderName?: string; paymentStatus: string } | null }>(`/admin/orders/${params.id}`) });
  const [note, setNote] = useState(''); const [ref, setRef] = useState(''); const [refund, setRefund] = useState(''); const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); try { await fn(); toast(ok); qc.invalidateQueries({ queryKey: ['admin-order', params.id] }); qc.invalidateQueries({ queryKey: ['admin-orders'] }); } catch (x) { toast(x instanceof ApiError ? x.message : 'Action failed', 'err'); } finally { setBusy(false); } };
  if (isLoading) return <Loading />; if (!o) return <p role="alert" className="text-red-700">Order not found.</p>;
  const manualPay = o.paymentMethod === 'COD' || o.paymentMethod === 'BankTransfer';
  return <div className="space-y-6"><Link href="/admin/orders" className="text-sm text-caramel hover:underline">← All orders</Link>
    <PageTitle title={`Order ${o.orderNumber}`} sub={`Placed ${fmtDate(o.createdAt)}${o.user ? ` by ${o.user.fullName}` : ' (guest)'}`}><button className="btn-dark" onClick={() => openHtml(`/admin/orders/${o.id}/invoice`).catch(() => toast('Could not open invoice', 'err'))}>Print invoice</button></PageTitle>
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><OrderSummary o={o} />
      <div className="space-y-4">
        <Card title="Update status">{NEXT[o.orderStatus].length === 0 ? <p className="text-sm text-charcoal/60">This order is {o.orderStatus.toLowerCase()} — no further changes.</p> : <>
          <Field label="Note (optional)" htmlFor="sn"><input id="sn" className="input" value={note} maxLength={300} onChange={e => setNote(e.target.value)} /></Field>
          <div className="mt-3 flex flex-wrap gap-2">{NEXT[o.orderStatus].map(s => <button key={s} disabled={busy} className={s === 'Cancelled' ? 'btn border border-red-700 text-red-700 hover:bg-red-700 hover:text-white' : 'btn-dark'} onClick={() => { if (s === 'Cancelled' && !confirm('Cancel this order? Stock will be restored.')) return; run(() => api(`/admin/orders/${o.id}/status`, { method: 'PUT', body: { status: s, note: note || undefined } }), `Order marked ${s}`).then(() => setNote('')); }}>{s === 'Cancelled' ? 'Cancel order' : `Mark ${s}`}</button>)}</div></>}</Card>
        <Card title="Payment"><div className="space-y-2 text-sm"><p>{o.paymentMethod} · <Badge value={o.paymentStatus} /></p>{o.payment?.transactionReference && <p>Reference: <b>{o.payment.transactionReference}</b>{o.payment.senderName && ` (${o.payment.senderName})`}</p>}
          {o.refund && o.refund.status !== 'None' && <p className="text-amber-800">Refund {o.refund.status.toLowerCase()}{o.refund.amount ? `: ${money(o.refund.amount)}` : ''}</p>}
          {(o.paymentMethod === 'JazzCash' || o.paymentMethod === 'EasyPaisa') && o.paymentStatus !== 'Paid' && <p className="text-charcoal/60">Online payments are confirmed automatically when the provider reports success. They cannot be marked paid by hand.</p>}
          {manualPay && o.paymentStatus === 'Pending' && o.orderStatus !== 'Cancelled' && <div className="space-y-2 pt-2">{o.paymentMethod === 'BankTransfer' && <Field label="Bank reference (optional)" htmlFor="br"><input id="br" className="input" value={ref} onChange={e => setRef(e.target.value)} /></Field>}
            <div className="flex gap-2"><button disabled={busy} className="btn-gold" onClick={() => run(() => api(`/admin/orders/${o.id}/payment`, { method: 'PUT', body: { status: 'Paid', reference: ref || undefined } }), 'Marked as paid')}>Mark paid</button><button disabled={busy} className="btn border border-espresso text-espresso" onClick={() => run(() => api(`/admin/orders/${o.id}/payment`, { method: 'PUT', body: { status: 'Failed' } }), 'Marked as failed')}>Mark failed</button></div></div>}</div></Card>
        {o.paymentStatus === 'Paid' && <Card title="Refund"><p className="mb-2 text-xs text-charcoal/60">Records the refund in BREWORA. Send the money back through your bank/provider separately.</p><Field label="Amount (blank = full)" htmlFor="ra"><input id="ra" type="number" min={1} max={o.totalAmount} className="input" value={refund} onChange={e => setRefund(e.target.value)} /></Field>
          <button disabled={busy} className="btn-dark mt-3" onClick={() => run(() => api(`/admin/orders/${o.id}/refund`, { method: 'POST', body: refund ? { amount: Number(refund) } : {} }), 'Refund recorded')}>Record refund</button></Card>}
        <Card title="History"><ol className="space-y-2 border-l-2 border-caramel/40 pl-4 text-sm">{o.statusHistory.map((h, i) => <li key={i}><b>{h.status}</b> <span className="text-charcoal/50">· {fmtDate(h.at)}</span>{h.note && <span className="block text-charcoal/60">{h.note}</span>}</li>)}</ol></Card></div></div></div>;
}
