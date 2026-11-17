import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const json = (body: unknown, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let mod: typeof import('../src/lib/api');
beforeEach(async () => { vi.resetModules(); mod = await import('../src/lib/api'); });
afterEach(() => vi.unstubAllGlobals());
describe('api client', () => {
  it('sends the bearer token and parses JSON', async () => {
    const f = vi.fn().mockResolvedValue(json({ ok: 1 })); vi.stubGlobal('fetch', f); mod.setToken('tok');
    expect(await mod.api('/x')).toEqual({ ok: 1 }); expect((f.mock.calls[0][1] as any).headers.Authorization).toBe('Bearer tok');
  });
  it('on 401 refreshes once and retries with the new token', async () => {
    const f = vi.fn().mockImplementation(async (url: string, init: any) => {
      if (url === '/api/auth/refresh-token') return json({ accessToken: 'new' });
      return init.headers.Authorization === 'Bearer new' ? json({ data: 'ok' }) : json({ message: 'expired' }, 401);
    }); vi.stubGlobal('fetch', f); mod.setToken('old');
    expect(await mod.api('/orders/my-orders')).toEqual({ data: 'ok' }); expect(f.mock.calls.filter(c => c[0] === '/api/auth/refresh-token')).toHaveLength(1);
  });
  it('parallel 401s share ONE refresh call (rotating tokens would otherwise be revoked)', async () => {
    const f = vi.fn().mockImplementation(async (url: string, init: any) => {
      if (url === '/api/auth/refresh-token') { await new Promise(r => setTimeout(r, 20)); return json({ accessToken: 'new' }); }
      return init.headers.Authorization === 'Bearer new' ? json({ n: 1 }) : json({}, 401);
    }); vi.stubGlobal('fetch', f); mod.setToken('old');
    await Promise.all([mod.api('/a'), mod.api('/b'), mod.api('/c')]); expect(f.mock.calls.filter(c => c[0] === '/api/auth/refresh-token')).toHaveLength(1);
  });
  it('throws ApiError with message and field errors; handles 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json({ message: 'Validation failed', errors: { email: ['Invalid email'] } }, 400)).mockResolvedValueOnce(json(null, 204)));
    await expect(mod.api('/auth/register', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 400, message: 'Validation failed', errors: { email: ['Invalid email'] } });
    expect(await mod.api('/x', { method: 'DELETE' })).toBeUndefined();
  });
  it('refreshes the public storefront after admin content/product changes, but not after normal writes', async () => {
    const f = vi.fn().mockImplementation(async () => json({ ok: 1 })); vi.stubGlobal('fetch', f); mod.setToken('tok');
    await mod.api('/admin/content/homepage', { method: 'PUT', body: { a: 1 } }); await mod.api('/products', { method: 'POST', body: {} }); await mod.api('/cart/items', { method: 'POST', body: {} }); await mod.api('/admin/orders/1/status', { method: 'PUT', body: {} });
    const revalidates = f.mock.calls.filter(c => c[0] === '/revalidate'); expect(revalidates).toHaveLength(2); expect((revalidates[0][1] as any).headers.Authorization).toBe('Bearer tok');
  });
  it('does not try to refresh when logging in with bad credentials', async () => {
    const f = vi.fn().mockResolvedValue(json({ message: 'Invalid email or password' }, 401)); vi.stubGlobal('fetch', f); mod.setToken('t');
    await expect(mod.api('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 }); expect(f).toHaveBeenCalledTimes(1);
  });
});
