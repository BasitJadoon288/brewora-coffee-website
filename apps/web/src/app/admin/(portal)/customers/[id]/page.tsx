'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useToast } from '@/components/toast';
import { Badge, Loading } from '@/components/ui';
import { Card, PageTitle, Table } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
import { fmtDate, money, type Order, type User } from '@/lib/types';
export default function Customer({ params }: { params: { id: string } }) {
  const qc = useQueryClient(); const toast = useToast(); const { data, isLoading } = useQuery({ queryKey: ['admin-customer', params.id], queryFn: () => api<{ customer: User; orders: Order[]; totalSpent: number }>(`/admin/customers/${params.id}`) });
  if (isLoading) return <Loading />; if (!data) return <p role="alert" className="text-red-700">Customer not found.</p>; const c = data.customer;
  async function toggle() { try { await api(`/admin/customers/${c.id}/status`, { method: 'PUT', body: { isActive: !c.isActive } }); toast(c.isActive ? 'Account deactivated' : 'Account activated'); qc.invalidateQueries({ queryKey: ['admin-customer', params.id] }); } catch (x) { toast(x instanceof ApiError ? x.message : 'Failed', 'err'); } }
  return <div className="space-y-6"><Link href="/admin/customers" className="text-sm text-caramel hover:underline">← All customers</Link><PageTitle title={c.fullName} sub={c.email}><button onClick={toggle} className={c.isActive ? 'btn border border-red-700 text-red-700 hover:bg-red-700 hover:text-white' : 'btn-gold'}>{c.isActive ? 'Deactivate account' : 'Activate account'}</button></PageTitle>
    <div className="grid gap-4 sm:grid-cols-3"><Card title="Contact"><p className="text-sm">{c.phoneNumber ?? 'No phone'}<br />Email {c.isEmailVerified ? 'verified' : 'not verified'}</p></Card><Card title="Total spent"><p className="text-2xl font-semibold text-espresso">{money(data.totalSpent)}</p></Card><Card title="Account"><Badge value={c.isActive ? 'Confirmed' : 'Cancelled'} /> <span className="text-sm text-charcoal/60">since {c.createdAt ? fmtDate(c.createdAt) : ''}</span></Card></div>
    <div><h2 className="mb-2 font-display text-lg text-espresso">Order history</h2><Table head={['Order', 'Date', 'Total', 'Payment', 'Status']} empty={data.orders.length ? undefined : 'No orders yet.'}>{data.orders.map(o => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="underline">{o.orderNumber}</Link></td><td>{fmtDate(o.createdAt)}</td><td>{money(o.totalAmount)}</td><td><Badge value={o.paymentStatus} /></td><td><Badge value={o.orderStatus} /></td></tr>)}</Table></div></div>;
}
