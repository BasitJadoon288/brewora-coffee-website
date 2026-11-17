import { Coffee } from 'lucide-react';
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <div className="container-x flex justify-center py-14"><div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft">
    <Coffee className="mx-auto h-8 w-8 text-caramel" aria-hidden /><h1 className="mt-3 text-center font-display text-3xl text-espresso">{title}</h1>{subtitle && <p className="mt-1 text-center text-sm text-charcoal/60">{subtitle}</p>}<div className="mt-6">{children}</div></div></div>;
}
