'use client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronRight, Clock, Package, Plus, ShoppingCart, Store, Users, Wallet, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Table, Tabs } from '@/components/admin/kit';
import { useAuth } from '@/components/auth';
import { Badge, Loading } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/types';

type Pt = { period: string; sales: number; orders: number };
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
interface Dash {
  cards: Record<string, number>;
  charts: Record<Period, Pt[]> & { orderStats: { status: string; count: number }[] };
  recentOrders: { id: string; orderNumber: string; customerDetails: { fullName: string }; totalAmount: number; orderStatus: string }[];
  bestSellers: { id: string; name: string; unitsSold: number }[];
  latestCustomers: { id: string; fullName: string; email: string }[];
  lowStockAlerts: { id: string; name: string; stockQuantity: number }[];
  recentActivities: { id: string; title: string; message?: string }[];
}

const CARAMEL = '#C58B52'; const INK = '#3B2418';
const STATUS_COLOR: Record<string, string> = { Pending: '#D9A441', Confirmed: '#5B8DB8', Processing: '#7A6FB0', Shipped: '#A06CC0', Delivered: '#5E9B6B', Cancelled: '#C0584F' };
const TIP = { background: '#ffffff', border: 'none', borderRadius: 12, boxShadow: '0 6px 20px rgba(59,36,24,.14)', fontSize: 12, color: INK };

/* ---------- small helpers ---------- */
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** The daily series only contains days that had orders; this fills the gaps with 0 so the last `n` days are continuous. */
function lastDays(series: Pt[], n: number, key: 'sales' | 'orders'): number[] {
  const by = new Map(series.map(p => [p.period, p[key]])); const out: number[] = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(by.get(dayKey(d)) ?? 0); }
  return out;
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
/** % change of the last 7 days against the 7 days before; null when there is nothing to compare with. */
function weekTrend(days: number[]): number | null { const cur = sum(days.slice(7)); const prev = sum(days.slice(0, 7)); return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null; }

