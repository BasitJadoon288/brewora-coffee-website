import { revalidatePath } from 'next/cache';
const API = process.env.API_INTERNAL_URL || 'http://localhost:4000';
/** Called by the admin UI after it changes public content. The caller must be a signed-in admin (verified against the API). */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth) return Response.json({ message: 'Authentication required' }, { status: 401 });
  const r = await fetch(`${API}/api/auth/profile`, { headers: { Authorization: auth }, cache: 'no-store' }).catch(() => null);
  if (!r || !r.ok) return Response.json({ message: 'Authentication required' }, { status: 401 });
  if ((await r.json()).role !== 'Admin') return Response.json({ message: 'Forbidden' }, { status: 403 });
  revalidatePath('/', 'layout');
  return Response.json({ revalidated: true });
}
