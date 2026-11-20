'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AuthCard from '@/components/AuthCard';
import { useAuth } from '@/components/auth';
import VerifyCode from '@/components/VerifyCode';
import { api, ApiError } from '@/lib/api';
function LinkVerify({ token }: { token: string }) {
  const [state, setState] = useState<'work' | 'ok' | 'bad'>('work'); const [msg, setMsg] = useState('');
  useEffect(() => { api('/auth/verify-email', { method: 'POST', body: { token } }).then(() => setState('ok')).catch(e => { setState('bad'); setMsg(e instanceof ApiError ? e.message : 'Verification failed'); }); }, [token]);
  return <AuthCard title="Email verification">{state === 'work' && <p className="text-center text-sm">Verifying…</p>}{state === 'ok' && <p role="status" className="text-center text-sm text-green-800">Your email is verified. Thank you!</p>}{state === 'bad' && <p role="alert" className="text-center text-sm text-red-700">{msg}</p>}
    <Link href="/account" className="btn-dark mt-6 w-full">Go to my account</Link></AuthCard>;
}
/** No token in the URL: the signed-in customer types the 6-digit code from the e-mail. */
function CodeVerify() {
  const { user, loading } = useAuth(); const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace('/login?next=/verify-email'); }, [loading, user, router]);
  if (loading || !user) return <AuthCard title="Email verification"><p className="text-center text-sm">Loading…</p></AuthCard>;
  if (user.isEmailVerified) return <AuthCard title="Email verified"><p role="status" className="text-center text-sm text-green-800">Your email address is already verified.</p><Link href="/account" className="btn-dark mt-6 w-full">Go to my account</Link></AuthCard>;
  return <VerifyCode email={user.email} />;
}
function Verify() { const token = useSearchParams().get('token'); return token ? <LinkVerify token={token} /> : <CodeVerify />; }
export default function Page() { return <Suspense fallback={null}><Verify /></Suspense>; }
