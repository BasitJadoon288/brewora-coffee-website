import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'BREWORA — Every Sip Tells a Story', template: '%s | BREWORA' },
  description: 'Premium coffee delivered to your doorstep across Pakistan. Rich flavor, premium quality.',
  openGraph: { type: 'website', siteName: 'BREWORA', locale: 'en_PK', title: 'BREWORA — Every Sip Tells a Story', description: 'Premium coffee delivered to your doorstep across Pakistan.', images: [{ url: '/assets/banners/hero.jpg', width: 1200, height: 630, alt: 'BREWORA coffee' }] },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><noscript><style>{`.reveal{opacity:1!important;transform:none!important}`}</style></noscript><Providers>{children}</Providers></body></html>;
}
