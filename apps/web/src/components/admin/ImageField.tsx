'use client';
import { ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { apiUpload, ApiError } from '@/lib/api';
import { IMAGE_SPECS, MAX_UPLOAD_MB, type SpecKey } from '@/lib/image-specs';
import ProductImage from '../ProductImage';
import { useToast } from '../toast';

const readSize = (f: File) => new Promise<{ w: number; h: number } | null>(res => {
  const u = URL.createObjectURL(f); const i = new Image();
  i.onload = () => { res({ w: i.naturalWidth, h: i.naturalHeight }); URL.revokeObjectURL(u); }; i.onerror = () => { res(null); URL.revokeObjectURL(u); }; i.src = u;
});
/** Paste a URL/path, or upload a file (PNG/JPEG/WebP/GIF, max 5 MB). Shows the exact size the website expects. */
export default function ImageField({ label, value, onChange, folder = 'products', error, spec }: { label: string; value: string; onChange: (v: string) => void; folder?: string; error?: string; spec?: SpecKey }) {
  const ref = useRef<HTMLInputElement>(null); const toast = useToast(); const [busy, setBusy] = useState(false); const [note, setNote] = useState(''); const id = `img-${label.replace(/\W/g, '')}`;
  const sp = spec ? IMAGE_SPECS[spec] : undefined;
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; setNote('');
    if (!f.type.startsWith('image/')) return toast('Please choose an image file', 'err'); if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return toast(`Image must be ${MAX_UPLOAD_MB} MB or smaller`, 'err');
    if (sp) { const d = await readSize(f); if (d) {
      const off = Math.abs(d.w / d.h - sp.width / sp.height) / (sp.width / sp.height) > 0.12; const small = d.w < sp.width * 0.6 || d.h < sp.height * 0.6;
      if (off || small) setNote(`Your image is ${d.w}×${d.h}px. ${off ? `The ratio differs from ${sp.width}×${sp.height}, so the website will crop the edges to fit the box. ` : ''}${small ? 'It is smaller than recommended and may look blurry.' : ''}`);
    } }
    setBusy(true); try { onChange(await apiUpload(f, folder)); toast('Image uploaded'); } catch (x) { toast(x instanceof ApiError ? x.message : 'Upload failed', 'err'); } finally { setBusy(false); }
  }
  return <div><label htmlFor={id} className="mb-1 block text-sm font-semibold">{label}</label>
    {sp && <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-caramel/15 px-3 py-2 text-xs text-espresso"><ImageIcon className="h-4 w-4 shrink-0" aria-hidden /><span><b>Recommended size: {sp.width} × {sp.height} px</b> ({sp.label}) · used for: {sp.where} · PNG, JPG, WebP · max {MAX_UPLOAD_MB} MB</span></p>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="shrink-0 overflow-hidden rounded-lg bg-espresso/5" style={{ width: sp ? Math.min(160, Math.round(96 * (sp.width / sp.height))) : 64, aspectRatio: sp ? `${sp.width} / ${sp.height}` : '1 / 1' }}><ProductImage src={value || undefined} alt={label} className="h-full w-full" /></div>
      <div className="min-w-0 flex-1 space-y-2"><input id={id} className="input" placeholder="https://… or /uploads/…" value={value} onChange={e => onChange(e.target.value)} />
        <div className="flex items-center gap-2"><input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={pick} aria-label={`Upload ${label}`} /><button type="button" onClick={() => ref.current?.click()} disabled={busy} className="rounded-full border border-espresso/30 px-4 py-1.5 text-xs transition hover:bg-espresso/10 active:scale-95 disabled:opacity-50">{busy ? 'Uploading…' : 'Upload image'}</button>
          {value && <button type="button" onClick={() => { onChange(''); setNote(''); }} className="text-xs text-red-700 underline">Clear</button>}</div>
        {note && <p role="status" className="text-xs text-amber-800">{note}</p>}</div></div>{error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
