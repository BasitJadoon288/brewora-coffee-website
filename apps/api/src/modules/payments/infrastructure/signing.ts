import crypto from 'crypto';
export const safeEqual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const hmac = (key: string, data: string) => crypto.createHmac('sha256', key).update(data).digest('hex');
/** JazzCash HTTP-POST: HMAC-SHA256 over salt + non-empty pp_* values sorted by key. */
export function jazzSecureHash(params: Record<string, string | undefined>, salt: string) {
  const keys = Object.keys(params).filter(k => k !== 'pp_SecureHash' && params[k] !== undefined && params[k] !== '').sort();
  return hmac(salt, [salt, ...keys.map(k => params[k])].join('&')).toUpperCase();
}
export const verifyJazz = (p: Record<string, string | undefined>, salt: string) => !!p.pp_SecureHash && safeEqual(p.pp_SecureHash.toUpperCase(), jazzSecureHash(p, salt));
export const pkTimestamp = (d: Date) => new Date(d.getTime() + 5 * 3600e3).toISOString().replace(/\D/g, '').slice(0, 14);
/** EasyPaisa: generic HMAC-SHA256 over sorted key=value pairs. Align with merchant docs before go-live (docs/PAYMENTS.md). */
export function easypaisaHash(params: Record<string, string | undefined>, key: string) {
  const keys = Object.keys(params).filter(k => k !== 'merchantHashedReq' && params[k] !== undefined && params[k] !== '').sort();
  return hmac(key, keys.map(k => `${k}=${params[k]}`).join('&'));
}
export const verifyEasypaisa = (p: Record<string, string | undefined>, key: string) => !!p.merchantHashedReq && safeEqual(p.merchantHashedReq.toLowerCase(), easypaisaHash(p, key));
