'use client';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
export default function NewsletterForm() {
  const [email, setEmail] = useState(''); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await api('/newsletter/subscribe', { method: 'POST', body: { email } }); setMsg({ ok: true, t: 'Thank you for subscribing!' }); setEmail(''); }
    catch (err) { setMsg({ ok: false, t: err instanceof ApiError ? (err.errors?.email?.[0] ?? err.message) : 'Something went wrong' }); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" noValidate>
      <label className="sr-only" htmlFor="nl">Email address</label>
      <input id="nl" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" className="input flex-1" />
      <button disabled={busy} className="btn-gold disabled:opacity-60">{busy ? 'Subscribing…' : 'Subscribe'}</button>
      {msg && <p role="status" className={`text-sm sm:basis-full ${msg.ok ? 'text-caramel' : 'text-red-300'}`}>{msg.t}</p>}
    </form>
  );
}
