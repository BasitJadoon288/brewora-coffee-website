import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import ProductPurchase from '@/components/ProductPurchase';
import Reviews from '@/components/Reviews';
import { serverGet } from '@/lib/server';
import { money, type Product } from '@/lib/types';
const load = (slug: string) => serverGet<Product | null>(`/api/products/slug/${encodeURIComponent(slug)}`, null);
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug); if (!p) return { title: 'Product not found', robots: { index: false } };
  const img = p.images[0]?.url; const desc = p.shortDescription || p.description?.slice(0, 160);
  return { title: p.name, description: desc, alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: 'website', title: p.name, description: desc, url: `/product/${p.slug}`, ...(img && { images: [{ url: img, alt: p.name }] }) }, twitter: { card: 'summary_large_image', title: p.name, description: desc, ...(img && { images: [img] }) } };
}
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug); if (!p) notFound();
  const price = p.discountPrice ?? p.price;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.shortDescription ?? p.description, sku: p.sku, image: p.images.map(i => i.url),
    offers: { '@type': 'Offer', priceCurrency: 'PKR', price, availability: p.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } };
  return (
    <div className="container-x py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <ProductGallery images={p.images} name={p.name} />
        <div>
          <h1 className="font-display text-3xl text-espresso md:text-4xl">{p.name}</h1>
                    <p className={`mt-2 text-sm ${p.stockQuantity > 0 ? 'text-green-700' : 'text-red-700'}`}>{p.stockQuantity > 10 ? 'In stock' : p.stockQuantity > 0 ? `Only ${p.stockQuantity} left` : 'Out of stock'}</p>
          <p className="mt-4 text-charcoal/80">{p.description}</p>
          <ProductPurchase p={p} />
          {p.specifications && <dl className="mt-6 divide-y divide-espresso/10 rounded-xl bg-white text-sm shadow-soft">{Object.entries(p.specifications).map(([k, v]) => <div key={k} className="flex justify-between px-4 py-2"><dt className="text-charcoal/60">{k}</dt><dd>{v}</dd></div>)}</dl>}
        </div>
      </div>
      <Reviews productId={p.id} />
      {p.related && p.related.length > 0 && <section className="mt-16"><h2 className="mb-6 font-display text-2xl text-espresso">You may also like</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{p.related.map(r => <ProductCard key={r.id} p={r} />)}</div></section>}
    </div>
  );
}
