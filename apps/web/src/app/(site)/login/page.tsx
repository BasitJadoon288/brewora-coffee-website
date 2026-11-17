'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AuthCard from '@/components/AuthCard';
import { useAuth } from '@/components/auth';
import { Field } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { safeNext } from '@/lib/nav';
function Form() {
  const { user, loading, login } = useAuth(); const router = useRouter(); const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!loading && user) router.replace(user.role === 'Admin' && next === '/account' ? '/admin' : next); }, [loading, user, next, router]);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(''); try { await login(email, password); } catch (x) { setErr(x instanceof ApiError ? x.message : 'Login failed'); } finally { setBusy(false); } }
  return <AuthCard title="Welcome back" subtitle="Sign in to your BREWORA account"><form onSubmit={submit} className="space-y-4">
    <Field label="Email" htmlFor="le"><input id="le" type="email" autoComplete="username" className="input" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
    <Field label="Password" htmlFor="lp"><input id="lp" type="password" autoComplete="current-password" className="input" value={password} onChange={e => setPassword(e.target.value)} required /></Field>
    {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
    <div className="flex justify-between text-sm"><Link href="/forgot-password" className="text-caramel hover:underline">Forgot password?</Link><Link href={`/register?next=${encodeURIComponent(next)}`} className="text-caramel hover:underline">Create account</Link></div></form></AuthCard>;
}
export default function Login() { return <Suspense fallback={null}><Form /></Suspense>; }
