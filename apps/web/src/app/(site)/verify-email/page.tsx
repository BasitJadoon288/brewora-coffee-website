'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AuthCard from '@/components/AuthCard';
import { api, ApiError } from '@/lib/api';
function Verify() {
  const token = useSearchParams().get('token'); const [state, setState] = useState<'work' | 'ok' | 'bad'>('work'); const [msg, setMsg] = useState('');
  useEffect(() => { if (!token) { setState('bad'); setMsg('This verification link is missing its token.'); return; }
    api('/auth/verify-email', { method: 'POST', body: { token } }).then(() => setState('ok')).catch(e => { setState('bad'); setMsg(e instanceof ApiError ? e.message : 'Verification failed'); }); }, [token]);
  return <AuthCard title="Email verification">{state === 'work' && <p className="text-center text-sm">Verifying…</p>}{state === 'ok' && <p role="status" className="text-center text-sm text-green-800">Your email is verified. Thank you!</p>}{state === 'bad' && <p role="alert" className="text-center text-sm text-red-700">{msg}</p>}
    <Link href="/account" className="btn-dark mt-6 w-full">Go to my account</Link></AuthCard>;
}
export default function Page() { return <Suspense fallback={null}><Verify /></Suspense>; }
