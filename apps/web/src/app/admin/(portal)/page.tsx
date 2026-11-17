'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Loading } from '@/components/ui';
import { Card, PageTitle, Table, Tabs } from '@/components/admin/kit';
import Link from 'next/link';
import { api } from '@/lib/api';
import { money } from '@/lib/types';
type Pt = { period: string; sales: number; orders: number };
interface Dash { cards: Record<string, number>; charts: { daily: Pt[]; weekly: Pt[]; monthly: Pt[]; yearly: Pt[]; orderStats: { status: string; count: number }[] };
  recentOrders: { id: string; orderNumber: string; customerDetails: { fullName: string }; totalAmount: number; orderStatus: string }[]; bestSellers: { id: string; name: string; unitsSold: number }[]; latestCustomers: { id: string; fullName: string; email: string }[];
  lowStockAlerts: { id: string; name: string; stockQuantity: number }[]; recentActivities: { id: string; title: string; message?: string }[] }
const LABELS: [string, string, boolean][] = [['totalRevenue', 'Total revenue (paid)', true], ['totalOrders', 'Total orders', false], ['pendingOrders', 'Pending orders', false], ['completedOrders', 'Completed orders', false], ['totalCustomers', 'Customers', false], ['totalProducts', 'Products', false], ['lowStockProducts', 'Low / out of stock', false]];
export default function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api<Dash>('/admin/dashboard') }); const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  if (isLoading) return <Loading label="Loading dashboard…" />; if (error || !data) return <p role="alert" className="text-red-700">Could not load the dashboard.</p>;
  const series = data.charts[period];
  return <div className="space-y-6"><PageTitle title="Dashboard" sub="Live figures from your store database." />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{LABELS.map(([k, l, m]) => <div key={k} className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-xs uppercase tracking-wide text-charcoal/60">{l}</p><p className="mt-1 text-2xl font-semibold text-espresso">{m ? money(data.cards[k]) : data.cards[k]}</p></div>)}</div>
    <Card title="Sales"><Tabs value={period} onChange={v => setPeriod(v as any)} tabs={[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]} />
      {series.length === 0 ? <p className="text-sm text-charcoal/60">No sales in this period yet.</p> : <div className="h-64"><ResponsiveContainer><LineChart data={series}><CartesianGrid strokeDasharray="3 3" stroke="#3B241822" /><XAxis dataKey="period" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => money(v)} /><Line type="monotone" dataKey="sales" stroke="#C58B52" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>}</Card>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Orders by status">{data.charts.orderStats.length === 0 ? <p className="text-sm text-charcoal/60">No orders yet.</p> : <div className="h-56"><ResponsiveContainer><BarChart data={data.charts.orderStats}><CartesianGrid strokeDasharray="3 3" stroke="#3B241822" /><XAxis dataKey="status" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="count" fill="#3B2418" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>}</Card>
      <Card title="Best-selling products"><ul className="space-y-2 text-sm">{data.bestSellers.map(b => <li key={b.id} className="flex justify-between"><span>{b.name}</span><span className="text-charcoal/60">{b.unitsSold} sold</span></li>)}{data.bestSellers.length === 0 && <li className="text-charcoal/60">No sales yet.</li>}</ul></Card></div>
    <div><div className="mb-2 flex items-center justify-between"><h2 className="font-display text-lg text-espresso">Recent orders</h2><Link href="/admin/orders" className="text-sm text-caramel underline">View all</Link></div>
      <Table head={['Order', 'Customer', 'Total', 'Status']} empty={data.recentOrders.length ? undefined : 'No orders yet.'}>{data.recentOrders.map(o => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="font-medium text-espresso underline">{o.orderNumber}</Link></td><td>{o.customerDetails.fullName}</td><td>{money(o.totalAmount)}</td><td><Badge value={o.orderStatus} /></td></tr>)}</Table></div>
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Low-stock alerts">{data.lowStockAlerts.length ? <ul className="space-y-2 text-sm">{data.lowStockAlerts.map(p => <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="text-red-700">{p.stockQuantity} left</span></li>)}</ul> : <p className="text-sm text-charcoal/60">All products are well stocked.</p>}</Card>
      <Card title="Latest customers"><ul className="space-y-2 text-sm">{data.latestCustomers.map(c => <li key={c.id}><Link href={`/admin/customers/${c.id}`} className="underline">{c.fullName}</Link> <span className="text-charcoal/50">· {c.email}</span></li>)}{data.latestCustomers.length === 0 && <li className="text-charcoal/60">No customers yet.</li>}</ul></Card>
      <Card title="Recent activity"><ul className="space-y-2 text-sm">{data.recentActivities.map(a => <li key={a.id}><b>{a.title}</b> <span className="text-charcoal/60">{a.message}</span></li>)}{data.recentActivities.length === 0 && <li className="text-charcoal/60">Nothing yet.</li>}</ul></Card></div></div>;
}
