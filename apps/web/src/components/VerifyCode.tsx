'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthCard from '@/components/AuthCard';
import { useAuth } from '@/components/auth';
import OtpInput from '@/components/OtpInput';
import { api, ApiError } from '@/lib/api';
import { useCountdown } from '@/lib/useCountdown';

/** Code entry: the customer types (or pastes) the 6-digit code from the e-mail. */
export default function VerifyCode({ email, next, onDone }: { email: string; next?: string; onDone?: () => void }) {
  const { updateUser, user } = useAuth(); const router = useRouter(); const timer = useCountdown(60);
  const [otp, setOtp] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [info, setInfo] = useState(''); const [ok, setOk] = useState(false);
  async function verify(code = otp) {
    if (code.length !== 6 || busy) return; setBusy(true); setErr('');
    try { await api('/auth/verify-email', { method: 'POST', body: { email, otp: code } }); setOk(true); if (user) updateUser({ ...user, isEmailVerified: true }); setTimeout(() => { onDone ? onDone() : router.replace(next ?? '/account'); }, 1200); }
    catch (x) { setErr(x instanceof ApiError ? (x.errors?.otp?.[0] ?? x.message) : 'Verification failed'); setOtp(''); } finally { setBusy(false); }
  }
  async function resend() { setErr(''); setInfo(''); try { await api('/auth/resend-verification', { method: 'POST' }); timer.start(60); setOtp(''); setInfo('A new code has been sent.'); } catch (x) { setErr(x instanceof ApiError ? x.message : 'Could not send the code'); } }
  if (ok) return <AuthCard title="Email verified"><p role="status" className="text-center text-sm text-green-800">Your email address is verified. Thank you!</p></AuthCard>;
  return <AuthCard title="Verify your email" subtitle={`Enter the 6-digit code we sent to ${email}`}><div className="space-y-5">
    <OtpInput value={otp} onChange={v => { setOtp(v); setErr(''); }} onComplete={verify} disabled={busy} invalid={!!err} />
    {info && !err && <p role="status" className="text-center text-sm text-green-800">{info}</p>}{err && <p role="alert" className="text-center text-sm text-red-700">{err}</p>}
    <button onClick={() => verify()} disabled={busy || otp.length !== 6} className="btn-dark w-full disabled:opacity-60">{busy ? 'Verifying…' : 'Verify email'}</button>
    <p className="text-center text-sm text-charcoal/70">Didn’t get the code? {timer.left > 0 ? <span>Resend in {timer.left}s</span> : <button type="button" onClick={resend} className="font-semibold text-caramel hover:underline">Resend code</button>}</p>
    <p className="text-center text-sm"><button type="button" onClick={() => (onDone ? onDone() : router.replace(next ?? '/account'))} className="text-charcoal/60 hover:underline">Skip for now</button></p></div></AuthCard>;
}

