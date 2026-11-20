'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AuthCard from '@/components/AuthCard';
import { useAuth } from '@/components/auth';
import VerifyCode from '@/components/VerifyCode';
import { Field } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { safeNext } from '@/lib/nav';
function Form() {
  const { user, loading, register } = useAuth(); const router = useRouter(); const next = safeNext(useSearchParams().get('next'));
  const [v, setV] = useState({ fullName: '', email: '', phoneNumber: '', password: '', confirm: '' }); const [errs, setErrs] = useState<Record<string, string[]>>({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false); const [verifyEmail, setVerifyEmail] = useState(''); // pending: registration in flight / code screen showing -> don't auto-redirect yet
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  useEffect(() => { if (!loading && user && !pending) router.replace(next); }, [loading, user, pending, next, router]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErrs({}); setMsg('');
    if (v.password !== v.confirm) return setErrs({ confirm: ['Passwords do not match'] });
    setBusy(true); setPending(true);
    try { await register({ fullName: v.fullName, email: v.email, password: v.password, phoneNumber: v.phoneNumber || undefined }); setVerifyEmail(v.email.trim().toLowerCase()); } // account is created and the code e-mail is on its way: open the code screen immediately
    catch (x) { setPending(false); if (x instanceof ApiError) { setErrs(x.errors ?? {}); if (!x.errors) setMsg(x.message); } else setMsg('Registration failed'); } finally { setBusy(false); }
  }
  if (verifyEmail) return <VerifyCode email={verifyEmail} next={next} />;
  return <AuthCard title="Create your account" subtitle="Faster checkout, order history and wishlist"><form onSubmit={submit} className="space-y-4" noValidate>
    <Field label="Full name" htmlFor="rn" error={errs.fullName?.[0]}><input id="rn" className="input" autoComplete="name" value={v.fullName} onChange={set('fullName')} required /></Field>
    <Field label="Email" htmlFor="re" error={errs.email?.[0]}><input id="re" type="email" className="input" autoComplete="email" value={v.email} onChange={set('email')} required /></Field>
    <Field label="Mobile (optional)" htmlFor="rm" error={errs.phoneNumber?.[0]} hint="e.g. 03001234567"><input id="rm" className="input" autoComplete="tel" value={v.phoneNumber} onChange={set('phoneNumber')} /></Field>
    <Field label="Password" htmlFor="rp" error={errs.password?.[0]} hint="At least 8 characters, one uppercase letter and one number"><input id="rp" type="password" className="input" autoComplete="new-password" value={v.password} onChange={set('password')} required /></Field>
    <Field label="Confirm password" htmlFor="rc" error={errs.confirm?.[0]}><input id="rc" type="password" className="input" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} required /></Field>
    {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
    <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Creating…' : 'Create account'}</button>
    <p className="text-center text-sm">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-caramel hover:underline">Sign in</Link></p></form></AuthCard>;
}
export default function Register() { return <Suspense fallback={null}><Form /></Suspense>; }
