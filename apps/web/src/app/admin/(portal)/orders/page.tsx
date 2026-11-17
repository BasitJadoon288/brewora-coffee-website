'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Loading, Pager } from '@/components/ui';
import { PageTitle, SearchBox, Table, useDebounced } from '@/components/admin/kit';
import { api } from '@/lib/api';
import { fmtDate, money, type Order, type Paged } from '@/lib/types';
const sel = (label: string, v: string, set: (x: string) => void, opts: string[]) => <select aria-label={label} className="input w-auto" value={v} onChange={e => set(e.target.value)}><option value="">{label}</option>{opts.map(o => <option key={o}>{o}</option>)}</select>;
export default function Orders() {
  const [q, setQ] = useState(''); const dq = useDebounced(q); const [status, setStatus] = useState(''); const [pay, setPay] = useState(''); const [method, setMethod] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [page, setPage] = useState(1);
  const qs = `page=${page}&limit=15${dq ? `&q=${encodeURIComponent(dq)}` : ''}${status ? `&orderStatus=${status}` : ''}${pay ? `&paymentStatus=${pay}` : ''}${method ? `&paymentMethod=${method}` : ''}${from ? `&from=${from}` : ''}${to ? `&to=${to}T23:59:59` : ''}`;
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders', qs], queryFn: () => api<Paged<Order>>(`/admin/orders?${qs}`) });
  const reset = <T,>(f: (x: T) => void) => (x: T) => { f(x); setPage(1); };
  return <div><PageTitle title="Orders" sub={data ? `${data.total} orders` : undefined}><SearchBox value={q} onChange={reset(setQ)} placeholder="Order #, name, email, phone…" /></PageTitle>
    <div className="mb-4 flex flex-wrap items-center gap-2">{sel('All statuses', status, reset(setStatus), ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])}{sel('All payments', pay, reset(setPay), ['Pending', 'Paid', 'Failed', 'Refunded'])}{sel('All methods', method, reset(setMethod), ['COD', 'JazzCash', 'EasyPaisa', 'BankTransfer'])}
      <label className="text-sm">From <input type="date" className="input inline-block w-auto" value={from} onChange={e => reset(setFrom)(e.target.value)} /></label><label className="text-sm">To <input type="date" className="input inline-block w-auto" value={to} onChange={e => reset(setTo)(e.target.value)} /></label></div>
    {isLoading ? <Loading /> : <><Table head={['Order', 'Date', 'Customer', 'Total', 'Method', 'Payment', 'Status']} empty={data?.items.length ? undefined : 'No orders match.'}>
      {data?.items.map(o => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="font-medium text-espresso underline">{o.orderNumber}</Link></td><td>{fmtDate(o.createdAt)}</td><td>{o.customerDetails.fullName}<div className="text-xs text-charcoal/50">{o.customerDetails.email}</div></td><td>{money(o.totalAmount)}</td><td>{o.paymentMethod}</td><td><Badge value={o.paymentStatus} /></td><td><Badge value={o.orderStatus} /></td></tr>)}</Table>
      {data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}</div>;
}
