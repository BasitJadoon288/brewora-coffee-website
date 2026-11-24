'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useToast } from '../toast';
import { Field, Loading } from '../ui';
import { api, ApiError } from '@/lib/api';
import { HOME_DEFAULTS } from '@/lib/cms-defaults';
import ImageField from './ImageField';
import { Card, fieldErrors } from './kit';
type D = Record<string, any>;
const DEFAULTS: Record<string, D> = { homepage: HOME_DEFAULTS as unknown as D, about: { title: 'About BREWORA', image: '', body: '' }, faq: { title: 'Frequently Asked Questions', items: [] }, privacy: { title: 'Privacy Policy', body: '' }, terms: { title: 'Terms and Conditions', body: '' },
  shipping: { title: 'Shipping Policy', body: '' }, returns: { title: 'Return and Refund Policy', body: '' }, contact: { title: 'Contact Us', intro: '', hours: '' } };
const SECTIONS: [string, string][] = [['categories', 'Featured categories'], ['bestSellers', 'Best sellers'], ['newArrivals', 'New arrivals'], ['offers', 'Special offers'], ['why', 'Why choose us'], ['story', 'Our story'], ['testimonials', 'Testimonials'], ['instagram', 'Instagram gallery'], ['newsletter', 'Newsletter signup']];
const merge = (k: string, saved: D): D => { const d = DEFAULTS[k]; const m = { ...d, ...saved }; if (d.sections) m.sections = { ...d.sections, ...(saved.sections ?? {}) }; return m; };

