'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Keeps an open storefront tab in step with admin edits: re-renders the server components when the tab regains focus and every 20 s while visible (cheap: served from the Next data cache). */
export default function LiveRefresh({ every = 20_000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const go = () => { if (document.visibilityState === 'visible') router.refresh(); };
    const t = setInterval(go, every);
    document.addEventListener('visibilitychange', go);
    window.addEventListener('focus', go);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', go); window.removeEventListener('focus', go); };
  }, [router, every]);
  return null;
}
