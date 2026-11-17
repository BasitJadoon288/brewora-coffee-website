'use client';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { fmtDate, type Paged, type Review } from '@/lib/types';
import { useAuth } from './auth';
import { useToast } from './toast';
const Stars = ({ n }: { n: number }) => <span aria-label={`${n} out of 5`} className="inline-flex">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`h-4 w-4 ${i <= n ? 'fill-caramel text-caramel' : 'text-charcoal/20'}`} aria-hidden />)}</span>;
export default function Reviews({ productId }: { productId: string }) {
  const { user } = useAuth(); const toast = useToast(); const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['reviews', productId], queryFn: () => api<Paged<Review>>(`/products/${productId}/reviews?limit=20`) });
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await api(`/products/${productId}/reviews`, { method: 'POST', body: { rating, comment: comment || undefined } }); setComment(''); toast('Thanks for your review!'); qc.invalidateQueries({ queryKey: ['reviews', productId] }); }
    catch (err) { toast(err instanceof ApiError ? err.message : 'Could not submit review', 'err'); } finally { setBusy(false); }
  }
  return (<section className="mt-16"><h2 className="font-display text-2xl text-espresso">Customer reviews {data ? `(${data.total})` : ''}</h2>
    <div className="mt-6 grid gap-8 md:grid-cols-[1fr_340px]">
      <div className="space-y-4">{data?.items.length === 0 && <p className="text-charcoal/60">No reviews yet. Be the first to review this product.</p>}
        {data?.items.map(r => <article key={r.id} className="rounded-2xl bg-white p-5 shadow-soft"><div className="flex items-center justify-between"><Stars n={r.rating} /><time className="text-xs text-charcoal/50">{fmtDate(r.createdAt)}</time></div>
          {r.comment && <p className="mt-2 text-sm text-charcoal/80">{r.comment}</p>}<p className="mt-2 text-xs text-charcoal/50">{r.userName}{r.isVerifiedPurchase && ' · Verified purchase'}</p></article>)}</div>
      <div className="h-fit rounded-2xl bg-white p-5 shadow-soft">{user ? <form onSubmit={submit} className="space-y-3"><p className="font-semibold">Write a review</p>
        <div><label htmlFor="rt" className="mb-1 block text-sm">Rating</label><select id="rt" className="input" value={rating} onChange={e => setRating(+e.target.value)}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</select></div>
        <div><label htmlFor="rc" className="mb-1 block text-sm">Your review (optional)</label><textarea id="rc" className="input min-h-24" maxLength={2000} value={comment} onChange={e => setComment(e.target.value)} /></div>
        <button disabled={busy} className="btn-dark w-full disabled:opacity-60">{busy ? 'Submitting…' : 'Submit review'}</button></form>
        : <p className="text-sm"><Link href={`/login?next=${encodeURIComponent(typeof window === 'undefined' ? '/shop' : window.location.pathname)}`} className="font-semibold text-caramel underline">Sign in</Link> to write a review.</p>}</div></div></section>);
}