export default function ContentEditor({ k }: { k: string }) {
  const qc = useQueryClient(); const toast = useToast(); const { data } = useQuery({ queryKey: ['content', k], queryFn: () => api<D>(`/content/${k}`) });
  const [d, setD] = useState<D | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { setD(null); }, [k]); useEffect(() => { if (data) setD(merge(k, data)); }, [data, k]);
  if (!d) return <Loading />;
  const set = (key: string, v: unknown) => setD({ ...d, [key]: v });
  const text = (label: string, key: string, multi = false, hint?: string) => <Field label={label} htmlFor={`c-${key}`} hint={hint}>{multi ? <textarea id={`c-${key}`} className="input min-h-32" value={d[key] ?? ''} onChange={e => set(key, e.target.value)} /> : <input id={`c-${key}`} className="input" value={d[key] ?? ''} onChange={e => set(key, e.target.value)} />}</Field>;
  const setItem = (key: string, i: number, patch: object) => set(key, d[key].map((x: any, j: number) => (j === i ? { ...x, ...patch } : x))); const delItem = (key: string, i: number) => set(key, d[key].filter((_: any, j: number) => j !== i));
  async function save() { setBusy(true); try { await api(`/admin/content/${k}`, { method: 'PUT', body: d }); toast('Saved — the website is updated'); qc.invalidateQueries({ queryKey: ['content', k] }); } catch (x) { toast(x instanceof ApiError ? (Object.keys(fieldErrors(x)).length ? 'Invalid content' : x.message) : 'Could not save', 'err'); } finally { setBusy(false); } }
  const body = 'Separate paragraphs with a blank line. Plain text only.';
  return <div className="space-y-6">
    {k === 'homepage' && <>
      <Card title="Announcement bar">{text('Text (leave empty to hide the bar)', 'announcement')}</Card>
      <Card title="Sections shown on the homepage"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SECTIONS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#C58B52]" checked={!!d.sections[key]} onChange={e => set('sections', { ...d.sections, [key]: e.target.checked })} />{label}</label>)}</div>
        <p className="mt-3 text-xs text-charcoal/60">Hero and promotional banners are managed in Banners; products in Products; testimonials in Testimonials.</p></Card>
      <Card title="Top picture (hero)"><div className="space-y-2"><ImageField label="Hero image" value={d.heroImage ?? ''} onChange={v => set('heroImage', v)} folder="banners" spec="hero" /><p className="text-xs text-charcoal/60">Shown in the big top section of the homepage. An active hero banner (Banners page) takes priority over this picture.</p></div></Card>
      <Card title="Why choose us">{text('Heading', 'whyTitle')}<div className="mt-4 space-y-3">{d.whyItems.map((x: any, i: number) => <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_2fr_auto]"><Field label="Title" htmlFor={`wt${i}`}><input id={`wt${i}`} className="input" value={x.title} onChange={e => setItem('whyItems', i, { title: e.target.value })} /></Field><Field label="Text" htmlFor={`wx${i}`}><input id={`wx${i}`} className="input" value={x.text} onChange={e => setItem('whyItems', i, { text: e.target.value })} /></Field><button className="pb-2 text-sm text-red-700 underline" onClick={() => delItem('whyItems', i)}>Remove</button></div>)}
        <button className="btn-dark" onClick={() => set('whyItems', [...d.whyItems, { title: '', text: '' }])}>Add item</button></div></Card>
      <Card title="Our story"><div className="space-y-4">{text('Heading', 'storyTitle')}{text('Text', 'storyBody', true, body)}<ImageField label="Image" value={d.storyImage ?? ''} onChange={v => set('storyImage', v)} folder="about" spec="story" /></div></Card>
      <Card title="Instagram gallery"><div className="space-y-4">{text('Heading', 'instagramTitle')}{d.instagram.map((x: any, i: number) => <div key={i} className="rounded-xl border border-espresso/10 p-3"><ImageField label={`Photo ${i + 1}`} value={x.image} onChange={v => setItem('instagram', i, { image: v })} folder="content" spec="instagram" /><div className="mt-2 flex items-end gap-3"><div className="flex-1"><Field label="Link (optional)" htmlFor={`il${i}`}><input id={`il${i}`} className="input" value={x.link ?? ''} onChange={e => setItem('instagram', i, { link: e.target.value })} /></Field></div><button className="text-sm text-red-700 underline" onClick={() => delItem('instagram', i)}>Remove</button></div></div>)}
        <button className="btn-dark" onClick={() => set('instagram', [...d.instagram, { image: '', link: '' }])}>Add photo</button></div></Card>
      <Card title="Newsletter">{text('Heading', 'newsletterTitle')}<div className="mt-4">{text('Text', 'newsletterText')}</div></Card></>}
    {['about', 'privacy', 'terms', 'shipping', 'returns'].includes(k) && <Card><div className="space-y-4">{text('Page title', 'title')}{k === 'about' && <ImageField label="Image (optional)" value={d.image ?? ''} onChange={v => set('image', v)} folder="about" spec="about" />}{text('Content', 'body', true, body)}</div></Card>}
    {k === 'faq' && <Card><div className="space-y-4">{text('Page title', 'title')}{d.items.map((x: any, i: number) => <div key={i} className="rounded-xl border border-espresso/10 p-3"><Field label="Question" htmlFor={`fq${i}`}><input id={`fq${i}`} className="input" value={x.q} onChange={e => setItem('items', i, { q: e.target.value })} /></Field><div className="mt-2"><Field label="Answer" htmlFor={`fa${i}`}><textarea id={`fa${i}`} className="input min-h-20" value={x.a} onChange={e => setItem('items', i, { a: e.target.value })} /></Field></div><button className="mt-2 text-sm text-red-700 underline" onClick={() => delItem('items', i)}>Remove</button></div>)}
      <button className="btn-dark" onClick={() => set('items', [...d.items, { q: '', a: '' }])}>Add question</button></div></Card>}
    {k === 'contact' && <Card><div className="space-y-4">{text('Page title', 'title')}{text('Intro text', 'intro', true)}{text('Opening hours', 'hours')}<p className="text-xs text-charcoal/60">Email, phone and address come from Settings.</p></div></Card>}
    <button disabled={busy} className="btn-gold disabled:opacity-60" onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>;
}
