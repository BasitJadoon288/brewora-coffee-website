import { paragraphs } from '@/lib/text';
import ProductImage from './ProductImage';
export interface PageData { title: string; body?: string; image?: string }
export default function CmsPage({ d }: { d: PageData }) {
  return <article className="container-x max-w-3xl py-12"><h1 className="font-display text-4xl text-espresso">{d.title}</h1>
    {d.image && <ProductImage src={d.image} alt={d.title} className="mt-8 aspect-[16/9] w-full rounded-2xl" />}
    <div className="mt-8 space-y-4 text-charcoal/80">{paragraphs(d.body).map((t, i) => <p key={i}>{t}</p>)}</div></article>;
}
