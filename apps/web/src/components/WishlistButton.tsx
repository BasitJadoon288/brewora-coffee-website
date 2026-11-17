'use client';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from './toast';
import { useWishlist } from '@/lib/wishlist';
export default function WishlistButton({ productId, className = '', label = false }: { productId: string; className?: string; label?: boolean }) {
  const { has, toggle } = useWishlist(); const router = useRouter(); const toast = useToast(); const on = has(productId);
  async function click(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    try { const r = await toggle(productId); if (r === 'login') { toast('Please sign in to use your wishlist'); router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`); } else toast(r === 'added' ? 'Added to wishlist' : 'Removed from wishlist'); }
    catch { toast('Could not update wishlist', 'err'); }
  }
  return <button onClick={click} aria-pressed={on} aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'} className={`flex items-center gap-2 ${className}`}><Heart className={`h-5 w-5 ${on ? 'fill-red-600 text-red-600' : ''}`} />{label && <span className="text-sm">{on ? 'In wishlist' : 'Add to wishlist'}</span>}</button>;
}
