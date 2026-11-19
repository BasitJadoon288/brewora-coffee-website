'use client';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProductImage from './ProductImage';
export interface Testimonial { id: string; name: string; text: string; rating: number; avatar?: string }
const AUTOPLAY_MS = 2000; const SLIDE_MS = 600;
/** Customer reviews: moves one card to the left every 2 seconds (seamless loop). Pauses on hover/touch/focus. 1 card on phones, 2 on tablets, 3 on desktop. */
export default function TestimonialSlider({ items }: { items: Testimonial[] }) {
  const [per, setPer] = useState(1); const [i, setI] = useState(0); const [anim, setAnim] = useState(true); const [paused, setPaused] = useState(false);
  const n = items.length; const slide = n > per; const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    const calc = () => setPer(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    calc(); window.addEventListener('resize', calc); return () => window.removeEventListener('resize', calc);
  }, []);
  useEffect(() => { setAnim(false); setI(0); }, [per, n]);
  useEffect(() => { if (!anim) { const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true))); return () => cancelAnimationFrame(r); } }, [anim]);
  const next = useCallback(() => setI(x => x + 1), []);
  const prev = () => { if (i === 0) { setAnim(false); setI(n); requestAnimationFrame(() => requestAnimationFrame(() => { setAnim(true); setI(n - 1); })); } else setI(i - 1); };
  useEffect(() => { if (!slide || paused) return; const t = setInterval(next, AUTOPLAY_MS); return () => clearInterval(t); }, [slide, paused, next]);
  // when we reach the cloned cards, jump back to the real start without animation
  useEffect(() => { if (!slide || i < n) return; timer.current = setTimeout(() => { setAnim(false); setI(i - n); }, SLIDE_MS); return () => clearTimeout(timer.current); }, [i, n, slide]);
  const list = slide ? [...items, ...items.slice(0, per)] : items; const active = n ? i % n : 0;
  const w = 100 / per;
  return <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 4000)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} role="region" aria-roledescription="carousel" aria-label="Customer reviews">
    <div className="-mx-2 overflow-hidden px-0 py-3 sm:-mx-3">
      <ul className={`flex ${slide ? '' : 'justify-center'}`} style={slide ? { transform: `translateX(-${i * w}%)`, transition: anim ? `transform ${SLIDE_MS}ms cubic-bezier(.22,.61,.36,1)` : 'none' } : undefined} aria-live={paused ? 'polite' : 'off'}>
        {list.map((t, k) => <li key={`${t.id}-${k}`} aria-hidden={k >= n} className="shrink-0 px-2 sm:px-3" style={{ width: slide ? `${w}%` : `${100 / Math.max(per, 1)}%`, maxWidth: slide ? undefined : 420 }}>
          <figure className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-soft sm:p-6">
            <div className="mb-3 flex items-center gap-1" aria-label={`${t.rating} out of 5`}>{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-4 w-4 ${s <= t.rating ? 'fill-caramel text-caramel' : 'text-charcoal/20'}`} aria-hidden />)}</div>
            <blockquote className="flex-1 break-words text-charcoal/80">“{t.text}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3 text-sm font-semibold text-espresso">{t.avatar && <ProductImage src={t.avatar} alt={t.name} className="h-10 w-10 shrink-0 rounded-full" />}<span className="min-w-0 truncate">{t.name}</span></figcaption>
          </figure></li>)}
      </ul></div>
    {slide && <div className="mt-4 flex items-center justify-center gap-3">
      <button onClick={prev} aria-label="Previous review" className="rounded-full bg-white p-2 shadow-soft transition hover:bg-caramel active:scale-90"><ChevronLeft className="h-4 w-4" /></button>
      <div className="flex gap-1.5">{items.map((t, k) => <button key={t.id} onClick={() => setI(k)} aria-label={`Show review ${k + 1}`} aria-current={k === active} className={`h-2 rounded-full transition-all duration-300 ${k === active ? 'w-6 bg-caramel' : 'w-2 bg-espresso/25'}`} />)}</div>
      <button onClick={next} aria-label="Next review" className="rounded-full bg-white p-2 shadow-soft transition hover:bg-caramel active:scale-90"><ChevronRight className="h-4 w-4" /></button></div>}
  </div>;
}
