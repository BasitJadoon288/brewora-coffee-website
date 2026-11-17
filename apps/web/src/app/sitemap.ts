import type { MetadataRoute } from 'next';
import { serverGet } from '@/lib/server';
import type { Category, Paged, Product } from '@/lib/types';
export const revalidate = 3600;
const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [p, c] = await Promise.all([serverGet<Paged<Product>>('/api/products?limit=50', { items: [], total: 0, page: 1, pages: 0 }), serverGet<Category[]>('/api/categories', [])]);
  const fixed = ['', '/shop', '/about', '/contact', '/faq', '/privacy', '/terms', '/shipping', '/returns', '/track-order'].map(x => ({ url: base + x }));
  return [...fixed, ...c.map(x => ({ url: `${base}/shop?category=${x.slug}` })), ...p.items.map(x => ({ url: `${base}/product/${x.slug}` }))];
}
