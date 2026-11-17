'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/components/toast';
import { Loading, Pager } from '@/components/ui';
import { PageTitle, Table } from '@/components/admin/kit';
import { api, downloadFile } from '@/lib/api';
import { fmtDate, type Paged } from '@/lib/types';
export default function Newsletter() {
  const toast = useToast(); const [page, setPage] = useState(1); const { data, isLoading } = useQuery({ queryKey: ['admin-newsletter', page], queryFn: () => api<Paged<{ id: string; email: string; isActive: boolean; createdAt: string }>>(`/admin/newsletter?page=${page}&limit=20`) });
  return <div><PageTitle title="Newsletter subscribers" sub={data ? `${data.total} subscribers` : undefined}><button className="btn-dark" onClick={() => downloadFile('/admin/newsletter?format=csv', 'newsletter-subscribers.csv').catch(() => toast('Download failed', 'err'))}>Download CSV</button></PageTitle>
    {isLoading ? <Loading /> : <><Table head={['Email', 'Subscribed', 'Active']} empty={data?.items.length ? undefined : 'No subscribers yet.'}>{data?.items.map(s => <tr key={s.id}><td>{s.email}</td><td>{fmtDate(s.createdAt)}</td><td>{s.isActive ? 'Yes' : 'No'}</td></tr>)}</Table>{data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}</div>;
}
