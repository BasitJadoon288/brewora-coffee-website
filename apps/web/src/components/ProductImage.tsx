'use client';
import { Coffee } from 'lucide-react';
import { useState } from 'react';
/** Shows the image; if the file is missing/broken, falls back to a branded tile instead of a broken icon. */
export default function ProductImage({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [bad, setBad] = useState(!src);
  if (bad) return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-espresso text-caramel ${className}`}><Coffee className="h-1/4 w-1/4 opacity-80" aria-hidden /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}
