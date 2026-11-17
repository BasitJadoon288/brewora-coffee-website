'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Empty, Loading, Pager } from '@/components/ui';
import { api } from '@/lib/api';
import { fmtDate, money, type Order, type Paged } from '@/lib/types';
export default function Orders() {
  const [page, setPage] = useState(1); const { data, isLoading } = useQuery({ queryKey: ['my-orders', page], queryFn: () => api<Paged<Order>>(`/orders/my-orders?page=${page}&limit=10`) });
  return <div><h1 className="font-display text-3xl text-espresso">My orders</h1>
    {isLoading ? <Loading /> : !data?.items.length ? <div className="mt-6"><Empty title="No orders yet" text="When you place an order it will show up here."><Link href="/shop" className="btn-dark">Start shopping</Link></Empty></div> :
      <><ul className="mt-6 space-y-3">{data.items.map(o => <li key={o.id}><Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-soft transition hover:-translate-y-0.5">
        <div><p className="font-semibold text-espresso">{o.orderNumber}</p><p className="text-sm text-charcoal/60">{fmtDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p></div><div className="flex items-center gap-3"><Badge value={o.orderStatus} /><span className="font-semibold">{money(o.totalAmount)}</span></div></Link></li>)}</ul><Pager page={data.page} pages={data.pages} onChange={setPage} /></>}</div>;
}
