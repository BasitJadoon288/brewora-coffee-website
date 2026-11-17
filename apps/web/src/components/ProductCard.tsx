import Link from 'next/link';
import { Star } from 'lucide-react';
import { money, type Product } from '@/lib/types';
import ProductImage from './ProductImage';
import WishlistButton from './WishlistButton';

export default function ProductCard({ p }: { p: Product }) {
  const sale = p.discountPrice != null && p.discountPrice < p.price;
  return (
    <Link href={`/product/${p.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-soft transition hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden">
        <ProductImage src={p.images?.[0]?.url} alt={p.images?.[0]?.alt || p.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <WishlistButton productId={p.id} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-soft" />
        {sale && <span className="absolute left-3 top-3 rounded-full bg-caramel px-3 py-1 text-xs font-semibold text-espresso">Sale</span>}
        {p.stockQuantity === 0 && <span className="absolute bottom-3 left-3 rounded-full bg-charcoal px-3 py-1 text-xs text-cream">Sold out</span>}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg text-espresso">{p.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-charcoal/60">{p.shortDescription}</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-semibold text-espresso">{money(sale ? p.discountPrice! : p.price)} {sale && <span className="ml-1 text-sm font-normal text-charcoal/40 line-through">{money(p.price)}</span>}</p>
          {!!p.ratingCount && <span className="flex items-center gap-1 text-sm text-charcoal/70"><Star className="h-4 w-4 fill-caramel text-caramel" aria-hidden />{p.ratingAverage?.toFixed(1)}</span>}
        </div>
      </div>
    </Link>
  );
}
