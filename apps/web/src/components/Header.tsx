'use client';
import { Coffee, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { useAuth } from './auth';
const links = [{ href: '/', label: 'Home' }, { href: '/shop', label: 'Shop' }, { href: '/shop?bestSeller=true', label: 'Best Sellers' }, { href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' }];
export default function Header({ storeName = 'BREWORA', logo }: { storeName?: string; logo?: string }) {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const router = useRouter();
  const { count } = useCart(); const { user, logout } = useAuth();
  const search = (e: React.FormEvent) => { e.preventDefault(); setOpen(false); router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop'); };
  return (
    <header className="sticky top-0 z-40 border-b border-cream/10 bg-espresso/95 text-cream backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl tracking-[0.2em]">
          {logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={storeName} className="h-8 w-auto" /> : <Coffee className="h-6 w-6 text-caramel" aria-hidden />}{!logo && storeName.toUpperCase()}</Link>
        <nav className="hidden gap-6 text-sm lg:flex" aria-label="Main">{links.map(l => <Link key={l.href} href={l.href} className="transition hover:text-caramel">{l.label}</Link>)}</nav>
        <form onSubmit={search} className="hidden flex-1 md:block md:max-w-xs" role="search"><label className="sr-only" htmlFor="hs">Search products</label>
          <div className="flex items-center rounded-full bg-cream/10 px-3"><Search className="h-4 w-4 text-cream/60" aria-hidden /><input id="hs" value={q} onChange={e => setQ(e.target.value)} placeholder="Search coffee…" className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-cream/50" /></div></form>
        <div className="flex items-center gap-1">
          {user && <Link href="/account/wishlist" aria-label="Wishlist" className="rounded-full p-2 hover:bg-cream/10"><Heart className="h-5 w-5" /></Link>}
          <Link href={user ? '/account' : '/login'} aria-label={user ? 'My account' : 'Sign in'} className="rounded-full p-2 hover:bg-cream/10"><User className="h-5 w-5" /></Link>
          <Link href="/cart" aria-label={`Cart, ${count} items`} className="relative rounded-full p-2 hover:bg-cream/10"><ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel px-1 text-xs font-bold text-espresso">{count}</span>}</Link>
          <button className="rounded-full p-2 hover:bg-cream/10 lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && <div className="border-t border-cream/10 px-4 pb-4 lg:hidden">
        <form onSubmit={search} className="py-3" role="search"><input aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} placeholder="Search coffee…" className="w-full rounded-full bg-cream/10 px-4 py-2 text-sm outline-none placeholder:text-cream/50" /></form>
        <nav aria-label="Mobile">{links.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm">{l.label}</Link>)}
          <Link href="/track-order" onClick={() => setOpen(false)} className="block py-3 text-sm">Track order</Link>
          {user ? <button onClick={() => { setOpen(false); logout(); }} className="block py-3 text-sm">Sign out</button> : <Link href="/register" onClick={() => setOpen(false)} className="block py-3 text-sm">Create account</Link>}</nav></div>}
    </header>
  );
}
