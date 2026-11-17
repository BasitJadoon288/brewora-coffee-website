import { BadRequestError, ConflictError } from '../../../shared/domain/errors';
import { round2 } from '../../../shared/domain/text';
import { ProductRepository } from '../../catalog/domain/product';
import { couponDiscount, couponError, CouponRepository } from '../../promotions/domain/coupon';
import { SettingsRepository } from '../../settings/domain/settings';
import { totals, unitPrice } from '../domain/pricing';

export interface QuoteItemInput { productId: string; variant?: string; quantity: number }
export interface QuoteLine { productId: string; name: string; sku: string; variant?: string; image?: string; unitPrice: number; quantity: number; lineTotal: number }
export interface Quote { lines: QuoteLine[]; subTotal: number; discount: number; deliveryCharges: number; tax: number; totalAmount: number; coupon: { id: string; code: string } | null; currency: string }

/** Single source of truth for prices. Client-supplied prices are never read. */
export class QuoteService {
  constructor(private products: ProductRepository, private coupons: CouponRepository, private settings: SettingsRepository) {}
  async execute(input: QuoteItemInput[], couponCode?: string): Promise<Quote> {
    if (!input?.length) throw new BadRequestError('Cart is empty');
    const merged = new Map<string, QuoteItemInput>();
    for (const i of input) { const k = `${i.productId}|${i.variant ?? ''}`; const e = merged.get(k); merged.set(k, e ? { ...e, quantity: e.quantity + i.quantity } : { ...i }); }
    const items = [...merged.values()];
    const found = await this.products.findByIds(items.map(i => i.productId), true);
    const byId = new Map(found.map(p => [p.id, p]));
    const stockUsed = new Map<string, number>();
    const lines: QuoteLine[] = items.map(i => {
      const p = byId.get(i.productId); if (!p) throw new BadRequestError('A product in your cart is no longer available');
      let delta = 0;
      if (i.variant) { const v = p.variants.find(x => x.name === i.variant); if (!v) throw new BadRequestError(`Variant "${i.variant}" not available for ${p.name}`); delta = v.priceDelta ?? 0; }
      const used = (stockUsed.get(i.productId) ?? 0) + i.quantity; stockUsed.set(i.productId, used);
      if (used > p.stockQuantity) throw new ConflictError(p.stockQuantity > 0 ? `Only ${p.stockQuantity} left for ${p.name}` : `${p.name} is out of stock`);
      const up = unitPrice(p, delta);
      return { productId: p.id, name: p.name, sku: p.sku, variant: i.variant, image: p.images?.[0]?.url, unitPrice: up, quantity: i.quantity, lineTotal: round2(up * i.quantity) };
    });
    const subTotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
    const s = await this.settings.get();
    let discount = 0; let coupon: Quote['coupon'] = null;
    if (couponCode) {
      const c = await this.coupons.findByCode(couponCode.trim().toUpperCase());
      if (!c) throw new BadRequestError('Invalid coupon code');
      const err = couponError(c, subTotal); if (err) throw new BadRequestError(err);
      discount = couponDiscount(c, subTotal); coupon = { id: c.id, code: c.code };
    }
    return { lines, subTotal, discount, ...totals({ subTotal, discount, deliveryCharges: s.deliveryCharges, freeDeliveryThreshold: s.freeDeliveryThreshold, taxPercent: s.taxPercent }), coupon, currency: s.currency };
  }
}
