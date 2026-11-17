import { z } from 'zod';
const money = z.number().min(0);
export const couponBaseDto = z.object({
  code: z.string().min(3).max(30).transform(s => s.trim().toUpperCase()), description: z.string().optional(), discountType: z.enum(['Percentage', 'Fixed']), discountValue: z.number().positive(),
  maxDiscount: money.nullable().optional(), minimumOrderAmount: money.default(0), expiryDate: z.coerce.date().nullable().optional(), usageLimit: z.number().int().min(1).nullable().optional(), isActive: z.boolean().default(true),
});
export const couponUpdateDto = couponBaseDto.partial();
export const validateCouponDto = z.object({ code: z.string().min(1), subTotal: z.number().min(0) });
