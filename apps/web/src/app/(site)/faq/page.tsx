import type { Metadata } from 'next';
import { getContent } from '@/lib/server';
export const metadata: Metadata = { title: 'FAQ' };
export default async function Faq() {
  const d = await getContent<{ title: string; items: { q: string; a: string }[] }>('faq', { title: 'Frequently Asked Questions', items: [] });
  return <div className="container-x max-w-3xl py-12"><h1 className="font-display text-4xl text-espresso">{d.title}</h1>
    <div className="mt-8 space-y-3">{d.items.map((x, i) => <details key={i} className="group rounded-xl bg-white p-5 shadow-soft"><summary className="cursor-pointer font-semibold text-espresso">{x.q}</summary><p className="mt-3 text-sm text-charcoal/70">{x.a}</p></details>)}
      {d.items.length === 0 && <p className="text-charcoal/60">No questions yet.</p>}</div></div>;
}
