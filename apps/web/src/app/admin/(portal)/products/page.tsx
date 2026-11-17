'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/toast';
import { Badge, Loading, Pager } from '@/components/ui';
import { PageTitle, SearchBox, Table, useDebounced } from '@/components/admin/kit';
import { api, ApiError } from '@/lib/api';
import { money, type Category, type Paged, type Product } from '@/lib/types';
export default function Products() {
  const qc = useQueryClient(); const toast = useToast(); const [q, setQ] = useState(''); const dq = useDebounced(q); const [cat, setCat] = useState(''); const [page, setPage] = useState(1);
  const { data: cats } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<Category[]>('/admin/categories') });
  const { data, isLoading } = useQuery({ queryKey: ['admin-products', dq, cat, page], queryFn: () => api<Paged<Product>>(`/admin/products?page=${page}&limit=15${dq ? `&q=${encodeURIComponent(dq)}` : ''}${cat ? `&category=${cat}` : ''}`) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-products'] });
  async function toggle(p: Product) { try { await api(`/products/${p.id}`, { method: 'PUT', body: { isActive: !p.isActive } }); toast(p.isActive ? 'Product hidden from the shop' : 'Product is now active'); refresh(); } catch (x) { toast(x instanceof ApiError ? x.message : 'Failed', 'err'); } }
  async function del(p: Product) { if (!confirm(`Delete “${p.name}”? Past orders keep their own copy of the product details.`)) return; try { await api(`/products/${p.id}`, { method: 'DELETE' }); toast('Product deleted'); refresh(); } catch (x) { toast(x instanceof ApiError ? x.message : 'Failed', 'err'); } }
  return <div><PageTitle title="Products" sub={data ? `${data.total} products` : undefined}><SearchBox value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search name or SKU…" />
    <select aria-label="Filter by category" className="input w-auto" value={cat} onChange={e => { setCat(e.target.value); setPage(1); }}><option value="">All categories</option>{cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Link href="/admin/products/new" className="btn-dark">Add product</Link></PageTitle>
    {isLoading ? <Loading /> : <><Table head={['', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions']} empty={data?.items.length ? undefined : 'No products found.'}>
      {data?.items.map(p => <tr key={p.id}><td><ProductImage src={p.images[0]?.url} alt={p.name} className="h-10 w-10 rounded-lg" /></td><td><b>{p.name}</b><div className="text-xs text-charcoal/50">{p.sku}{p.isFeatured && ' · Featured'}{p.isBestSeller && ' · Best seller'}</div></td><td>{p.category?.name ?? '—'}</td>
        <td>{p.discountPrice != null ? <><b>{money(p.discountPrice)}</b> <s className="text-charcoal/40">{money(p.price)}</s></> : money(p.price)}</td><td className={p.stockQuantity === 0 ? 'font-semibold text-red-700' : p.stockQuantity <= 10 ? 'text-amber-700' : ''}>{p.stockQuantity}</td><td><Badge value={p.isActive ? 'Confirmed' : 'Cancelled'} /></td>
        <td className="whitespace-nowrap"><Link href={`/admin/products/${p.id}`} className="mr-3 underline">Edit</Link><button className="mr-3 underline" onClick={() => toggle(p)}>{p.isActive ? 'Hide' : 'Show'}</button><button className="text-red-700 underline" onClick={() => del(p)}>Delete</button></td></tr>)}</Table>
      {data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}</>}</div>;
}
