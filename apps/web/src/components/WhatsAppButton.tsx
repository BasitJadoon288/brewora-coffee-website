import { MessageCircle } from 'lucide-react';
/** Floating "chat on WhatsApp" button. The number comes from Admin > Settings; nothing is rendered when it is empty. */
export const waNumber = (raw?: string) => { const d = (raw ?? '').replace(/\D/g, ''); if (!d) return ''; return d.startsWith('92') ? d : d.startsWith('0') ? `92${d.slice(1)}` : d; };
export default function WhatsAppButton({ phone, storeName = 'BREWORA' }: { phone?: string; storeName?: string }) {
  const n = waNumber(phone); if (n.length < 11) return null;
  return <a href={`https://wa.me/${n}?text=${encodeURIComponent(`Hi ${storeName}, I need help with my order.`)}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
    className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition hover:scale-105 active:scale-95 md:bottom-6 md:right-6"><MessageCircle className="h-7 w-7" aria-hidden /></a>;
}
