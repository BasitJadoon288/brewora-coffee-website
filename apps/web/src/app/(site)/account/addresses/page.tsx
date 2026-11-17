'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Empty, Field, Loading, Modal } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Address } from '@/lib/types';
const blank = { label: 'Home', fullName: '', phone: '', line1: '', city: '', postalCode: '', isDefault: false };
export default function Addresses() {
  const qc = useQueryClient(); const toast = useToast(); const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: () => api<Address[]>('/addresses') });
  const [editing, setEditing] = useState<Address | 'new' | null>(null); const [v, setV] = useState<any>(blank); const [errs, setErrs] = useState<Record<string, string[]>>({}); const [busy, setBusy] = useState(false);
  const open = (a: Address | 'new') => { setEditing(a); setErrs({}); setV(a === 'new' ? blank : { ...blank, ...a, postalCode: a.postalCode ?? '' }); };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrs({});
    const body = { label: v.label, fullName: v.fullName, phone: v.phone, line1: v.line1, city: v.city, postalCode: v.postalCode || undefined, isDefault: !!v.isDefault };
    try { if (editing === 'new') await api('/addresses', { method: 'POST', body }); else await api(`/addresses/${(editing as Address).id}`, { method: 'PUT', body }); toast('Address saved'); setEditing(null); qc.invalidateQueries({ queryKey: ['addresses'] }); }
    catch (x) { if (x instanceof ApiError) setErrs(x.errors ?? {}); toast(x instanceof ApiError ? x.message : 'Could not save', 'err'); } finally { setBusy(false); }
  }
  async function del(a: Address) { if (!confirm('Delete this address?')) return; try { await api(`/addresses/${a.id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['addresses'] }); } catch { toast('Could not delete', 'err'); } }
  return <div><div className="flex items-center justify-between"><h1 className="font-display text-3xl text-espresso">Saved addresses</h1><button className="btn-dark" onClick={() => open('new')}>Add address</button></div>
    {isLoading ? <Loading /> : data?.length === 0 ? <div className="mt-6"><Empty title="No saved addresses" text="Add one to check out faster." /></div> :
      <div className="mt-6 grid gap-4 md:grid-cols-2">{data?.map(a => <div key={a.id} className="rounded-2xl bg-white p-5 shadow-soft"><div className="flex items-center justify-between"><p className="font-semibold">{a.label}</p>{a.isDefault && <span className="rounded-full bg-caramel/20 px-2 py-0.5 text-xs text-espresso">Default</span>}</div>
        <p className="mt-2 text-sm text-charcoal/70">{a.fullName} · {a.phone}<br />{a.line1}, {a.city} {a.postalCode}</p><div className="mt-3 flex gap-4 text-sm"><button className="text-espresso underline" onClick={() => open(a)}>Edit</button><button className="text-red-700 underline" onClick={() => del(a)}>Delete</button></div></div>)}</div>}
    <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add address' : 'Edit address'}><form onSubmit={save} className="space-y-3" noValidate>
      <Field label="Label" htmlFor="al"><input id="al" className="input" value={v.label} onChange={set('label')} /></Field>
      <Field label="Full name" htmlFor="af" error={errs.fullName?.[0]}><input id="af" className="input" value={v.fullName} onChange={set('fullName')} required /></Field>
      <Field label="Mobile" htmlFor="ap" error={errs.phone?.[0]} hint="e.g. 03001234567"><input id="ap" className="input" value={v.phone} onChange={set('phone')} required /></Field>
      <Field label="Address" htmlFor="a1" error={errs.line1?.[0]}><input id="a1" className="input" value={v.line1} onChange={set('line1')} required /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="City" htmlFor="ac" error={errs.city?.[0]}><input id="ac" className="input" value={v.city} onChange={set('city')} required /></Field><Field label="Postal code" htmlFor="az"><input id="az" className="input" value={v.postalCode} onChange={set('postalCode')} /></Field></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!v.isDefault} onChange={set('isDefault')} /> Make this my default address</label>
      <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Saving…' : 'Save address'}</button></form></Modal></div>;
}
