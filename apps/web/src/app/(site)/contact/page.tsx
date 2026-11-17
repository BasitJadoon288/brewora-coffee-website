import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { getContent, serverGet } from '@/lib/server';
import type { PublicSettings } from '@/lib/types';
export const metadata: Metadata = { title: 'Contact Us' };
export default async function Contact() {
  const [d, s] = await Promise.all([getContent<{ title: string; intro: string; hours: string }>('contact', { title: 'Contact Us', intro: '', hours: '' }), serverGet<Partial<PublicSettings>>('/api/settings/public', {})]);
  return <div className="container-x grid gap-10 py-12 md:grid-cols-2"><div><h1 className="font-display text-4xl text-espresso">{d.title}</h1><p className="mt-4 text-charcoal/70">{d.intro}</p>
    <ul className="mt-6 space-y-2 text-sm">{s.contactEmail && <li><b>Email:</b> {s.contactEmail}</li>}{s.phone && <li><b>Phone:</b> {s.phone}</li>}{s.whatsapp && <li><b>WhatsApp:</b> {s.whatsapp}</li>}{s.address && <li><b>Address:</b> {s.address}</li>}{d.hours && <li><b>Hours:</b> {d.hours}</li>}</ul></div><ContactForm /></div>;
}
