'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Field, Loading, Modal, Pager } from '@/components/ui';
import { PageTitle, Table, Tabs } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
import { fmtDate, type Paged } from '@/lib/types';
interface Row { id: string; name: string; sku: string; stockQuantity: number; status: 'ok' | 'low' | 'out' }
interface Hist { id: string; product?: { name: string; sku: string }; type: string; change: number; balanceAfter: number; reason?: string; createdAt: string }
export default function Inventory() {
  const qc = useQueryClient(); const toast = useToast(); const [tab, setTab] = useState('all'); const [page, setPage] = useState(1); const [hp, setHp] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['inventory', tab, page], queryFn: () => api<Paged<Row> & { threshold: number }>(`/admin/inventory?status=${tab}&page=${page}&limit=15`) });
  const { data: hist } = useQuery({ queryKey: ['inv-history', hp], queryFn: () => api<Paged<Hist>>(`/admin/inventory/history?page=${hp}&limit=10`) });
  const [row, setRow] = useState<Row | null>(null); const [mode, setMode] = useState<'change' | 'set'>('change'); const [val, setVal] = useState(''); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!row) return; setBusy(true);
    try { await api(`/admin/inventory/${row.id}`, { method: 'PUT', body: { [mode]: Number(val), reason } }); toast('Stock updated'); setRow(null); setVal(''); setReason(''); qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['inv-history'] }); }
    catch (x) { toast(x instanceof ApiError ? (x.errors?.reason?.[0] ?? x.message) : 'Failed', 'err'); } finally { setBusy(false); }
  }
  const tone = (s: Row['status']) => (s === 'out' ? 'bg-red-100 text-red-800' : s === 'low' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800');
  return <div className="space-y-8"><div><PageTitle title="Inventory" sub={data ? `Low-stock threshold: ${data.threshold} (change it in Settings). Stock can never go below zero.` : undefined} />
    <Tabs value={tab} onChange={v => { setTab(v); setPage(1); }} tabs={[['all', 'All'], ['low', 'Low stock'], ['out', 'Out of stock']]} />
    {isLoading ? <Loading /> : <><Table head={['Product', 'SKU', 'Stock', 'Status', '']} empty={data?.items.length ? undefined : 'Nothing here.'}>{data?.items.map(r => <tr key={r.id}><td className="font-medium">{r.name}</td><td>{r.sku}</td><td>{r.stockQuantity}</td><td><span className={`rounded-full px-2.5 py-0.5 text-xs ${tone(r.status)}`}>{r.status === 'ok' ? 'In stock' : r.status === 'low' ? 'Low' : 'Out of stock'}</span></td><td><button className="underline" onClick={() => { setRow(r); setMode('change'); setVal(''); setReason(''); }}>Adjust</button></td></tr>)}</Table>{data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}</div>
    <div><h2 className="mb-2 font-display text-lg text-espresso">Stock history</h2><Table head={['Date', 'Product', 'Type', 'Change', 'Balance', 'Reason']} empty={hist?.items.length ? undefined : 'No movements yet.'}>{hist?.items.map(h => <tr key={h.id}><td>{fmtDate(h.createdAt)}</td><td>{h.product?.name ?? '—'}</td><td>{h.type}</td><td className={h.change < 0 ? 'text-red-700' : 'text-green-800'}>{h.change > 0 ? `+${h.change}` : h.change}</td><td>{h.balanceAfter}</td><td>{h.reason}</td></tr>)}</Table>{hist && <Pager page={hist.page} pages={hist.pages} onChange={setHp} />}</div>
    <Modal open={!!row} onClose={() => setRow(null)} title={`Adjust stock — ${row?.name ?? ''}`}><form onSubmit={save} className="space-y-4"><p className="text-sm">Current stock: <b>{row?.stockQuantity}</b></p>
      <div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={mode === 'change'} onChange={() => setMode('change')} />Add / remove</label><label className="flex items-center gap-2"><input type="radio" checked={mode === 'set'} onChange={() => setMode('set')} />Set exact quantity</label></div>
      <Field label={mode === 'change' ? 'Change (use − to remove)' : 'New quantity'} htmlFor="iv"><input id="iv" type="number" step={1} min={mode === 'set' ? 0 : undefined} className="input" value={val} onChange={e => setVal(e.target.value)} required /></Field>
      <Field label="Reason *" htmlFor="ir"><input id="ir" className="input" value={reason} onChange={e => setReason(e.target.value)} minLength={2} required placeholder="e.g. New delivery, damaged stock" /></Field><button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Saving…' : 'Update stock'}</button></form></Modal></div>;
}
