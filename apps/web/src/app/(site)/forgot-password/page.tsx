'use client';
import Link from 'next/link';
import { useState } from 'react';
import AuthCard from '@/components/AuthCard';
import { Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
export default function Forgot() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(''); try { setMsg((await api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } })).message); } catch (x) { setErr(x instanceof ApiError ? x.message : 'Something went wrong'); } finally { setBusy(false); } }
  return <AuthCard title="Forgot password?" subtitle="We’ll email you a reset link"><form onSubmit={submit} className="space-y-4"><Field label="Email" htmlFor="fe"><input id="fe" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
    {msg && <p role="status" className="text-sm text-green-800">{msg}</p>}{err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Sending…' : 'Send reset link'}</button><p className="text-center text-sm"><Link href="/login" className="text-caramel hover:underline">Back to sign in</Link></p></form></AuthCard>;
}
