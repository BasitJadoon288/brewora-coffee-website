'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '../toast';
import { Field } from '../ui';
import { api, ApiError } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import ImageField from './ImageField';
import { Card, fieldErrors } from './kit';
const blank = { name: '', slug: '', shortDescription: '', description: '', price: '', discountPrice: '', categoryId: '', sku: '', stockQuantity: '0', isFeatured: false, isBestSeller: false, isActive: true,
  images: [] as { url: string; alt: string }[], variants: [] as { name: string; size: string; priceDelta: string }[], specs: [] as { k: string; v: string }[] };
const fromProduct = (p: Product) => ({ name: p.name, slug: p.slug, shortDescription: p.shortDescription ?? '', description: p.description, price: String(p.price), discountPrice: p.discountPrice != null ? String(p.discountPrice) : '', categoryId: p.categoryId ?? '', sku: p.sku, stockQuantity: String(p.stockQuantity),
  isFeatured: p.isFeatured, isBestSeller: p.isBestSeller, isActive: p.isActive, images: p.images.map(i => ({ url: i.url, alt: i.alt })), variants: p.variants.map(v => ({ name: v.name, size: v.size ?? '', priceDelta: String(v.priceDelta) })), specs: Object.entries(p.specifications ?? {}).map(([k, v]) => ({ k, v: String(v) })) });
