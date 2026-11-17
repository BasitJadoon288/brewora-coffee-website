'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import AuthCard from '@/components/AuthCard';
import { Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
function Form() {
  const token = useSearchParams().get('token') ?? ''; const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); if (password !== confirm) return setErr('Passwords do not match'); setBusy(true);
    try { setMsg((await api<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token, password } })).message); }
    catch (x) { setErr(x instanceof ApiError ? (x.errors?.password?.[0] ?? x.message) : 'Something went wrong'); } finally { setBusy(false); }
  }
  if (!token) return <AuthCard title="Reset password"><p className="text-sm text-red-700">This reset link is missing its token. Request a new one.</p><Link href="/forgot-password" className="btn-dark mt-4 w-full">Request new link</Link></AuthCard>;
  return <AuthCard title="Choose a new password"><form onSubmit={submit} className="space-y-4">
    <Field label="New password" htmlFor="np" hint="At least 8 characters, one uppercase letter and one number"><input id="np" type="password" autoComplete="new-password" className="input" value={password} onChange={e => setPassword(e.target.value)} required /></Field>
    <Field label="Confirm password" htmlFor="nc"><input id="nc" type="password" autoComplete="new-password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} required /></Field>
    {msg && <p role="status" className="text-sm text-green-800">{msg} <Link href="/login" className="underline">Sign in</Link></p>}{err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    <button disabled={busy || !!msg} className="btn-dark w-full disabled:opacity-60">{busy ? 'Saving…' : 'Update password'}</button></form></AuthCard>;
}
export default function Reset() { return <Suspense fallback={null}><Form /></Suspense>; }
