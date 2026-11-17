'use client';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { money, type Product } from '@/lib/types';
import { useToast } from './toast';
import WishlistButton from './WishlistButton';
export default function ProductPurchase({ p }: { p: Product }) {
  const [variant, setVariant] = useState<string | undefined>(p.variants[0]?.name); const [qty, setQty] = useState(1); const [busy, setBusy] = useState(false);
  const { add } = useCart(); const toast = useToast(); const router = useRouter();
  const delta = p.variants.find(v => v.name === variant)?.priceDelta ?? 0; const unit = (p.discountPrice ?? p.price) + delta; const max = Math.min(p.stockQuantity, 50); const out = p.stockQuantity <= 0;
  async function addToCart(go: boolean) {
    setBusy(true);
    try { await add({ productId: p.id, variant, quantity: qty, name: p.name, slug: p.slug, image: p.images[0]?.url, unitPrice: unit }); if (go) router.push('/checkout'); else toast(`${p.name} added to cart`); }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Could not add to cart', 'err'); } finally { setBusy(false); }
  }
  return (<div className="mt-6 space-y-5">
    <p className="text-2xl font-semibold text-espresso">{money(unit * qty)} {qty > 1 && <span className="text-sm font-normal text-charcoal/50">({money(unit)} each)</span>}</p>
    {p.variants.length > 0 && <fieldset><legend className="mb-2 text-sm font-semibold">Size</legend><div className="flex flex-wrap gap-2">{p.variants.map(v => <label key={v.name} className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${variant === v.name ? 'border-espresso bg-espresso text-cream' : 'border-espresso/20 hover:border-espresso'}`}>
      <input type="radio" name="variant" className="sr-only" checked={variant === v.name} onChange={() => setVariant(v.name)} />{v.name}{v.priceDelta ? ` (+${money(v.priceDelta)})` : ''}</label>)}</div></fieldset>}
    <div className="flex items-center gap-3"><span className="text-sm font-semibold">Quantity</span>
      <div className="flex items-center rounded-full border border-espresso/20 bg-white"><button aria-label="Decrease quantity" className="p-3 disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(q => q - 1)}><Minus className="h-4 w-4" /></button><span className="w-10 text-center" aria-live="polite">{qty}</span><button aria-label="Increase quantity" className="p-3 disabled:opacity-40" disabled={qty >= max} onClick={() => setQty(q => q + 1)}><Plus className="h-4 w-4" /></button></div></div>
    <div className="flex flex-wrap gap-3"><button className="btn-gold flex-1 disabled:opacity-50" disabled={out || busy} onClick={() => addToCart(false)}><ShoppingBag className="h-4 w-4" />{out ? 'Out of stock' : 'Add to Cart'}</button>
      <button className="btn-dark flex-1 disabled:opacity-50" disabled={out || busy} onClick={() => addToCart(true)}>Buy Now</button></div>
    <WishlistButton productId={p.id} label className="text-espresso hover:underline" />
  </div>);
}
