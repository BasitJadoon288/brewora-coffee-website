import { Coffee, Facebook, Instagram, Youtube } from 'lucide-react';
import Link from 'next/link';
import type { PublicSettings } from '@/lib/types';
const col = 'space-y-2 text-sm';
export default function Footer({ s }: { s: Partial<PublicSettings> }) {
  const soc = s.social ?? {};
  return (
    <footer className="bg-charcoal text-cream/80">
      <div className="container-x grid gap-8 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-4">
        <div><p className="flex items-center gap-2 font-display text-2xl tracking-[0.2em] text-cream"><Coffee className="h-5 w-5 text-caramel" aria-hidden />{(s.storeName ?? 'BREWORA').toUpperCase()}</p>
          <p className="mt-3 text-sm">Every Sip Tells a Story.</p><p className="mt-1 text-xs tracking-widest text-caramel">SIP • RELAX • ENJOY</p>
          <div className="mt-4 flex gap-3">{soc.instagram && <a href={soc.instagram} aria-label="Instagram" className="transition hover:-translate-y-0.5 hover:text-caramel" rel="noopener noreferrer" target="_blank"><Instagram className="h-5 w-5" /></a>}
            {soc.facebook && <a href={soc.facebook} aria-label="Facebook" className="hover:text-caramel" rel="noopener noreferrer" target="_blank"><Facebook className="h-5 w-5" /></a>}
            {soc.youtube && <a href={soc.youtube} aria-label="YouTube" className="hover:text-caramel" rel="noopener noreferrer" target="_blank"><Youtube className="h-5 w-5" /></a>}</div></div>
        <div><p className="mb-3 font-semibold text-cream">Shop</p><ul className={col}><li><Link href="/shop" className="hover:text-caramel">All products</Link></li><li><Link href="/shop?bestSeller=true" className="hover:text-caramel">Best sellers</Link></li><li><Link href="/track-order" className="hover:text-caramel">Track order</Link></li><li><Link href="/account" className="hover:text-caramel">My account</Link></li></ul></div>
        <div><p className="mb-3 font-semibold text-cream">Help</p><ul className={col}><li><Link href="/faq" className="hover:text-caramel">FAQ</Link></li><li><Link href="/shipping" className="hover:text-caramel">Shipping policy</Link></li><li><Link href="/returns" className="hover:text-caramel">Returns & refunds</Link></li><li><Link href="/privacy" className="hover:text-caramel">Privacy policy</Link></li><li><Link href="/terms" className="hover:text-caramel">Terms & conditions</Link></li></ul></div>
        <div><p className="mb-3 font-semibold text-cream">Contact</p><ul className={col}>{s.contactEmail && <li>{s.contactEmail}</li>}{s.phone && <li>{s.phone}</li>}{s.whatsapp && <li>WhatsApp: {s.whatsapp}</li>}{s.address && <li>{s.address}</li>}<li><Link href="/contact" className="text-caramel hover:underline">Send us a message</Link></li></ul></div>
      </div>
      <p className="border-t border-cream/10 py-4 text-center text-xs">© {new Date().getFullYear()} {s.storeName ?? 'BREWORA'}. All rights reserved.</p>
    </footer>
  );
}
