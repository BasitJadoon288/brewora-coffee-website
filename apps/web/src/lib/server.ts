// Server-component data access. Never imported by client components.
const BASE = process.env.API_INTERNAL_URL || 'http://localhost:4000';
export async function serverGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(BASE + path, { next: { revalidate: 10 } });
    return r.ok ? ((await r.json()) as T) : fallback;
  } catch { return fallback; }
}
import { HOME_DEFAULTS, type HomeContent } from './cms-defaults';
/** CMS content with defaults, so the site renders even before an admin edits anything. */
export async function getContent<T extends object>(key: string, defaults: T): Promise<T> {
  const c = await serverGet<Partial<T>>(`/api/content/${key}`, {});
  const merged: any = { ...defaults, ...c };
  if ((defaults as any).sections) merged.sections = { ...(defaults as any).sections, ...((c as any).sections ?? {}) };
  return merged as T;
}
export const getHomeContent = () => getContent<HomeContent>('homepage', HOME_DEFAULTS);
