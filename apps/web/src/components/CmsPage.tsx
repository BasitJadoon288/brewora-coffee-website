import { paragraphs } from '@/lib/text';
import ProductImage from './ProductImage';
export interface PageData { title: string; body?: string; image?: string }
export default function CmsPage({ d }: { d: PageData }) {
  return <article className="container-x max-w-3xl py-8 sm:py-12"><h1 className="font-display text-3xl text-espresso sm:text-4xl">{d.title}</h1>
    {d.image && <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl sm:mt-8"><ProductImage src={d.image} alt={d.title} className="h-full w-full" /></div>}
    <div className="mt-8 space-y-4 text-charcoal/80">{paragraphs(d.body).map((t, i) => <p key={i}>{t}</p>)}</div></article>;
}
