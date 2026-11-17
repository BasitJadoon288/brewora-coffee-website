'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Loading, Pager } from '@/components/ui';
import { PageTitle } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
import { fmtDate, type Paged } from '@/lib/types';
interface M { id: string; name: string; email: string; phone?: string; subject?: string; message: string; isRead: boolean; createdAt: string }
export default function Messages() {
  const qc = useQueryClient(); const toast = useToast(); const [page, setPage] = useState(1); const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admin-messages', page], queryFn: () => api<Paged<M>>(`/admin/messages?page=${page}&limit=15`) });
  const done = () => qc.invalidateQueries({ queryKey: ['admin-messages'] });
  async function read(m: M, isRead: boolean) { try { await api(`/admin/messages/${m.id}`, { method: 'PUT', body: { isRead } }); done(); } catch (x) { toast(x instanceof ApiError ? x.message : 'Failed', 'err'); } }
  async function del(m: M) { if (!confirm('Delete this message?')) return; try { await api(`/admin/messages/${m.id}`, { method: 'DELETE' }); toast('Deleted'); done(); } catch { toast('Failed', 'err'); } }
  return <div><PageTitle title="Messages" sub="Messages sent from the Contact page." />
    {isLoading ? <Loading /> : data?.items.length === 0 ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-charcoal/60 shadow-soft">No messages yet.</p> : <><ul className="space-y-3">{data?.items.map(m => <li key={m.id} className={`rounded-2xl bg-white p-4 shadow-soft ${m.isRead ? '' : 'border-l-4 border-caramel'}`}>
      <button className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open === m.id} onClick={() => { setOpen(open === m.id ? null : m.id); if (!m.isRead) read(m, true); }}><span><b>{m.subject || 'No subject'}</b> <span className="text-sm text-charcoal/60">— {m.name}</span></span><span className="shrink-0 text-xs text-charcoal/50">{fmtDate(m.createdAt)}</span></button>
      {open === m.id && <div className="mt-3 space-y-3 border-t border-espresso/10 pt-3 text-sm"><p className="whitespace-pre-wrap">{m.message}</p><p className="text-charcoal/60">{m.name} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a>{m.phone && ` · ${m.phone}`}</p>
        <div className="flex gap-4"><button className="underline" onClick={() => read(m, !m.isRead)}>Mark as {m.isRead ? 'unread' : 'read'}</button><button className="text-red-700 underline" onClick={() => del(m)}>Delete</button></div></div>}</li>)}</ul>{data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}</div>;
}
