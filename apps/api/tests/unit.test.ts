import { describe, expect, it } from 'vitest';
import { couponDiscount, couponError } from '../src/modules/promotions/domain/coupon';
import { totals, unitPrice } from '../src/modules/pricing/domain/pricing';
import { canTransition } from '../src/modules/orders/domain/order';
import { toCsv } from '../src/shared/presentation/csv';
import { easypaisaHash, jazzSecureHash, verifyEasypaisa, verifyJazz } from '../src/modules/payments/infrastructure/signing';
import { cleanInput as clean } from '../src/shared/presentation/http';
import { registerDto as registerSchema } from '../src/modules/identity/application/auth.dto';

const pct = { discountType: 'Percentage' as const, discountValue: 10, maxDiscount: 500, minimumOrderAmount: 1000, isActive: true, usedCount: 0 };
describe('pricing', () => {
  it('uses discount price and variant delta', () => { expect(unitPrice({ price: 650, discountPrice: 590 }, 100)).toBe(690); expect(unitPrice({ price: 450 })).toBe(450); });
  it('percentage coupon with cap', () => { expect(couponDiscount(pct, 2000)).toBe(200); expect(couponDiscount(pct, 9000)).toBe(500); });
  it('fixed coupon never exceeds subtotal', () => { expect(couponDiscount({ ...pct, discountType: 'Fixed', discountValue: 700 }, 500)).toBe(500); });
  it('coupon validation errors', () => {
    expect(couponError({ ...pct, isActive: false }, 2000)).toMatch(/not active/);
    expect(couponError({ ...pct, expiryDate: new Date('2020-01-01') }, 2000)).toMatch(/expired/);
    expect(couponError({ ...pct, usageLimit: 1, usedCount: 1 }, 2000)).toMatch(/limit/);
    expect(couponError(pct, 500)).toMatch(/Minimum/);
    expect(couponError(pct, 2000)).toBeNull();
  });
  it('delivery, free threshold, tax', () => {
    expect(totals({ subTotal: 1000, discount: 0, deliveryCharges: 200, freeDeliveryThreshold: 3000, taxPercent: 0 })).toEqual({ deliveryCharges: 200, tax: 0, totalAmount: 1200 });
    expect(totals({ subTotal: 3000, discount: 0, deliveryCharges: 200, freeDeliveryThreshold: 3000, taxPercent: 0 }).deliveryCharges).toBe(0);
    expect(totals({ subTotal: 2000, discount: 200, deliveryCharges: 200, freeDeliveryThreshold: 3000, taxPercent: 10 })).toEqual({ deliveryCharges: 200, tax: 180, totalAmount: 2180 });
  });
});
describe('order flow', () => {
  it('allows forward moves and cancel; blocks the rest', () => {
    expect(canTransition('Pending', 'Confirmed')).toBe(true); expect(canTransition('Processing', 'Cancelled')).toBe(true);
    expect(canTransition('Shipped', 'Cancelled')).toBe(false); expect(canTransition('Delivered', 'Pending')).toBe(false); expect(canTransition('Cancelled', 'Confirmed')).toBe(false);
  });
});
describe('gateway hashing', () => {
  const p = { pp_Amount: '100000', pp_TxnRefNo: 'T1', pp_MerchantID: 'M', empty: '' };
  it('jazzcash hash verifies and detects tampering', () => {
    const h = jazzSecureHash(p, 'salt');
    expect(verifyJazz({ ...p, pp_SecureHash: h }, 'salt')).toBe(true);
    expect(verifyJazz({ ...p, pp_Amount: '1', pp_SecureHash: h }, 'salt')).toBe(false);
    expect(verifyJazz({ ...p, pp_SecureHash: h }, 'other')).toBe(false);
    expect(verifyJazz(p, 'salt')).toBe(false);
  });
  it('easypaisa hash verifies and detects tampering', () => {
    const q = { storeId: '1', amount: '10.0', orderRefNum: 'T2' };
    const h = easypaisaHash(q, 'k');
    expect(verifyEasypaisa({ ...q, merchantHashedReq: h }, 'k')).toBe(true);
    expect(verifyEasypaisa({ ...q, amount: '1.0', merchantHashedReq: h }, 'k')).toBe(false);
  });
});
describe('misc', () => {
  it('csv escapes and blocks formula injection', () => { expect(toCsv([{ a: 'x,"y"', b: '=SUM(A1)' }])).toBe(`a,b\n"x,""y""",'=SUM(A1)`); });
  it('sanitize strips $ and dotted keys', () => { expect(clean({ a: { $gt: '' }, 'b.c': 1, ok: [{ $ne: 1, y: 2 }] })).toEqual({ a: {}, ok: [{ y: 2 }] }); });
  it('password and phone rules', () => {
    expect(registerSchema.safeParse({ fullName: 'Ali Khan', email: 'a@b.pk', password: 'weakpass' }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: 'Ali Khan', email: 'a@b.pk', password: 'Strong123', phoneNumber: '03001234567' }).success).toBe(true);
    expect(registerSchema.safeParse({ fullName: 'Ali Khan', email: 'a@b.pk', password: 'Strong123', phoneNumber: '12345' }).success).toBe(false);
  });
});