export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter(); const toast = useToast(); const edit = !!product;
  const { data: cats } = useQuery({ queryKey: ['admin-categories'], queryFn: () => api<Category[]>('/admin/categories') });
  const [v, setV] = useState(product ? fromProduct(product) : blank); const [errs, setErrs] = useState<Record<string, string[]>>({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!edit && cats?.length && !v.categoryId) setV(x => ({ ...x, categoryId: cats[0].id })); }, [cats, edit, v.categoryId]);
  const set = (k: string, val: unknown) => setV(x => ({ ...x, [k]: val })); const text = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value);
  const setRow = (k: 'images' | 'variants' | 'specs', i: number, patch: object) => set(k, (v[k] as any[]).map((r, j) => (j === i ? { ...r, ...patch } : r))); const delRow = (k: 'images' | 'variants' | 'specs', i: number) => set(k, (v[k] as any[]).filter((_, j) => j !== i));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrs({});
    const body: Record<string, unknown> = { name: v.name.trim(), description: v.description.trim(), shortDescription: v.shortDescription.trim() || undefined, price: Number(v.price), categoryId: v.categoryId, sku: v.sku.trim(), stockQuantity: Number(v.stockQuantity || 0),
      isFeatured: v.isFeatured, isBestSeller: v.isBestSeller, isActive: v.isActive, images: v.images.filter(i => i.url.trim()).map(i => ({ url: i.url.trim(), alt: i.alt.trim() || v.name })),
      variants: v.variants.filter(x => x.name.trim()).map(x => ({ name: x.name.trim(), size: x.size.trim() || undefined, priceDelta: Number(x.priceDelta || 0) })), specifications: Object.fromEntries(v.specs.filter(s => s.k.trim()).map(s => [s.k.trim(), s.v])) };
    if (v.slug.trim()) body.slug = v.slug.trim(); body.discountPrice = v.discountPrice === '' ? (edit ? null : undefined) : Number(v.discountPrice);
    try { await api(edit ? `/products/${product!.id}` : '/products', { method: edit ? 'PUT' : 'POST', body }); toast(edit ? 'Product saved' : 'Product created'); router.push('/admin/products'); }
    catch (x) { setErrs(fieldErrors(x)); toast(x instanceof ApiError ? (Object.keys(fieldErrors(x)).length ? 'Please fix the highlighted fields' : x.message) : 'Could not save', 'err'); } finally { setBusy(false); }
  }
  const E = (k: string) => errs[k]?.[0];
  return <form onSubmit={submit} className="space-y-6" noValidate>
    <Card title="Basics"><div className="grid gap-4 md:grid-cols-2">
      <Field label="Name *" htmlFor="pn" error={E('name')}><input id="pn" className="input" value={v.name} onChange={text('name')} required /></Field>
      <Field label="URL slug" htmlFor="ps" error={E('slug')} hint="Optional — generated from the name."><input id="ps" className="input" value={v.slug} onChange={text('slug')} /></Field>
      <Field label="Category *" htmlFor="pc" error={E('categoryId')}><select id="pc" className="input" value={v.categoryId} onChange={text('categoryId')} required>{cats?.map(c => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (inactive)'}</option>)}</select></Field>
      <Field label="SKU *" htmlFor="pk" error={E('sku')}><input id="pk" className="input" value={v.sku} onChange={text('sku')} required /></Field>
      <div className="md:col-span-2"><Field label="Short description" htmlFor="psd"><input id="psd" className="input" value={v.shortDescription} onChange={text('shortDescription')} /></Field></div>
      <div className="md:col-span-2"><Field label="Description *" htmlFor="pd" error={E('description')}><textarea id="pd" className="input min-h-32" value={v.description} onChange={text('description')} required /></Field></div></div></Card>
    <Card title="Pricing & stock (PKR)"><div className="grid gap-4 md:grid-cols-3">
      <Field label="Regular price *" htmlFor="pp" error={E('price')}><input id="pp" type="number" min={0} step="any" className="input" value={v.price} onChange={text('price')} required /></Field>
      <Field label="Discounted price" htmlFor="pdp" error={E('discountPrice')} hint="Must be below the regular price. Empty = no discount."><input id="pdp" type="number" min={0} step="any" className="input" value={v.discountPrice} onChange={text('discountPrice')} /></Field>
      <Field label={edit ? 'Stock quantity' : 'Opening stock'} htmlFor="pst" error={E('stockQuantity')} hint={edit ? 'Changes are recorded in the inventory history.' : undefined}><input id="pst" type="number" min={0} className="input" value={v.stockQuantity} onChange={text('stockQuantity')} required /></Field></div></Card>
    <Card title="Images"><div className="space-y-4">{v.images.map((im, i) => <div key={i} className="rounded-xl border border-espresso/10 p-3"><ImageField label={`Image ${i + 1}`} value={im.url} onChange={u => setRow('images', i, { url: u })} folder="products" spec="product" error={E(`images`)} />
      <div className="mt-2 flex items-end gap-3"><div className="flex-1"><Field label="Alt text" htmlFor={`alt${i}`}><input id={`alt${i}`} className="input" value={im.alt} onChange={e => setRow('images', i, { alt: e.target.value })} /></Field></div><button type="button" className="text-sm text-red-700 underline" onClick={() => delRow('images', i)}>Remove</button></div></div>)}
      <button type="button" className="btn-dark" onClick={() => set('images', [...v.images, { url: '', alt: '' }])}>Add image</button></div></Card>
    <Card title="Sizes / variants"><p className="mb-3 text-sm text-charcoal/60">Each variant can add to the base price (price difference). Stock is tracked for the whole product.</p>
      <div className="space-y-3">{v.variants.map((x, i) => <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"><Field label="Name" htmlFor={`vn${i}`}><input id={`vn${i}`} className="input" value={x.name} onChange={e => setRow('variants', i, { name: e.target.value })} /></Field><Field label="Size label" htmlFor={`vs${i}`}><input id={`vs${i}`} className="input" value={x.size} onChange={e => setRow('variants', i, { size: e.target.value })} /></Field>
        <Field label="Price difference" htmlFor={`vp${i}`}><input id={`vp${i}`} type="number" step="any" className="input" value={x.priceDelta} onChange={e => setRow('variants', i, { priceDelta: e.target.value })} /></Field><button type="button" className="pb-2 text-sm text-red-700 underline" onClick={() => delRow('variants', i)}>Remove</button></div>)}
        <button type="button" className="btn-dark" onClick={() => set('variants', [...v.variants, { name: '', size: '', priceDelta: '0' }])}>Add variant</button></div></Card>
    <Card title="Specifications"><div className="space-y-3">{v.specs.map((s, i) => <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_2fr_auto]"><Field label="Name" htmlFor={`sk${i}`}><input id={`sk${i}`} className="input" value={s.k} onChange={e => setRow('specs', i, { k: e.target.value })} /></Field><Field label="Value" htmlFor={`sv${i}`}><input id={`sv${i}`} className="input" value={s.v} onChange={e => setRow('specs', i, { v: e.target.value })} /></Field><button type="button" className="pb-2 text-sm text-red-700 underline" onClick={() => delRow('specs', i)}>Remove</button></div>)}
      <button type="button" className="btn-dark" onClick={() => set('specs', [...v.specs, { k: '', v: '' }])}>Add specification</button></div></Card>
    <Card title="Visibility"><div className="flex flex-wrap gap-6 text-sm">{([['isActive', 'Active (visible in the shop)'], ['isFeatured', 'Featured'], ['isBestSeller', 'Best seller']] as const).map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[#C58B52]" checked={v[k]} onChange={e => set(k, e.target.checked)} />{l}</label>)}</div></Card>
    <div className="flex gap-3"><button disabled={busy} className="btn-gold disabled:opacity-60">{busy ? 'Saving…' : edit ? 'Save product' : 'Create product'}</button><button type="button" className="btn border border-espresso text-espresso" onClick={() => router.push('/admin/products')}>Cancel</button></div></form>;
}