/* ---------- building blocks ---------- */
function IconBadge({ icon: Icon, className = '' }: { icon: LucideIcon; className?: string }) {
  return <span className={`ui-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${className}`}><Icon className="h-5 w-5 text-caramel" aria-hidden /></span>;
}
function TrendChip({ value }: { value: number | null }) {
  if (value === null) return null;
  const up = value >= 0; const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'text-green-800' : 'text-red-800'} ui-inset`} title="Last 7 days vs the 7 days before"><Arrow className="h-3.5 w-3.5" aria-hidden />{Math.abs(value)}%</span>;
}
function Sparkline({ values, id }: { values: number[]; id: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return <div className="h-12 w-full" aria-hidden><ResponsiveContainer><AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CARAMEL} stopOpacity={0.45} /><stop offset="100%" stopColor={CARAMEL} stopOpacity={0} /></linearGradient></defs>
    <Area type="monotone" dataKey="v" stroke={CARAMEL} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} />
  </AreaChart></ResponsiveContainer></div>;
}
function Kpi({ label, value, icon, spark, trend, href, sparkId }: { label: string; value: string; icon: LucideIcon; spark?: number[]; trend?: number | null; href?: string; sparkId?: string }) {
  const body = <>
    <div className="flex items-start justify-between gap-3"><IconBadge icon={icon} />{trend !== undefined && <TrendChip value={trend} />}</div>
    <p className="mt-4 whitespace-nowrap text-2xl font-semibold tracking-tight text-espresso sm:text-[1.7rem]">{value}</p>
    <p className="mt-0.5 text-sm text-charcoal/70">{label}</p>
    {spark && sparkId && <div className="mt-3"><Sparkline values={spark} id={sparkId} /></div>}
  </>;
  const cls = 'ui-raised block rounded-2xl p-5';
  return href ? <Link href={href} className={`${cls} ui-press`}>{body}</Link> : <div className={cls}>{body}</div>;
}
function StatTile({ label, value, icon, href, alert }: { label: string; value: number; icon: LucideIcon; href: string; alert?: boolean }) {
  return <Link href={href} className="ui-raised ui-press flex items-center gap-4 rounded-2xl p-4 sm:p-5">
    <IconBadge icon={icon} className={alert && value > 0 ? '[&>svg]:text-red-700' : ''} />
    <div className="min-w-0 flex-1"><p className="text-2xl font-semibold text-espresso">{value}</p><p className="truncate text-sm text-charcoal/70">{label}</p></div>
    <ChevronRight className="h-4 w-4 text-charcoal/50" aria-hidden />
  </Link>;
}
function QuickAction({ href, icon: Icon, label, primary }: { href: string; icon: LucideIcon; label: string; primary?: boolean }) {
  return <Link href={href} className={`${primary ? 'btn-dark' : 'ui-raised-sm ui-press rounded-full px-5 py-3 text-sm font-semibold text-espresso'} inline-flex items-center gap-2`}><Icon className="h-4 w-4" aria-hidden />{label}</Link>;
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="ui-inset rounded-2xl p-4 text-center text-sm text-charcoal/70">{children}</p>; }

/* ---------- page ---------- */
export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api<Dash>('/admin/dashboard') });
  const [period, setPeriod] = useState<Period>('daily');
  if (isLoading) return <Loading label="Loading dashboard…" />;
  if (error || !data) return <p role="alert" className="text-red-700">Could not load the dashboard.</p>;

  const { cards, charts } = data; const series = charts[period];
  const salesDays = lastDays(charts.daily, 14, 'sales'); const orderDays = lastDays(charts.daily, 14, 'orders');
  const totalOrders = charts.orderStats.reduce((n, s) => n + s.count, 0); const topSold = Math.max(1, ...data.bestSellers.map(b => b.unitsSold));
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return <div className="space-y-6 lg:space-y-8">
    {/* header + quick actions */}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-2xl text-espresso sm:text-3xl">{greeting()}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1><p className="mt-1 text-sm text-charcoal/70">{today} · here is how your store is doing.</p></div>
      <div className="flex flex-wrap gap-3"><QuickAction href="/admin/products/new" icon={Plus} label="Add product" primary /><QuickAction href="/admin/orders" icon={ShoppingCart} label="Orders" /><QuickAction href="/" icon={Store} label="View store" /></div>
    </div>

    {/* headline KPIs */}
    <section aria-label="Key figures" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi label="Total revenue (paid)" value={money(cards.totalRevenue)} icon={Wallet} spark={salesDays} sparkId="sp-rev" trend={weekTrend(salesDays)} />
      <Kpi label="Total orders" value={String(cards.totalOrders)} icon={ShoppingCart} spark={orderDays} sparkId="sp-ord" trend={weekTrend(orderDays)} href="/admin/orders" />
      <Kpi label="Customers" value={String(cards.totalCustomers)} icon={Users} href="/admin/customers" />
      <Kpi label="Products" value={String(cards.totalProducts)} icon={Package} href="/admin/products" />
    </section>

    {/* things that need attention */}
    <section aria-label="Needs attention" className="grid gap-5 sm:grid-cols-3">
      <StatTile label="Pending orders" value={cards.pendingOrders} icon={Clock} href="/admin/orders" />
      <StatTile label="Completed orders" value={cards.completedOrders} icon={CheckCircle2} href="/admin/orders" />
      <StatTile label="Low / out of stock" value={cards.lowStockProducts} icon={AlertTriangle} href="/admin/inventory" alert />
    </section>

    {/* sales + order status */}
    <div className="grid gap-6 xl:grid-cols-3">
      <Card title="Sales overview" className="xl:col-span-2">
        <Tabs value={period} onChange={v => setPeriod(v as Period)} tabs={[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]} />
        {series.length === 0 ? <Empty>No sales in this period yet.</Empty> : <div className="h-72"><ResponsiveContainer><AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CARAMEL} stopOpacity={0.5} /><stop offset="100%" stopColor={CARAMEL} stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#3B241822" />
          <XAxis dataKey="period" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: string) => (period === 'daily' ? v.slice(5) : v)} />
          <YAxis fontSize={11} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
          <Tooltip contentStyle={TIP} formatter={(v: number, name: string) => (name === 'sales' ? [money(v), 'Sales'] : [v, 'Orders'])} />
          <Area type="monotone" dataKey="sales" stroke={CARAMEL} strokeWidth={2.5} fill="url(#sales-fill)" activeDot={{ r: 5, fill: INK, stroke: '#ffffff', strokeWidth: 2 }} />
        </AreaChart></ResponsiveContainer></div>}
      </Card>
      <Card title="Orders by status">
        {totalOrders === 0 ? <Empty>No orders yet.</Empty> : <>
          <div className="relative mx-auto h-48 w-48"><ResponsiveContainer><PieChart><Pie data={charts.orderStats} dataKey="count" nameKey="status" innerRadius={58} outerRadius={84} paddingAngle={3} stroke="none">{charts.orderStats.map(s => <Cell key={s.status} fill={STATUS_COLOR[s.status] ?? '#9a8f84'} />)}</Pie><Tooltip contentStyle={TIP} /></PieChart></ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-semibold text-espresso">{totalOrders}</span><span className="text-xs text-charcoal/70">orders</span></div></div>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{charts.orderStats.map(s => <li key={s.status} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[s.status] ?? '#9a8f84' }} aria-hidden />{s.status}</span><b>{s.count}</b></li>)}</ul></>}
      </Card>
    </div>

    {/* recent orders + best sellers */}
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg text-espresso">Recent orders</h2><Link href="/admin/orders" className="text-sm font-medium text-caramel hover:underline">View all</Link></div>
        <Table head={['Order', 'Customer', 'Total', 'Status']} empty={data.recentOrders.length ? undefined : 'No orders yet.'}>
          {data.recentOrders.map(o => <tr key={o.id}>
            <td><Link href={`/admin/orders/${o.id}`} className="font-medium text-espresso hover:underline">{o.orderNumber}</Link></td>
            <td>{o.customerDetails.fullName}</td><td className="whitespace-nowrap">{money(o.totalAmount)}</td><td><Badge value={o.orderStatus} /></td></tr>)}
        </Table></div>
      <Card title="Best-selling products">
        {data.bestSellers.length === 0 ? <Empty>No sales yet.</Empty> : <ol className="space-y-4">{data.bestSellers.map((b, i) => <li key={b.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm"><span className="truncate font-medium text-espresso"><span className="mr-2 text-charcoal/50">{i + 1}.</span>{b.name}</span><span className="shrink-0 text-charcoal/70">{b.unitsSold} sold</span></div>
          <div className="ui-inset mt-2 h-2.5 rounded-full p-[2px]"><div className="h-full rounded-full bg-caramel" style={{ width: `${Math.max(6, (b.unitsSold / topSold) * 100)}%` }} /></div></li>)}</ol>}
      </Card>
    </div>

    {/* stock, customers, activity */}
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Low-stock alerts">
        {data.lowStockAlerts.length === 0 ? <Empty>All products are well stocked.</Empty> : <ul className="space-y-3 text-sm">{data.lowStockAlerts.map(p => <li key={p.id} className="flex items-center justify-between gap-3"><span className="truncate">{p.name}</span><span className={`ui-inset shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold ${p.stockQuantity === 0 ? 'text-red-800' : 'text-amber-800'}`}>{p.stockQuantity === 0 ? 'Out of stock' : `${p.stockQuantity} left`}</span></li>)}</ul>}
      </Card>
      <Card title="Latest customers">
        {data.latestCustomers.length === 0 ? <Empty>No customers yet.</Empty> : <ul className="space-y-3 text-sm">{data.latestCustomers.map(c => <li key={c.id}><Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3">
          <span aria-hidden className="ui-raised-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-espresso">{c.fullName.charAt(0).toUpperCase()}</span>
          <span className="min-w-0"><span className="block truncate font-medium text-espresso">{c.fullName}</span><span className="block truncate text-xs text-charcoal/70">{c.email}</span></span></Link></li>)}</ul>}
      </Card>
      <Card title="Recent activity">
        {data.recentActivities.length === 0 ? <Empty>Nothing yet.</Empty> : <ul className="space-y-4 text-sm">{data.recentActivities.map(a => <li key={a.id} className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-caramel" aria-hidden /><span><b className="text-espresso">{a.title}</b>{a.message && <span className="block text-charcoal/70">{a.message}</span>}</span></li>)}</ul>}
      </Card>
    </div>
  </div>;
}
