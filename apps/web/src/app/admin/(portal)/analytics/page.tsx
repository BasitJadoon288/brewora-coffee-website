'use client';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loading } from '@/components/ui';
import { Card, PageTitle, Table } from '@/components/admin/kit';
import { api } from '@/lib/api';
import { money } from '@/lib/types';
interface A { salesByCategory: { category?: string; revenue: number; units: number }[]; paymentMethods: { method: string; orders: number; amount: number }[]; topCustomers: { userId: string; name?: string; spent: number; orders: number }[]; newCustomersByMonth: { month: string; count: number }[]; topProducts: { productId: string; name: string; unitsSold: number; revenue: number }[] }
const Chart = ({ data, x, y, money: m }: { data: object[]; x: string; y: string; money?: boolean }) => data.length === 0 ? <p className="text-sm text-charcoal/60">No data yet.</p> : <div className="h-60"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#3B241822" /><XAxis dataKey={x} fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip formatter={(v: number) => (m ? money(v) : v)} /><Bar dataKey={y} fill="#C58B52" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>;
export default function Analytics() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-analytics'], queryFn: () => api<A>('/admin/analytics') }); if (isLoading || !data) return <Loading />;
  return <div className="space-y-6"><PageTitle title="Analytics" sub="Excludes cancelled orders." />
    <div className="grid gap-6 lg:grid-cols-2"><Card title="Revenue by category"><Chart data={data.salesByCategory} x="category" y="revenue" money /></Card><Card title="Orders by payment method"><Chart data={data.paymentMethods} x="method" y="orders" /></Card>
      <Card title="New customers per month"><Chart data={data.newCustomersByMonth} x="month" y="count" /></Card><Card title="Top customers"><ul className="space-y-2 text-sm">{data.topCustomers.map(c => <li key={c.userId} className="flex justify-between"><span>{c.name ?? 'Customer'} <span className="text-charcoal/50">· {c.orders} orders</span></span><b>{money(c.spent)}</b></li>)}{data.topCustomers.length === 0 && <li className="text-charcoal/60">No data yet.</li>}</ul></Card></div>
    <div><h2 className="mb-2 font-display text-lg text-espresso">Top products</h2><Table head={['Product', 'Units sold', 'Revenue']} empty={data.topProducts.length ? undefined : 'No sales yet.'}>{data.topProducts.map(p => <tr key={p.productId}><td>{p.name}</td><td>{p.unitsSold}</td><td>{money(p.revenue)}</td></tr>)}</Table></div></div>;
}
