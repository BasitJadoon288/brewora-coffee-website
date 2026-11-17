export interface CartLine { key: string; id?: string; productId: string; variant?: string; quantity: number; name: string; slug: string; image?: string; unitPrice: number; available?: boolean; stockQuantity?: number }
export const MAX_QTY = 50;
export const lineKey = (productId: string, variant?: string) => `${productId}|${variant ?? ''}`;
const clamp = (q: number, max = MAX_QTY) => Math.max(1, Math.min(max, Math.floor(q) || 1));
/** Adds a line, merging with an existing one for the same product+variant (quantity capped). */
export function addLine(lines: CartLine[], l: Omit<CartLine, 'key'>, max = MAX_QTY): CartLine[] {
  const key = lineKey(l.productId, l.variant); const ex = lines.find(x => x.key === key);
  return ex ? lines.map(x => (x.key === key ? { ...x, quantity: clamp(x.quantity + l.quantity, max), unitPrice: l.unitPrice } : x)) : [...lines, { ...l, key, quantity: clamp(l.quantity, max) }];
}
export const setQuantity = (lines: CartLine[], key: string, qty: number, max = MAX_QTY) => lines.map(l => (l.key === key ? { ...l, quantity: clamp(qty, max) } : l));
export const removeLine = (lines: CartLine[], key: string) => lines.filter(l => l.key !== key);
export const countOf = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);
export const subTotalOf = (lines: CartLine[]) => Math.round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) * 100) / 100;
export const toQuoteItems = (lines: CartLine[]) => lines.map(l => ({ productId: l.productId, variant: l.variant, quantity: l.quantity }));
/** Defensive parse of localStorage content: anything malformed is dropped. */
export function parseStored(json: string | null): CartLine[] {
  try {
    const raw = JSON.parse(json ?? '[]'); if (!Array.isArray(raw)) return [];
    return raw.filter(l => l && /^[a-f\d]{24}$/i.test(l.productId) && Number.isFinite(l.quantity) && l.quantity > 0 && typeof l.name === 'string' && typeof l.slug === 'string')
      .map(l => ({ key: lineKey(l.productId, l.variant), productId: l.productId, variant: l.variant || undefined, quantity: clamp(l.quantity), name: l.name, slug: l.slug, image: l.image, unitPrice: Number(l.unitPrice) || 0 }));
  } catch { return []; }
}
