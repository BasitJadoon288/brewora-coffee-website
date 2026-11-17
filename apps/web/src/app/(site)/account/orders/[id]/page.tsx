'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import OrderSummary from '@/components/OrderSummary';
import { useToast } from '@/components/toast';
import { Loading } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { fmtDate, type Order } from '@/lib/types';
export default function OrderDetail({ params }: { params: { id: string } }) {
  const qc = useQueryClient(); const toast = useToast(); const { data: o, isLoading, error } = useQuery({ queryKey: ['order', params.id], queryFn: () => api<Order>(`/orders/${params.id}`) });
  async function cancel() { if (!confirm('Cancel this order?')) return; try { await api(`/orders/${params.id}/cancel`, { method: 'POST' }); toast('Order cancelled'); qc.invalidateQueries({ queryKey: ['order', params.id] }); } catch (x) { toast(x instanceof ApiError ? x.message : 'Could not cancel', 'err'); } }
  if (isLoading) return <Loading />; if (error || !o) return <p role="alert" className="text-red-700">Order not found.</p>;
  return <div><Link href="/account/orders" className="text-sm text-caramel hover:underline">← All orders</Link><h1 className="mt-2 font-display text-3xl text-espresso">Order {o.orderNumber}</h1>
    <div className="mt-6"><OrderSummary o={o} /></div>
    <section className="mt-8"><h2 className="font-display text-xl text-espresso">Order tracking</h2><ol className="mt-3 space-y-2 border-l-2 border-caramel/40 pl-4">{o.statusHistory.map((h, i) => <li key={i} className="text-sm"><b>{h.status}</b> <span className="text-charcoal/50">· {fmtDate(h.at)}</span>{h.note && <span className="text-charcoal/60"> — {h.note}</span>}</li>)}</ol></section>
    {o.orderStatus === 'Pending' && <button onClick={cancel} className="btn mt-6 border border-red-700 text-red-700 hover:bg-red-700 hover:text-white">Cancel order</button>}
    {o.paymentMethod === 'BankTransfer' && o.paymentStatus === 'Pending' && <p className="mt-6 text-sm"><Link href={`/order-confirmation/${o.id}`} className="font-semibold text-caramel underline">View bank transfer instructions</Link></p>}</div>;
}
