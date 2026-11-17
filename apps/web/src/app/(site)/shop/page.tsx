import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { serverGet } from '@/lib/server';
import type { Category, Paged, Product } from '@/lib/types';
export const metadata: Metadata = { title: 'Shop', description: 'Browse espresso, lattes, cold brew and premium coffee beans.' };
type SP = Record<string, string | undefined>;
const SORTS = [['newest', 'Newest'], ['popular', 'Most popular'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low']];

export default async function Shop({ searchParams }: { searchParams: SP }) {
  const qs = new URLSearchParams();
  for (const k of ['q', 'category', 'minPrice', 'maxPrice', 'sort', 'page', 'bestSeller', 'featured']) if (searchParams[k]) qs.set(k, searchParams[k]!);
  qs.set('limit', '12');
  const [data, cats] = await Promise.all([serverGet<Paged<Product>>(`/api/products?${qs}`, { items: [], total: 0, page: 1, pages: 0 }), serverGet<Category[]>('/api/categories', [])]);
  const link = (over: SP) => { const n = new URLSearchParams(); for (const [k, v] of Object.entries({ ...searchParams, ...over })) if (v) n.set(k, v); return `/shop?${n}`; };
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl text-espresso">Shop</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <form action="/shop" className="space-y-5 rounded-2xl bg-white p-5 shadow-soft">
            <div><label htmlFor="q" className="mb-1 block text-sm font-semibold">Search</label><input id="q" name="q" defaultValue={searchParams.q} placeholder="e.g. latte" className="input" /></div>
            <div><label htmlFor="category" className="mb-1 block text-sm font-semibold">Category</label>
              <select id="category" name="category" defaultValue={searchParams.category ?? ''} className="input"><option value="">All</option>{cats.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-2"><div><label htmlFor="minPrice" className="mb-1 block text-sm font-semibold">Min (Rs.)</label><input id="minPrice" name="minPrice" type="number" min={0} defaultValue={searchParams.minPrice} className="input" /></div>
              <div><label htmlFor="maxPrice" className="mb-1 block text-sm font-semibold">Max (Rs.)</label><input id="maxPrice" name="maxPrice" type="number" min={0} defaultValue={searchParams.maxPrice} className="input" /></div></div>
            <div><label htmlFor="sort" className="mb-1 block text-sm font-semibold">Sort by</label><select id="sort" name="sort" defaultValue={searchParams.sort ?? 'newest'} className="input">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="bestSeller" value="true" defaultChecked={searchParams.bestSeller === 'true'} /> Best sellers only</label>
            <div className="flex gap-2"><button className="btn-dark flex-1">Apply</button><Link href="/shop" className="btn border border-espresso/30 text-espresso">Reset</Link></div>
          </form>
        </aside>
        <section aria-live="polite">
          <p className="mb-4 text-sm text-charcoal/60">{data.total} product{data.total === 1 ? '' : 's'}</p>
          {data.items.length === 0 ? <div className="rounded-2xl bg-white p-12 text-center shadow-soft"><p className="font-display text-xl text-espresso">No products found</p><p className="mt-2 text-sm text-charcoal/60">Try different filters.</p></div>
            : <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{data.items.map(p => <ProductCard key={p.id} p={p} />)}</div>}
          {data.pages > 1 && <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map(n => <Link key={n} href={link({ page: String(n) })} aria-current={n === data.page ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm ${n === data.page ? 'bg-espresso text-cream' : 'bg-white text-espresso shadow-soft'}`}>{n}</Link>)}</nav>}
        </section>
      </div>
    </div>
  );
}
