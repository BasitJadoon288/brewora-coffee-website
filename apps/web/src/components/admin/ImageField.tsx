'use client';
import { useRef, useState } from 'react';
import { apiUpload, ApiError } from '@/lib/api';
import ProductImage from '../ProductImage';
import { useToast } from '../toast';
/** Paste a URL/path, or upload a file (PNG/JPEG/WebP/GIF, max 5 MB) which is stored by the API. */
export default function ImageField({ label, value, onChange, folder = 'products', error }: { label: string; value: string; onChange: (v: string) => void; folder?: string; error?: string }) {
  const ref = useRef<HTMLInputElement>(null); const toast = useToast(); const [busy, setBusy] = useState(false); const id = `img-${label.replace(/\W/g, '')}`;
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Please choose an image file', 'err'); if (f.size > 5 * 1024 * 1024) return toast('Image must be 5 MB or smaller', 'err');
    setBusy(true); try { onChange(await apiUpload(f, folder)); toast('Image uploaded'); } catch (x) { toast(x instanceof ApiError ? x.message : 'Upload failed', 'err'); } finally { setBusy(false); }
  }
  return <div><label htmlFor={id} className="mb-1 block text-sm font-semibold">{label}</label><div className="flex items-start gap-3">
    <ProductImage src={value || undefined} alt={label} className="h-16 w-16 shrink-0 rounded-lg" />
    <div className="flex-1 space-y-2"><input id={id} className="input" placeholder="https://… or /uploads/…" value={value} onChange={e => onChange(e.target.value)} />
      <div className="flex items-center gap-2"><input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={pick} aria-label={`Upload ${label}`} /><button type="button" onClick={() => ref.current?.click()} disabled={busy} className="rounded-full border border-espresso/30 px-4 py-1.5 text-xs hover:bg-espresso/10 disabled:opacity-50">{busy ? 'Uploading…' : 'Upload image'}</button>
        {value && <button type="button" onClick={() => onChange('')} className="text-xs text-red-700 underline">Clear</button>}</div></div></div>{error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
