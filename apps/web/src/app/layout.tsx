import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'BREWORA — Every Sip Tells a Story', template: '%s | BREWORA' },
  description: 'Premium coffee delivered to your doorstep across Pakistan. Rich flavor, premium quality.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
