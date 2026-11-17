import Link from 'next/link';
export default function NotFound() { return <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center"><p className="font-display text-5xl text-espresso">404</p><p className="text-charcoal/70">We couldn’t find that page.</p><Link href="/" className="btn-dark">Back to home</Link></main>; }
