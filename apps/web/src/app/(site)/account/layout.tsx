'use client';
import { Heart, KeyRound, LogOut, MapPin, Package, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth';
import { Loading } from '@/components/ui';
const nav = [{ href: '/account', label: 'Profile', Icon: User }, { href: '/account/orders', label: 'Orders', Icon: Package }, { href: '/account/addresses', label: 'Addresses', Icon: MapPin }, { href: '/account/wishlist', label: 'Wishlist', Icon: Heart }, { href: '/account/security', label: 'Password', Icon: KeyRound }];
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth(); const router = useRouter(); const path = usePathname();
  useEffect(() => { if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(path)}`); }, [loading, user, router, path]);
  if (loading || !user) return <Loading />;
  return <div className="container-x grid gap-8 py-10 md:grid-cols-[220px_1fr]"><aside><p className="mb-4 font-display text-2xl text-espresso">Hi, {user.fullName.split(' ')[0]}</p>
    <nav className="flex gap-2 overflow-x-auto md:flex-col" aria-label="Account">{nav.map(({ href, label, Icon }) => <Link key={href} href={href} className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${path === href ? 'bg-espresso text-cream' : 'hover:bg-espresso/10'}`}><Icon className="h-4 w-4" aria-hidden />{label}</Link>)}
      <button onClick={async () => { await logout(); router.replace('/'); }} className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm hover:bg-espresso/10"><LogOut className="h-4 w-4" aria-hidden />Sign out</button></nav></aside><section className="min-w-0">{children}</section></div>;
}
