import { CrudRepository } from '../../../shared/domain/crud';
import { BadRequestError } from '../../../shared/domain/errors';
import { round2 } from '../../../shared/domain/text';
export interface Coupon {
  id: string; code: string; description?: string; discountType: 'Percentage' | 'Fixed'; discountValue: number; maxDiscount?: number | null;
  minimumOrderAmount: number; expiryDate?: Date | null; usageLimit?: number | null; usedCount: number; isActive: boolean; createdAt: Date; updatedAt: Date;
}
export type NewCoupon = Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>;
export interface CouponRepository extends CrudRepository<Coupon, NewCoupon> {
  findByCode(code: string): Promise<Coupon | null>;
  /** Atomically consumes one use; false if the limit is reached or coupon inactive. */
  tryIncrementUsage(id: string): Promise<boolean>;
  decrementUsageByCode(code: string): Promise<void>;
}
type CouponRules = Pick<Coupon, 'discountType' | 'discountValue' | 'maxDiscount' | 'minimumOrderAmount' | 'expiryDate' | 'usageLimit' | 'usedCount' | 'isActive'>;
export function couponError(c: CouponRules, subTotal: number, now = new Date()): string | null {
  if (!c.isActive) return 'Coupon is not active';
  if (c.expiryDate && c.expiryDate.getTime() < now.getTime()) return 'Coupon has expired';
  if (c.usageLimit != null && (c.usedCount ?? 0) >= c.usageLimit) return 'Coupon usage limit reached';
  if (c.minimumOrderAmount && subTotal < c.minimumOrderAmount) return `Minimum order amount is Rs. ${c.minimumOrderAmount}`;
  return null;
}
export function couponDiscount(c: Pick<Coupon, 'discountType' | 'discountValue' | 'maxDiscount'>, subTotal: number): number {
  let d = c.discountType === 'Percentage' ? (subTotal * c.discountValue) / 100 : c.discountValue;
  if (c.discountType === 'Percentage' && c.maxDiscount) d = Math.min(d, c.maxDiscount);
  return round2(Math.max(0, Math.min(d, subTotal)));
}
export function assertCouponDefinition(c: Pick<Coupon, 'discountType' | 'discountValue'>) {
  if (c.discountValue <= 0) throw new BadRequestError('Discount value must be positive');
  if (c.discountType === 'Percentage' && c.discountValue > 100) throw new BadRequestError('Percentage cannot exceed 100');
}
