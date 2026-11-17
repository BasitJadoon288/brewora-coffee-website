/** crypto.randomUUID needs a secure context; fall back for plain-http hosts. */
export const uuid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : 'k' + Math.random().toString(16).slice(2) + Date.now().toString(16));
/** Submits a hidden POST form to a payment gateway (they expect a browser form post). */
export function postForm(url: string, fields: Record<string, string>) {
  const f = document.createElement('form'); f.method = 'POST'; f.action = url;
  for (const [k, v] of Object.entries(fields)) { const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); }
  document.body.appendChild(f); f.submit();
}
export const PHONE_RE = /^(\+92|0)3\d{9}$/;
const COUPON_KEY = 'brewora_coupon';
export const getCoupon = () => { try { return sessionStorage.getItem(COUPON_KEY) ?? ''; } catch { return ''; } };
export const setCouponStore = (c: string) => { try { c ? sessionStorage.setItem(COUPON_KEY, c) : sessionStorage.removeItem(COUPON_KEY); } catch { /* ignore */ } };
