'use client';
import { X } from 'lucide-react';
import { useEffect } from 'react';
export const Spinner = ({ className = '' }: { className?: string }) => <div role="status" aria-label="Loading" className={`h-6 w-6 animate-spin rounded-full border-2 border-espresso/20 border-t-caramel ${className}`} />;
export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-lg bg-espresso/10 ${className}`} />;
export const Loading = ({ label = 'Loading…' }: { label?: string }) => <div className="flex items-center justify-center gap-3 py-16 text-charcoal/60"><Spinner />{label}</div>;
export function Field({ label, error, hint, htmlFor, children }: { label: string; error?: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold">{label}</label>{children}{hint && !error && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}{error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
export function Empty({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return <div className="rounded-2xl bg-white p-10 text-center shadow-soft"><p className="font-display text-xl text-espresso">{title}</p>{text && <p className="mt-2 text-sm text-charcoal/60">{text}</p>}{children && <div className="mt-5">{children}</div>}</div>;
}
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-label={title} className={`my-8 w-full rounded-2xl bg-cream p-6 shadow-soft ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl text-espresso">{title}</h2><button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-espresso/10"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}
export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return <nav className="mt-4 flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
    <button className="rounded-full bg-white px-4 py-2 shadow-soft disabled:opacity-40" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
    <span className="px-2 text-charcoal/70">Page {page} of {pages}</span>
    <button className="rounded-full bg-white px-4 py-2 shadow-soft disabled:opacity-40" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button></nav>;
}
const TONES: Record<string, string> = { Pending: 'bg-amber-100 text-amber-800', Confirmed: 'bg-blue-100 text-blue-800', Processing: 'bg-indigo-100 text-indigo-800', Shipped: 'bg-purple-100 text-purple-800', Delivered: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800', Paid: 'bg-green-100 text-green-800', Failed: 'bg-red-100 text-red-800', Refunded: 'bg-gray-200 text-gray-800' };
export const Badge = ({ value }: { value: string }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[value] ?? 'bg-gray-100 text-gray-700'}`}>{value}</span>;
export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 accent-[#C58B52]" />{label}</label>;
