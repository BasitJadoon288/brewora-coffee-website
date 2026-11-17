'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { useToast } from '@/components/toast';
import { Empty, Loading } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { money, type Product } from '@/lib/types';
export default function Wishlist() {
  const qc = useQueryClient(); const toast = useToast(); const { refresh } = useCart(); const { data, isLoading } = useQuery({ queryKey: ['wishlist'], queryFn: () => api<{ products: Product[] }>('/wishlist') });
  const done = () => qc.invalidateQueries({ queryKey: ['wishlist'] });
  async function remove(p: Product) { try { await api(`/wishlist/${p.id}`, { method: 'DELETE' }); toast('Removed'); done(); } catch { toast('Could not remove', 'err'); } }
  async function move(p: Product) { try { await api(`/wishlist/${p.id}/move-to-cart`, { method: 'POST' }); await refresh(); toast(`${p.name} moved to cart`); done(); } catch (x) { toast(x instanceof ApiError ? x.message : 'Could not move to cart', 'err'); } }
  return <div><h1 className="font-display text-3xl text-espresso">My wishlist</h1>
    {isLoading ? <Loading /> : !data?.products.length ? <div className="mt-6"><Empty title="Your wishlist is empty" text="Tap the heart on any product to save it here."><Link href="/shop" className="btn-dark">Browse the shop</Link></Empty></div> :
      <ul className="mt-6 space-y-4">{data.products.map(p => <li key={p.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-soft"><ProductImage src={p.images[0]?.url} alt={p.name} className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1"><Link href={`/product/${p.slug}`} className="font-display text-lg text-espresso hover:underline">{p.name}</Link><p className="text-sm text-charcoal/70">{money(p.discountPrice ?? p.price)}{p.stockQuantity === 0 && ' · Out of stock'}</p></div>
        <button disabled={p.stockQuantity === 0} onClick={() => move(p)} className="btn-gold px-4 py-2 disabled:opacity-40">Move to cart</button><button onClick={() => remove(p)} className="text-sm text-red-700 underline">Remove</button></li>)}</ul>}</div>;
}
