'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Badge, Loading, Pager } from '@/components/ui';
import { PageTitle, SearchBox, Table, useDebounced } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
import { fmtDate, money, type Paged, type User } from '@/lib/types';
type C = User & { orders: number; totalSpent: number };
export default function Customers() {
  const qc = useQueryClient(); const toast = useToast(); const [q, setQ] = useState(''); const dq = useDebounced(q); const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['admin-customers', dq, page], queryFn: () => api<Paged<C>>(`/admin/customers?page=${page}&limit=15${dq ? `&q=${encodeURIComponent(dq)}` : ''}`) });
  async function toggle(c: C) { try { await api(`/admin/customers/${c.id}/status`, { method: 'PUT', body: { isActive: !c.isActive } }); toast(c.isActive ? 'Account deactivated' : 'Account activated'); qc.invalidateQueries({ queryKey: ['admin-customers'] }); } catch (x) { toast(x instanceof ApiError ? x.message : 'Failed', 'err'); } }
  return <div><PageTitle title="Customers" sub={data ? `${data.total} customers` : undefined}><SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Name, email, phone…" /></PageTitle>
    {isLoading ? <Loading /> : <><Table head={['Customer', 'Phone', 'Orders', 'Spent', 'Joined', 'Status', '']} empty={data?.items.length ? undefined : 'No customers found.'}>
      {data?.items.map(c => <tr key={c.id}><td><Link href={`/admin/customers/${c.id}`} className="font-medium text-espresso underline">{c.fullName}</Link><div className="text-xs text-charcoal/50">{c.email}</div></td><td>{c.phoneNumber ?? '—'}</td><td>{c.orders}</td><td>{money(c.totalSpent)}</td><td>{c.createdAt ? fmtDate(c.createdAt) : ''}</td><td><Badge value={c.isActive ? 'Confirmed' : 'Cancelled'} /></td>
        <td><button className="underline" onClick={() => toggle(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</Table>{data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}</div>;
}
