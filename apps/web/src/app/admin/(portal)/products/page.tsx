'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/toast';
import { Badge, Modal, Pager, Skeleton } from '@/components/ui';
import { PageTitle, SearchBox, Table, useDebounced } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
import { money, type Category, type Paged, type Product } from '@/lib/types';

type SortKey = 'price' | 'stock'; type Status = '' | 'active' | 'hidden';
const priceOf = (p: Product) => p.discountPrice ?? p.price;
const iconBtn = 'inline-flex h-8 w-8 items-center justify-center rounded-full text-espresso transition hover:bg-espresso/10 active:scale-95';

export default function Products() {
  const qc = useQueryClient(); const toast = useToast();
  const [q, setQ] = useState(''); const dq = useDebounced(q); const [cat, setCat] = useState(''); const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>(''); const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set()); const [confirm, setConfirm] = useState<Product[] | null>(null); const [busy, setBusy] = useState(false);
  const { data: cats } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<Category[]>('/admin/categories') });
  const { data, isLoading } = useQuery({ queryKey: ['admin-products', dq, cat, page], queryFn: () => api<Paged<Product>>(`/admin/products?page=${page}&limit=15${dq ? `&q=${encodeURIComponent(dq)}` : ''}${cat ? `&category=${cat}` : ''}`) });
  const refresh = () => { setSel(new Set()); return qc.invalidateQueries({ queryKey: ['admin-products'] }); };

  // Status filter and sorting apply to the products on the current page.
  const rows = useMemo(() => {
    let r = data?.items ?? [];
    if (status) r = r.filter(p => p.isActive === (status === 'active'));
    if (sort) r = [...r].sort((a, b) => sort.dir * ((sort.key === 'price' ? priceOf(a) - priceOf(b) : a.stockQuantity - b.stockQuantity)));
    return r;
  }, [data, status, sort]);
  const allSelected = rows.length > 0 && rows.every(p => sel.has(p.id));
  const toggleSel = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const picked = rows.filter(p => sel.has(p.id));
  const cycleSort = (key: SortKey) => setSort(s => !s || s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null);
  const fail = (x: unknown) => toast(x instanceof ApiError ? x.message : 'Failed', 'err');

  async function setActive(list: Product[], isActive: boolean) {
    setBusy(true);
    try { await Promise.all(list.map(p => api(`/products/${p.id}`, { method: 'PUT', body: { isActive } }))); toast(list.length > 1 ? `${list.length} products ${isActive ? 'activated' : 'hidden'}` : isActive ? 'Product is now active' : 'Product hidden from the shop'); await refresh(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function remove(list: Product[]) {
    setBusy(true);
    try { await Promise.all(list.map(p => api(`/products/${p.id}`, { method: 'DELETE' }))); toast(list.length > 1 ? `${list.length} products deleted` : 'Product deleted'); setConfirm(null); await refresh(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  const SortHead = ({ k, label }: { k: SortKey; label: string }) => { const on = sort?.key === k; const I = !on ? ArrowUpDown : sort!.dir === 1 ? ArrowUp : ArrowDown;
    return <button onClick={() => cycleSort(k)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-espresso" aria-label={`Sort by ${label}`}>{label}<I className={`h-3 w-3 ${on ? 'text-caramel' : 'opacity-50'}`} /></button>; };

  return <div>
    <PageTitle title="Products" sub={data ? `${data.total} products` : undefined}><SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search name or SKU…" />
      <select aria-label="Filter by category" className="input w-auto" value={cat} onChange={e => { setCat(e.target.value); setPage(1); }}><option value="">All categories</option>{cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select aria-label="Filter by status" className="input w-auto" value={status} onChange={e => setStatus(e.target.value as Status)}><option value="">All status</option><option value="active">Active</option><option value="hidden">Hidden</option></select>
      <Link href="/admin/products/new" className="btn-dark">Add product</Link></PageTitle>

    {picked.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-espresso px-4 py-3 text-sm text-cream shadow-soft">
      <b>{picked.length} selected</b><span className="flex-1" />
      <button disabled={busy} className="rounded-full bg-cream/15 px-4 py-1.5 hover:bg-cream/25 disabled:opacity-50" onClick={() => setActive(picked, true)}>Show</button>
      <button disabled={busy} className="rounded-full bg-cream/15 px-4 py-1.5 hover:bg-cream/25 disabled:opacity-50" onClick={() => setActive(picked, false)}>Hide</button>
      <button disabled={busy} className="rounded-full bg-red-600 px-4 py-1.5 hover:bg-red-500 disabled:opacity-50" onClick={() => setConfirm(picked)}>Delete</button>
      <button className="px-2 underline" onClick={() => setSel(new Set())}>Clear</button></div>}

    {isLoading ? <div className="space-y-3 rounded-2xl bg-white p-4 shadow-soft" role="status" aria-label="Loading">{Array.from({ length: 7 }, (_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="h-10 w-10" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/6" /><Skeleton className="ml-auto h-4 w-1/6" /></div>)}</div>
    : <><Table head={['', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions']} empty={rows.length ? undefined : 'No products found.'} headCells={{ 0: <input type="checkbox" aria-label="Select all" className="h-4 w-4 accent-[#C58B52]" checked={allSelected} onChange={() => setSel(allSelected ? new Set() : new Set(rows.map(p => p.id)))} />, 3: <SortHead k="price" label="Price" />, 4: <SortHead k="stock" label="Stock" /> }}>
      {rows.map(p => { const out = p.stockQuantity === 0; const low = !out && p.stockQuantity <= 10;
        return <tr key={p.id} className={sel.has(p.id) ? 'bg-caramel/10' : ''}>
        <td className="w-24"><div className="flex items-center gap-3"><input type="checkbox" aria-label={`Select ${p.name}`} className="h-4 w-4 accent-[#C58B52]" checked={sel.has(p.id)} onChange={() => toggleSel(p.id)} /><ProductImage src={p.images[0]?.url} alt={p.name} className="h-10 w-10 rounded-lg" /></div></td>
        <td><b>{p.name}</b><div className="text-xs text-charcoal/50">{p.sku}{p.isFeatured && ' · Featured'}{p.isBestSeller && ' · Best seller'}</div></td><td>{p.category?.name ?? '—'}</td>
        <td>{p.discountPrice != null ? <><b>{money(p.discountPrice)}</b> <s className="text-charcoal/40">{money(p.price)}</s></> : money(p.price)}</td>
        <td>{out ? <Badge value="Out of stock" /> : <span className={low ? 'font-semibold text-red-700' : ''}>{p.stockQuantity}{low && <span className="ml-2"><Badge value="Low stock" /></span>}</span>}</td>
        <td><Badge value={p.isActive ? 'Active' : 'Hidden'} /></td>
        <td className="whitespace-nowrap"><Link href={`/admin/products/${p.id}`} className={iconBtn} title="Edit" aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Link>
          <button className={iconBtn} disabled={busy} title={p.isActive ? 'Hide' : 'Show'} aria-label={p.isActive ? `Hide ${p.name}` : `Show ${p.name}`} onClick={() => setActive([p], !p.isActive)}>{p.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          <button className={`${iconBtn} !text-red-700 hover:!bg-red-50`} title="Delete" aria-label={`Delete ${p.name}`} onClick={() => setConfirm([p])}><Trash2 className="h-4 w-4" /></button></td></tr>; })}</Table>
      {data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}

    <Modal open={!!confirm} onClose={() => !busy && setConfirm(null)} title="Delete product?">
      <p className="text-sm text-charcoal/80">{confirm && confirm.length > 1 ? `${confirm.length} products will be deleted.` : <>“{confirm?.[0]?.name}” will be deleted.</>} Past orders keep their own copy of the product details. This cannot be undone.</p>
      <div className="mt-5 flex justify-end gap-2"><button className="rounded-full bg-white px-5 py-2 text-sm shadow-soft" disabled={busy} onClick={() => setConfirm(null)}>Cancel</button>
        <button className="rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50" disabled={busy} onClick={() => confirm && remove(confirm)}>{busy ? 'Deleting…' : 'Delete'}</button></div></Modal>
  </div>;
}
