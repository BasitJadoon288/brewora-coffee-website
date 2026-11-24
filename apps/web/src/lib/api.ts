/**
 * The admin panel (/admin/...) and the storefront keep SEPARATE sessions, so an admin and a customer can be signed in at the same
 * time in one browser: each has its own in-memory access token and its own refresh cookie (selected with ?portal=admin).
 */
export type Portal = 'admin' | 'customer';
export const portalOf = (): Portal => (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? 'admin' : 'customer');
const tokens: Record<Portal, string | null> = { admin: null, customer: null };
const refreshing: Partial<Record<Portal, Promise<string | null>>> = {};
export const setToken = (t: string | null) => { tokens[portalOf()] = t; };
const withPortal = (url: string, p: Portal) => (p === 'admin' && url.startsWith('/api/auth/') ? `${url}${url.includes('?') ? '&' : '?'}portal=admin` : url);
export class ApiError extends Error { constructor(public status: number, message: string, public errors?: Record<string, string[]>) { super(message); } }

/** One in-flight refresh per portal (refresh tokens rotate; parallel refreshes would trip reuse detection). */
export function refreshToken(): Promise<string | null> {
  const p = portalOf();
  refreshing[p] ??= fetch(withPortal('/api/auth/refresh-token', p), { method: 'POST', credentials: 'include' })
    .then(async r => { if (!r.ok) { tokens[p] = null; return null; } tokens[p] = (await r.json()).accessToken as string; return tokens[p]; })
    .catch(() => null).finally(() => { refreshing[p] = undefined; });
  return refreshing[p]!;
}
async function authed(url: string, init: RequestInit = {}): Promise<Response> {
  const p = portalOf(); const target = withPortal(url, p);
  const go = () => fetch(target, { ...init, credentials: 'include', headers: { ...(init.headers as Record<string, string>), ...(tokens[p] ? { Authorization: `Bearer ${tokens[p]}` } : {}) } });
  let r = await go();
  if (r.status === 401 && tokens[p] && !url.startsWith('/api/auth/')) { if (await refreshToken()) r = await go(); }
  return r;
}
async function fail(r: Response): Promise<never> { const d = await r.json().catch(() => ({})); throw new ApiError(r.status, d.message ?? 'Request failed', d.errors); }

/** Admin changes to public content refresh the cached storefront immediately (best effort). */
const PUBLIC_WRITE = /^\/(admin\/(content|settings|banners|testimonials|inventory|coupons|reviews)|products|categories)/;
function refreshStorefront() { if (typeof window !== 'undefined') fetch('/revalidate', { method: 'POST', headers: tokens[portalOf()] ? { Authorization: `Bearer ${tokens[portalOf()]}` } : {} }).catch(() => undefined); }

export async function api<T = any>(path: string, o: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = o.method ?? 'GET';
  const r = await authed('/api' + path, { method, headers: o.body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  if (!r.ok) return fail(r);
  if (method !== 'GET' && PUBLIC_WRITE.test(path)) refreshStorefront();
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}
/** Shrinks big photos in the browser before upload (max 1600 px). Keeps GIFs untouched and PNGs lossless (logos need transparency). */
async function shrinkImage(file: File): Promise<Blob> {
  if (typeof document === 'undefined' || !file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bmp = await createImageBitmap(file); const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 800_000) return file;
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise<Blob | null>(r => c.toBlob(r, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85));
    return out && out.size < file.size ? out : file;
  } catch { return file; }
}
/**
 * Uploads an image (admin only) and returns its URL. The picture is stored in MongoDB by the API (served from /uploads/...),
 * so it works the same locally and on Vercel and needs no third-party storage.
 */
export async function apiUpload(file: File, folder: string): Promise<string> {
  const body = await shrinkImage(file);
  const r = await authed(`/api/admin/uploads/image?folder=${encodeURIComponent(folder)}`, { method: 'POST', headers: { 'Content-Type': body.type || file.type || 'application/octet-stream' }, body });
  if (!r.ok) return fail(r);
  return (await r.json()).url as string;
}
/** Downloads a protected file (e.g. CSV) — plain links cannot send the Authorization header. */
export async function downloadFile(path: string, filename: string) {
  const r = await authed('/api' + path); if (!r.ok) return fail(r);
  const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
/** Opens a PDF (e.g. receipt) in a new tab, or saves it when `filename` is given. Works for protected and public endpoints. */
export async function openPdf(path: string, filename?: string) {
  const r = await authed('/api' + path); if (!r.ok) return fail(r);
  const url = URL.createObjectURL(new Blob([await r.arrayBuffer()], { type: 'application/pdf' }));
  if (filename) { const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); } else window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
/** Opens a protected HTML document (e.g. invoice) in a new tab. */
export async function openHtml(path: string) {
  const r = await authed('/api' + path); if (!r.ok) return fail(r);
  window.open(URL.createObjectURL(new Blob([await r.text()], { type: 'text/html' })), '_blank');
}
