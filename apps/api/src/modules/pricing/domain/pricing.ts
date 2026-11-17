import { round2 } from '../../../shared/domain/text';
export const unitPrice = (p: { price: number; discountPrice?: number | null }, delta = 0) => round2((p.discountPrice ?? p.price) + (delta || 0));
export function totals(o: { subTotal: number; discount: number; deliveryCharges: number; freeDeliveryThreshold: number; taxPercent: number }) {
  const taxable = Math.max(o.subTotal - o.discount, 0);
  const free = o.freeDeliveryThreshold > 0 && taxable >= o.freeDeliveryThreshold;
  const deliveryCharges = o.subTotal === 0 || free ? 0 : o.deliveryCharges;
  const tax = round2((taxable * o.taxPercent) / 100);
  return { deliveryCharges, tax, totalAmount: round2(taxable + deliveryCharges + tax) };
}
