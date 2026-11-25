import Footer from '@/components/Footer';
import Header from '@/components/Header';
import LiveRefresh from '@/components/LiveRefresh';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getHomeContent, serverGet } from '@/lib/server';
import type { PublicSettings } from '@/lib/types';
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, home] = await Promise.all([serverGet<Partial<PublicSettings>>('/api/settings/public', {}), getHomeContent()]);
  return (<>
    {home.announcement && <div className="bg-caramel py-2 text-center text-xs font-medium tracking-wide text-espresso">{home.announcement}</div>}
    <Header storeName={s.storeName} logo={s.logo} /><main id="main">{children}</main><Footer s={s} /><WhatsAppButton phone={s.whatsapp} storeName={s.storeName} /><LiveRefresh />
  </>);
}
