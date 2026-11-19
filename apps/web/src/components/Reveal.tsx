'use client';
import { useEffect, useRef, useState } from 'react';
/** Fades/slides its children in when they scroll into view. Content is plain HTML for crawlers; <noscript> in the layout shows it without JS. */
export default function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: on ? `${delay}ms` : undefined }} className={`reveal ${on ? 'reveal-on' : ''} ${className}`}>{children}</div>;
}
