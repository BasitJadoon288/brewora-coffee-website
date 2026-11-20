'use client';
import { ChevronDown, Heart, LayoutDashboard, LogOut, MapPin, Package, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './auth';
/** Header account control: a clear "Sign in" button when signed out, an avatar + name with a dropdown when signed in. */
export default function AccountMenu() {
  const { user, loading, logout } = useAuth(); const [open, setOpen] = useState(false); const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', click); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key); };
  }, [open]);
  if (loading) return <span className="mx-1 h-8 w-8 animate-pulse rounded-full bg-cream/15" aria-hidden />;
  if (!user) return <Link href="/login" className="ml-1 flex items-center gap-1.5 rounded-full bg-caramel px-3 py-1.5 text-sm font-semibold text-espresso transition hover:bg-[#d49a62] active:scale-95"><UserIcon className="h-4 w-4" aria-hidden /><span>Sign in</span></Link>;
  const first = user.fullName.trim().split(/\s+/)[0] || 'Account'; const initial = first[0]?.toUpperCase() ?? '?';
  const item = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-espresso transition hover:bg-espresso/5';
  return <div ref={box} className="relative ml-1">
    <button onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${user.fullName}`} className="flex items-center gap-2 rounded-full bg-cream/10 py-1 pl-1 pr-2 transition hover:bg-cream/20 sm:pr-3">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-caramel font-bold text-espresso">{initial}<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-espresso bg-green-500" aria-hidden /></span>
      <span className="hidden max-w-[110px] truncate text-sm sm:inline">Hi, {first}</span><ChevronDown className={`hidden h-4 w-4 transition sm:block ${open ? 'rotate-180' : ''}`} aria-hidden /></button>
    {open && <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-espresso/10">
      <div className="border-b border-espresso/10 bg-cream px-4 py-3"><p className="text-xs text-charcoal/60">Signed in as</p><p className="truncate font-semibold text-espresso">{user.fullName}</p><p className="truncate text-xs text-charcoal/60">{user.email}</p></div>
      <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className={item}><UserIcon className="h-4 w-4" />My account</Link>
      <Link role="menuitem" href="/account/orders" onClick={() => setOpen(false)} className={item}><Package className="h-4 w-4" />My orders</Link>
      <Link role="menuitem" href="/account/wishlist" onClick={() => setOpen(false)} className={item}><Heart className="h-4 w-4" />Wishlist</Link>
      <Link role="menuitem" href="/account/addresses" onClick={() => setOpen(false)} className={item}><MapPin className="h-4 w-4" />Addresses</Link>
      {user.role === 'Admin' && <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={item}><LayoutDashboard className="h-4 w-4" />Admin panel</Link>}
      <button role="menuitem" onClick={() => { setOpen(false); logout(); }} className={`${item} border-t border-espresso/10 text-red-700`}><LogOut className="h-4 w-4" />Sign out</button></div>}
  </div>;
}
