'use client';
import { useState } from 'react';
import ProductImage from './ProductImage';
/** Main image in a fixed square box + clickable thumbnails (fade transition). */
export default function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [a, setA] = useState(0); const cur = images[a];
  return <div className="space-y-3">
    <div className="aspect-square w-full overflow-hidden rounded-2xl bg-white"><ProductImage key={cur?.url ?? 'none'} src={cur?.url} alt={cur?.alt || name} eager className="h-full w-full" /></div>
    {images.length > 1 && <div className="grid grid-cols-4 gap-2 sm:gap-3">{images.slice(0, 8).map((im, n) => <button key={n} type="button" onClick={() => setA(n)} aria-label={`Show image ${n + 1}`} aria-current={n === a} className={`aspect-square overflow-hidden rounded-xl ring-2 transition hover:opacity-100 ${n === a ? 'opacity-100 ring-caramel' : 'opacity-70 ring-transparent'}`}><ProductImage src={im.url} alt={im.alt || name} className="h-full w-full" /></button>)}</div>}
  </div>;
}
