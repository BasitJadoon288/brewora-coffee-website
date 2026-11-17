let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;
export const setToken = (t: string | null) => { accessToken = t; };
export class ApiError extends Error { constructor(public status: number, message: string, public errors?: Record<string, string[]>) { super(message); } }

/** One in-flight refresh at a time (refresh tokens rotate; parallel refreshes would trip reuse detection). */
export function refreshToken(): Promise<string | null> {
  refreshing ??= fetch('/api/auth/refresh-token', { method: 'POST', credentials: 'include' })
    .then(async r => { if (!r.ok) { accessToken = null; return null; } accessToken = (await r.json()).accessToken as string; return accessToken; })
    .catch(() => null).finally(() => { refreshing = null; });
  return refreshing;
}
async function authed(url: string, init: RequestInit = {}): Promise<Response> {
  const go = () => fetch(url, { ...init, credentials: 'include', headers: { ...(init.headers as Record<string, string>), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) } });
  let r = await go();
  if (r.status === 401 && accessToken && !url.startsWith('/api/auth/')) { if (await refreshToken()) r = await go(); }
  return r;
}
async function fail(r: Response): Promise<never> { const d = await r.json().catch(() => ({})); throw new ApiError(r.status, d.message ?? 'Request failed', d.errors); }

/** Admin changes to public content refresh the cached storefront immediately (best effort). */
const PUBLIC_WRITE = /^\/(admin\/(content|settings|banners|testimonials|inventory|coupons|reviews)|products|categories)/;
function refreshStorefront() { if (typeof window !== 'undefined') fetch('/revalidate', { method: 'POST', headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }).catch(() => undefined); }

export async function api<T = any>(path: string, o: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = o.method ?? 'GET';
  const r = await authed('/api' + path, { method, headers: o.body !== undefined ? { 'Content-Type': 'application/json' } : {}, body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  if (!r.ok) return fail(r);
  if (method !== 'GET' && PUBLIC_WRITE.test(path)) refreshStorefront();
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}
/** Uploads an image to the API (admin only). Returns the public URL. */
export async function apiUpload(file: File, folder: string): Promise<string> {
  const r = await authed(`/api/admin/uploads/image?folder=${encodeURIComponent(folder)}`, { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
  if (!r.ok) return fail(r);
  return (await r.json()).url as string;
}
/** Downloads a protected file (e.g. CSV) — plain links cannot send the Authorization header. */
export async function downloadFile(path: string, filename: string) {
  const r = await authed('/api' + path); if (!r.ok) return fail(r);
  const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
/** Opens a protected HTML document (e.g. invoice) in a new tab. */
export async function openHtml(path: string) {
  const r = await authed('/api' + path); if (!r.ok) return fail(r);
  window.open(URL.createObjectURL(new Blob([await r.text()], { type: 'text/html' })), '_blank');
}
