'use client';
import Link from 'next/link';
import { useState } from 'react';
import AuthCard from '@/components/AuthCard';
import OtpInput from '@/components/OtpInput';
import { Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useCountdown } from '@/lib/useCountdown';
/** Step 1: e-mail address. Step 2 (opens immediately): 6-digit code from the e-mail + new password. */
export default function Forgot() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email'); const timer = useCountdown(0);
  const [email, setEmail] = useState(''); const [otp, setOtp] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState(''); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false);
  const clean = email.trim().toLowerCase();
  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault(); if (busy) return; setBusy(true); setErr(''); setInfo('');
    try { await api('/auth/forgot-password', { method: 'POST', body: { email: clean } }); timer.start(61); setOtp(''); if (step === 'reset') setInfo('A new code has been sent.'); setStep('reset'); }
    catch (x) { setErr(x instanceof ApiError ? (x.errors?.email?.[0] ?? x.message) : 'Something went wrong'); } finally { setBusy(false); }
  }
  async function reset(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setInfo('');
    if (otp.length !== 6) return setErr('Enter the 6-digit code from your email'); if (password !== confirm) return setErr('Passwords do not match');
    setBusy(true);
    try { await api('/auth/reset-password', { method: 'POST', body: { email: clean, otp, password } }); setStep('done'); }
    catch (x) { setErr(x instanceof ApiError ? (x.errors?.password?.[0] ?? x.errors?.otp?.[0] ?? x.message) : 'Something went wrong'); } finally { setBusy(false); }
  }
  if (step === 'done') return <AuthCard title="Password updated"><p role="status" className="text-center text-sm text-green-800">Your password has been changed. Please sign in with your new password.</p><Link href="/login" className="btn-dark mt-6 w-full">Sign in</Link></AuthCard>;
  if (step === 'reset') return <AuthCard title="Enter your code" subtitle={`We sent a 6-digit code to ${clean}`}><form onSubmit={reset} className="space-y-5">
    <OtpInput value={otp} onChange={v => { setOtp(v); setErr(''); }} disabled={busy} invalid={!!err && otp.length === 6} />
    <Field label="New password" htmlFor="np" hint="At least 8 characters, one uppercase letter and one number"><input id="np" type="password" autoComplete="new-password" className="input" value={password} onChange={e => setPassword(e.target.value)} required /></Field>
    <Field label="Confirm password" htmlFor="nc"><input id="nc" type="password" autoComplete="new-password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} required /></Field>
    {info && !err && <p role="status" className="text-sm text-green-800">{info}</p>}{err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    <button disabled={busy || otp.length !== 6} className="btn-dark w-full disabled:opacity-60">{busy ? 'Saving…' : 'Update password'}</button>
    <p className="text-center text-sm text-charcoal/70">Didn’t get the code? {timer.left > 0 ? <span>Resend in {timer.left}s</span> : <button type="button" onClick={() => sendCode()} className="font-semibold text-caramel hover:underline">Resend code</button>}</p>
    <p className="text-center text-sm"><button type="button" onClick={() => { setStep('email'); setErr(''); setInfo(''); }} className="text-charcoal/60 hover:underline">Use a different email</button></p></form></AuthCard>;
  return <AuthCard title="Forgot password?" subtitle="We’ll email you a 6-digit code"><form onSubmit={sendCode} className="space-y-4"><Field label="Email" htmlFor="fe"><input id="fe" type="email" autoComplete="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
    {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Sending…' : 'Send code'}</button><p className="text-center text-sm"><Link href="/login" className="text-caramel hover:underline">Back to sign in</Link></p></form></AuthCard>;
}
