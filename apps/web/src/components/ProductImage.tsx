'use client';
import { Coffee } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { imgUrl } from '@/lib/img';
/**
 * Shows the image inside a FIXED box: the caller gives the box size/ratio (e.g. "aspect-square w-full"),
 * the image always fills it (object-cover) so it never stretches or overflows. Broken/missing files fall back to a branded tile.
 */
export default function ProductImage({ src, alt, className = '', eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [bad, setBad] = useState(!src); const img = useRef<HTMLImageElement>(null);
  useEffect(() => { setBad(!src); }, [src]);
  // A picture that failed while the page was still loading never fires React's onError, so check it once after mount.
  useEffect(() => { const el = img.current; if (el?.complete && el.naturalWidth === 0) setBad(true); }, [src, bad]);
  if (bad) {
    // While developing (npm run dev) the tile also prints which address failed, so a missing picture is easy to diagnose.
    const dev = process.env.NODE_ENV !== 'production' && !!src;
    if (dev) console.warn('[ProductImage] could not load:', imgUrl(src));
    return <div role="img" aria-label={alt} title={dev ? imgUrl(src) : undefined} className={`flex flex-col items-center justify-center gap-2 bg-espresso p-2 text-caramel ${className}`}><Coffee className="h-1/4 w-1/4 opacity-80" aria-hidden />{dev && <span className="max-w-full break-all text-center text-[9px] leading-tight text-cream/60">{imgUrl(src)}</span>}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={img} src={imgUrl(src)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)} className={`img-in block max-w-full object-cover object-center ${className}`} />;
}
