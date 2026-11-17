'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth';
import { useToast } from '@/components/toast';
import { Field } from '@/components/ui';
import { api, ApiError, setToken } from '@/lib/api';
export default function Security() {
  const toast = useToast(); const router = useRouter(); const { logout } = useAuth();
  const [cur, setCur] = useState(''); const [pw, setPw] = useState(''); const [conf, setConf] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); if (pw !== conf) return setErr('Passwords do not match'); setBusy(true);
    try { await api('/auth/change-password', { method: 'POST', body: { currentPassword: cur, newPassword: pw } }); setToken(null); toast('Password changed. Please sign in again.'); await logout(); router.replace('/login'); }
    catch (x) { setErr(x instanceof ApiError ? (x.errors?.newPassword?.[0] ?? x.message) : 'Something went wrong'); } finally { setBusy(false); }
  }
  return <div><h1 className="font-display text-3xl text-espresso">Change password</h1><form onSubmit={submit} className="mt-6 max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-soft">
    <Field label="Current password" htmlFor="cp"><input id="cp" type="password" autoComplete="current-password" className="input" value={cur} onChange={e => setCur(e.target.value)} required /></Field>
    <Field label="New password" htmlFor="npw" hint="At least 8 characters, one uppercase letter and one number"><input id="npw" type="password" autoComplete="new-password" className="input" value={pw} onChange={e => setPw(e.target.value)} required /></Field>
    <Field label="Confirm new password" htmlFor="ncf"><input id="ncf" type="password" autoComplete="new-password" className="input" value={conf} onChange={e => setConf(e.target.value)} required /></Field>
    {err && <p role="alert" className="text-sm text-red-700">{err}</p>}<button disabled={busy} className="btn-dark disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button></form></div>;
}
