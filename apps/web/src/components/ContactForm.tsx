'use client';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Field } from './ui';
export default function ContactForm() {
  const [v, setV] = useState({ name: '', email: '', phone: '', subject: '', message: '' }); const [err, setErr] = useState<Record<string, string[]>>({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({}); setMsg('');
    try { const r = await api<{ message: string }>('/contact', { method: 'POST', body: { ...v, phone: v.phone || undefined, subject: v.subject || undefined } }); setMsg(r.message); setV({ name: '', email: '', phone: '', subject: '', message: '' }); }
    catch (x) { if (x instanceof ApiError) { setErr(x.errors ?? {}); if (!x.errors) setMsg(x.message); } } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-soft" noValidate>
    <Field label="Your name" htmlFor="cn" error={err.name?.[0]}><input id="cn" className="input" value={v.name} onChange={set('name')} required /></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Email" htmlFor="ce" error={err.email?.[0]}><input id="ce" type="email" className="input" value={v.email} onChange={set('email')} required /></Field>
      <Field label="Phone (optional)" htmlFor="cp"><input id="cp" className="input" value={v.phone} onChange={set('phone')} /></Field></div>
    <Field label="Subject (optional)" htmlFor="cs"><input id="cs" className="input" value={v.subject} onChange={set('subject')} /></Field>
    <Field label="Message" htmlFor="cm" error={err.message?.[0]}><textarea id="cm" className="input min-h-32" value={v.message} onChange={set('message')} required /></Field>
    {msg && <p role="status" className="text-sm text-green-800">{msg}</p>}
    <button disabled={busy} className="btn-dark disabled:opacity-60">{busy ? 'Sending…' : 'Send message'}</button></form>;
}
