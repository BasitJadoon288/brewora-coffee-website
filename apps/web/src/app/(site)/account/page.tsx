'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth';
import { useToast } from '@/components/toast';
import { Field } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';
export default function Profile() {
  const { user, updateUser } = useAuth(); const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? ''); const [phone, setPhone] = useState(user?.phoneNumber ?? ''); const [errs, setErrs] = useState<Record<string, string[]>>({}); const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrs({});
    try { updateUser(await api<User>('/auth/profile', { method: 'PUT', body: { fullName, ...(phone ? { phoneNumber: phone } : {}) } })); toast('Profile updated'); }
    catch (x) { if (x instanceof ApiError) { setErrs(x.errors ?? {}); toast(x.message, 'err'); } } finally { setBusy(false); }
  }
  async function resend() { try { await api('/auth/resend-verification', { method: 'POST' }); toast('Verification email sent'); } catch (x) { toast(x instanceof ApiError ? x.message : 'Could not send', 'err'); } }
  return <div><h1 className="font-display text-3xl text-espresso">My profile</h1>
    <form onSubmit={save} className="mt-6 max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-soft">
      <Field label="Full name" htmlFor="pn" error={errs.fullName?.[0]}><input id="pn" className="input" value={fullName} onChange={e => setFullName(e.target.value)} required /></Field>
      <Field label="Email" htmlFor="pe"><input id="pe" className="input bg-espresso/5" value={user?.email ?? ''} readOnly /></Field>
      {user && !user.isEmailVerified && <p className="text-sm text-amber-800">Your email is not verified. <button type="button" onClick={resend} className="font-semibold underline">Resend verification email</button></p>}
      <Field label="Mobile" htmlFor="pp" error={errs.phoneNumber?.[0]} hint="e.g. 03001234567"><input id="pp" className="input" value={phone} onChange={e => setPhone(e.target.value)} /></Field>
      <button disabled={busy} className="btn-dark disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button></form></div>;
}
