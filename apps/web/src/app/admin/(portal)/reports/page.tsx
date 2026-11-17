'use client';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Field, Loading } from '@/components/ui';
import { Card, PageTitle, Table } from '@/components/admin/kit';
import { api, ApiError, downloadFile } from '@/lib/api';
const TYPES: [string, string][] = [['sales', 'Sales (daily / weekly / monthly / yearly)'], ['revenue', 'Revenue'], ['orders', 'Orders'], ['customers', 'Customers'], ['products', 'Product performance']];
export default function Reports() {
  const toast = useToast(); const [type, setType] = useState('sales'); const [period, setPeriod] = useState('daily'); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [rows, setRows] = useState<Record<string, unknown>[] | null>(null); const [busy, setBusy] = useState(false);
  const qs = (extra = '') => `type=${type}&period=${period}${from ? `&from=${from}` : ''}${to ? `&to=${to}T23:59:59` : ''}${extra}`; const usesPeriod = type === 'sales' || type === 'revenue';
  async function run(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { setRows((await api<{ rows: Record<string, unknown>[] }>(`/admin/reports?${qs()}`)).rows); } catch (x) { toast(x instanceof ApiError ? x.message : 'Could not run report', 'err'); } finally { setBusy(false); } }
  const cols = rows?.[0] ? Object.keys(rows[0]) : [];
  return <div className="space-y-6"><PageTitle title="Reports" sub="Run a report, view it here, or export it as CSV." />
    <Card><form onSubmit={run} className="grid items-end gap-4 md:grid-cols-5"><Field label="Report" htmlFor="rt"><select id="rt" className="input" value={type} onChange={e => setType(e.target.value)}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Period" htmlFor="rp"><select id="rp" className="input disabled:opacity-50" disabled={!usesPeriod} value={period} onChange={e => setPeriod(e.target.value)}>{['daily', 'weekly', 'monthly', 'yearly'].map(p => <option key={p}>{p}</option>)}</select></Field>
      <Field label="From" htmlFor="rf"><input id="rf" type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /></Field><Field label="To" htmlFor="rto"><input id="rto" type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></Field>
      <div className="flex gap-2"><button disabled={busy} className="btn-dark disabled:opacity-60">{busy ? 'Running…' : 'Run'}</button><button type="button" className="btn border border-espresso text-espresso" onClick={() => downloadFile(`/admin/reports?${qs('&format=csv')}`, `brewora-${type}-${period}.csv`).catch(() => toast('Download failed', 'err'))}>CSV</button></div></form></Card>
    {busy ? <Loading /> : rows && <Table head={cols} empty={rows.length ? undefined : 'No data for this selection.'}>{rows.map((r, i) => <tr key={i}>{cols.map(c => <td key={c}>{String(r[c] instanceof Object ? '' : r[c] ?? '')}</td>)}</tr>)}</Table>}</div>;
}
