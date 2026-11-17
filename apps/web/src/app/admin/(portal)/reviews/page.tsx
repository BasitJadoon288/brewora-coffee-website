'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Badge, Loading, Pager } from '@/components/ui';
import { PageTitle, Table, Tabs } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
import { fmtDate, type Paged } from '@/lib/types';
interface R { id: string; product?: { name: string; slug: string }; userName?: string; rating: number; comment?: string; isApproved: boolean; isVerifiedPurchase: boolean; createdAt: string }
export default function Reviews() {
  const qc = useQueryClient(); const toast = useToast(); const [tab, setTab] = useState(''); const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['admin-reviews', tab, page], queryFn: () => api<Paged<R>>(`/admin/reviews?page=${page}&limit=15${tab ? `&approved=${tab}` : ''}`) });
  const done = () => qc.invalidateQueries({ queryKey: ['admin-reviews'] });
  async function approve(r: R) { try { await api(`/admin/reviews/${r.id}/approval`, { method: 'PUT', body: { isApproved: !r.isApproved } }); toast(r.isApproved ? 'Review hidden' : 'Review published'); done(); } catch (x) { toast(x instanceof ApiError ? x.message : 'Failed', 'err'); } }
  async function del(r: R) { if (!confirm('Delete this review permanently?')) return; try { await api(`/admin/reviews/${r.id}`, { method: 'DELETE' }); toast('Review deleted'); done(); } catch (x) { toast(x instanceof ApiError ? x.message : 'Failed', 'err'); } }
  return <div><PageTitle title="Reviews" sub="Hide or delete reviews. Product ratings update automatically." /><Tabs value={tab} onChange={v => { setTab(v); setPage(1); }} tabs={[['', 'All'], ['true', 'Published'], ['false', 'Hidden']]} />
    {isLoading ? <Loading /> : <><Table head={['Product', 'Rating', 'Review', 'By', 'Date', 'Status', '']} empty={data?.items.length ? undefined : 'No reviews.'}>{data?.items.map(r => <tr key={r.id}><td>{r.product ? <Link href={`/product/${r.product.slug}`} className="underline">{r.product.name}</Link> : '—'}</td><td>{'★'.repeat(r.rating)}</td><td className="max-w-xs">{r.comment ?? <span className="text-charcoal/40">No comment</span>}</td><td>{r.userName}{r.isVerifiedPurchase && <div className="text-xs text-green-800">Verified purchase</div>}</td><td>{fmtDate(r.createdAt)}</td><td><Badge value={r.isApproved ? 'Confirmed' : 'Cancelled'} /></td>
      <td className="whitespace-nowrap"><button className="mr-3 underline" onClick={() => approve(r)}>{r.isApproved ? 'Hide' : 'Publish'}</button><button className="text-red-700 underline" onClick={() => del(r)}>Delete</button></td></tr>)}</Table>{data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}</div>;
}
