'use client';
import { Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth';
import { ApiError } from '@/lib/api';
export default function AdminLogin() {
  const { user, loading, login, logout } = useAuth(); const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!loading && user?.role === 'Admin') router.replace('/admin'); }, [loading, user, router]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { const u = await login(email, password); if (u.role !== 'Admin') { await logout(); setErr('This account does not have admin access.'); } }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Login failed'); } finally { setBusy(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-espresso px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-cream p-8 shadow-soft">
        <p className="flex items-center justify-center gap-2 font-display text-2xl tracking-[0.2em] text-espresso"><Coffee className="h-6 w-6 text-caramel" aria-hidden />BREWORA</p>
        <h1 className="text-center text-sm text-charcoal/60">Admin sign in</h1>
        <div><label htmlFor="e" className="mb-1 block text-sm font-semibold">Email</label><input id="e" type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="input" /></div>
        <div><label htmlFor="p" className="mb-1 block text-sm font-semibold">Password</label><input id="p" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="input" /></div>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
