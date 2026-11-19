'use client';
import { Coffee } from 'lucide-react';
import { useState } from 'react';
/**
 * Shows the image inside a FIXED box: the caller gives the box size/ratio (e.g. "aspect-square w-full"),
 * the image always fills it (object-cover) so it never stretches or overflows. Broken/missing files fall back to a branded tile.
 */
export default function ProductImage({ src, alt, className = '', eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [bad, setBad] = useState(!src);
  if (bad) return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-espresso text-caramel ${className}`}><Coffee className="h-1/4 w-1/4 opacity-80" aria-hidden /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)} className={`img-in block max-w-full object-cover object-center ${className}`} />;
}
