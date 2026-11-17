'use client';
import { Bell, BarChart3, Boxes, Coffee, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Mail, Menu, MessageSquare, Package, Settings, ShoppingCart, Star, Store, Tag, Users, X, Layers, Quote, LineChart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/types';
const GROUPS: { title: string; items: { href: string; label: string; Icon: any }[] }[] = [
  { title: '', items: [{ href: '/admin', label: 'Dashboard', Icon: LayoutDashboard }] },
  { title: 'Catalog', items: [{ href: '/admin/products', label: 'Products', Icon: Package }, { href: '/admin/categories', label: 'Categories', Icon: Layers }, { href: '/admin/inventory', label: 'Inventory', Icon: Boxes }] },
  { title: 'Sales', items: [{ href: '/admin/orders', label: 'Orders', Icon: ShoppingCart }, { href: '/admin/customers', label: 'Customers', Icon: Users }, { href: '/admin/coupons', label: 'Coupons', Icon: Tag }, { href: '/admin/reviews', label: 'Reviews', Icon: Star }] },
  { title: 'Website', items: [{ href: '/admin/banners', label: 'Banners', Icon: ImageIcon }, { href: '/admin/testimonials', label: 'Testimonials', Icon: Quote }, { href: '/admin/content', label: 'Pages & content', Icon: FileText }, { href: '/admin/messages', label: 'Messages', Icon: MessageSquare }, { href: '/admin/newsletter', label: 'Newsletter', Icon: Mail }] },
  { title: 'Insights', items: [{ href: '/admin/reports', label: 'Reports', Icon: BarChart3 }, { href: '/admin/analytics', label: 'Analytics', Icon: LineChart }] },
  { title: 'Store', items: [{ href: '/admin/settings', label: 'Settings', Icon: Settings }] },
];
function Bell_() {
  const [open, setOpen] = useState(false); const router = useRouter(); const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-notifs'], refetchInterval: 60_000, queryFn: () => api<{ items: { id: string; title: string; message?: string; link?: string; isRead: boolean; createdAt: string }[]; unread: number }>('/notifications?limit=10') });
  async function readAll() { await api('/notifications/read-all', { method: 'PUT' }); qc.invalidateQueries({ queryKey: ['admin-notifs'] }); }
  return <div className="relative"><button onClick={() => setOpen(!open)} aria-label={`Notifications, ${data?.unread ?? 0} unread`} aria-expanded={open} className="relative rounded-full p-2 hover:bg-espresso/10"><Bell className="h-5 w-5" />{!!data?.unread && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel px-1 text-xs font-bold text-espresso">{data.unread}</span>}</button>
    {open && <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl bg-white p-3 shadow-soft"><div className="mb-2 flex items-center justify-between"><p className="font-semibold">Notifications</p><button onClick={readAll} className="text-xs text-caramel underline">Mark all read</button></div>
      <ul className="max-h-80 space-y-1 overflow-y-auto">{data?.items.length === 0 && <li className="p-3 text-sm text-charcoal/60">No notifications.</li>}{data?.items.map(n => <li key={n.id}><button onClick={() => { setOpen(false); if (n.link) router.push(n.link); }} className={`w-full rounded-lg p-2 text-left text-sm hover:bg-espresso/5 ${n.isRead ? '' : 'bg-caramel/10'}`}><b>{n.title}</b> <span className="text-charcoal/60">{n.message}</span><span className="block text-xs text-charcoal/40">{fmtDate(n.createdAt)}</span></button></li>)}</ul></div>}</div>;
}
// Client-side guard is for UX only; every /api/admin/* call is authorised on the server.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth(); const router = useRouter(); const path = usePathname(); const [menu, setMenu] = useState(false); const ok = user?.role === 'Admin';
  useEffect(() => { if (!loading && !ok) router.replace('/admin/login'); }, [loading, ok, router]);
  useEffect(() => setMenu(false), [path]);
  if (loading || !ok) return <div className="flex min-h-screen items-center justify-center text-charcoal/60">Loading…</div>;
  const active = (h: string) => (h === '/admin' ? path === h : path.startsWith(h));
  return (<div className="min-h-screen md:flex">
    <aside className={`bg-espresso text-cream md:sticky md:top-0 md:block md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto ${menu ? 'block' : 'hidden'} fixed inset-0 z-40 overflow-y-auto md:static`}>
      <div className="flex items-center justify-between p-4"><div><p className="flex items-center gap-2 font-display text-xl tracking-[0.2em]"><Coffee className="h-5 w-5 text-caramel" aria-hidden />BREWORA</p><p className="text-xs text-cream/60">Admin Portal</p></div><button className="md:hidden" onClick={() => setMenu(false)} aria-label="Close menu"><X /></button></div>
      <nav className="space-y-4 px-2 pb-6" aria-label="Admin">{GROUPS.map(g => <div key={g.title}>{g.title && <p className="px-3 pb-1 text-xs uppercase tracking-wider text-cream/40">{g.title}</p>}{g.items.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${active(href) ? 'bg-cream/15' : 'hover:bg-cream/10'}`}><Icon className="h-4 w-4" aria-hidden />{label}</Link>)}</div>)}
        <div><Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-cream/10"><Store className="h-4 w-4" aria-hidden />View store</Link><button onClick={async () => { await logout(); router.replace('/admin/login'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-cream/10"><LogOut className="h-4 w-4" aria-hidden />Sign out</button></div></nav></aside>
    <div className="min-w-0 flex-1"><div className="sticky top-0 z-20 flex items-center justify-between border-b border-espresso/10 bg-cream/95 px-4 py-2 backdrop-blur md:px-8"><button className="md:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu /></button><span className="hidden text-sm text-charcoal/60 md:block">Signed in as {user.email}</span><Bell_ /></div>
      <main className="p-4 md:p-8">{children}</main></div></div>);
}
