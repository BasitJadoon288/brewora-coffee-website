'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Field, Loading, Modal, Pager } from '../ui';
import { useToast } from '../toast';
import { api, ApiError } from '@/lib/api';
import type { Paged } from '@/lib/types';
import type { SpecKey } from '@/lib/image-specs';
import ImageField from './ImageField';
import { fieldErrors, PageTitle, SearchBox, Table, useDebounced } from './kit';

export interface FieldDef { name: string; label: string; type: 'text' | 'number' | 'textarea' | 'checkbox' | 'select' | 'image' | 'date'; options?: { value: string; label: string }[]; required?: boolean; hint?: string; nullable?: boolean; default?: unknown; folder?: string; spec?: SpecKey }
export interface ColumnDef { header: string; cell: (row: any) => React.ReactNode }
interface Props { title: string; sub?: string; listPath: string; writePath: string; paged?: boolean; fields: FieldDef[]; columns: ColumnDef[]; searchable?: boolean; addLabel?: string }

const initial = (fields: FieldDef[], row?: any) => Object.fromEntries(fields.map(f => {
  const raw = row ? row[f.name] : f.default;
  return [f.name, f.type === 'checkbox' ? !!(raw ?? (row ? false : f.default ?? false)) : f.type === 'date' ? (raw ? String(raw).slice(0, 10) : '') : raw === null || raw === undefined ? '' : String(raw)];
}));
function toBody(fields: FieldDef[], v: Record<string, any>, edit: boolean) {
  const b: Record<string, unknown> = {};
  for (const f of fields) {
    const x = v[f.name];
    if (f.type === 'checkbox') b[f.name] = !!x;
    else if (f.type === 'number') { if (x === '') { if (f.nullable) b[f.name] = null; } else b[f.name] = Number(x); }
    else if (f.type === 'date') { if (x) b[f.name] = x; else if (f.nullable) b[f.name] = null; }
    else { const t = String(x ?? '').trim(); if (t) b[f.name] = t; else if (edit && !f.required) b[f.name] = ''; }
  }
  return b;
}
/** Generic admin CRUD screen driven by field/column definitions. */
export default function ResourcePage({ title, sub, listPath, writePath, paged = true, fields, columns, searchable = true, addLabel = 'Add new' }: Props) {
  const qc = useQueryClient(); const toast = useToast(); const [page, setPage] = useState(1); const [q, setQ] = useState(''); const dq = useDebounced(q);
  const key = ['resource', listPath, page, dq];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: async () => { const r = await api<any>(`${listPath}?${paged ? `page=${page}&limit=15&` : ''}${dq ? `q=${encodeURIComponent(dq)}` : ''}`); return (paged ? r : { items: r, total: r.length, page: 1, pages: 1 }) as Paged<any>; } });
  const [row, setRow] = useState<any | 'new' | null>(null); const [v, setV] = useState<Record<string, any>>({}); const [errs, setErrs] = useState<Record<string, string[]>>({}); const [busy, setBusy] = useState(false);
  const open = (r: any | 'new') => { setRow(r); setErrs({}); setV(initial(fields, r === 'new' ? undefined : r)); };
  const set = (n: string, val: unknown) => setV(x => ({ ...x, [n]: val }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrs({}); const isNew = row === 'new';
    try { await api(isNew ? writePath : `${writePath}/${row.id}`, { method: isNew ? 'POST' : 'PUT', body: toBody(fields, v, !isNew) }); toast(isNew ? 'Created' : 'Saved'); setRow(null); qc.invalidateQueries({ queryKey: ['resource', listPath] }); }
    catch (x) { setErrs(fieldErrors(x)); toast(x instanceof ApiError ? (Object.keys(fieldErrors(x)).length ? 'Please fix the highlighted fields' : x.message) : 'Could not save', 'err'); } finally { setBusy(false); }
  }
  async function del(r: any) { if (!confirm('Delete this item? This cannot be undone.')) return; try { await api(`${writePath}/${r.id}`, { method: 'DELETE' }); toast('Deleted'); qc.invalidateQueries({ queryKey: ['resource', listPath] }); } catch (x) { toast(x instanceof ApiError ? x.message : 'Could not delete', 'err'); } }
  return <div><PageTitle title={title} sub={sub}>{searchable && paged && <SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} />}<button className="btn-dark" onClick={() => open('new')}>{addLabel}</button></PageTitle>
    {isLoading ? <Loading /> : error ? <p role="alert" className="text-red-700">Could not load data.</p> : <><Table head={[...columns.map(c => c.header), 'Actions']} empty={data?.items.length ? undefined : 'Nothing here yet.'}>
      {data?.items.map(r => <tr key={r.id}>{columns.map(c => <td key={c.header}>{c.cell(r)}</td>)}<td className="whitespace-nowrap"><button className="mr-3 text-espresso underline" onClick={() => open(r)}>Edit</button><button className="text-red-700 underline" onClick={() => del(r)}>Delete</button></td></tr>)}</Table>
      {paged && data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}
    <Modal open={!!row} onClose={() => setRow(null)} title={row === 'new' ? addLabel : 'Edit'}><form onSubmit={save} className="space-y-4" noValidate>
      {fields.map(f => { const err = errs[f.name]?.[0]; const id = `f-${f.name}`; const val = v[f.name];
        if (f.type === 'image') return <ImageField key={f.name} label={f.label} value={val ?? ''} onChange={x => set(f.name, x)} folder={f.folder} spec={f.name === 'image' && v.placement === 'promo' ? 'promo' : f.spec} error={err} />;
        if (f.type === 'checkbox') return <label key={f.name} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!val} onChange={e => set(f.name, e.target.checked)} className="h-4 w-4 accent-[#C58B52]" />{f.label}</label>;
        return <Field key={f.name} label={f.label + (f.required ? ' *' : '')} htmlFor={id} error={err} hint={f.hint}>
          {f.type === 'textarea' ? <textarea id={id} className="input min-h-24" value={val ?? ''} onChange={e => set(f.name, e.target.value)} />
            : f.type === 'select' ? <select id={id} className="input" value={val ?? ''} onChange={e => set(f.name, e.target.value)}>{f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            : <input id={id} className="input" type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} step={f.type === 'number' ? 'any' : undefined} value={val ?? ''} onChange={e => set(f.name, e.target.value)} />}</Field>; })}
      <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button></form></Modal></div>;
}
