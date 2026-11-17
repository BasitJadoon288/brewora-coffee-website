import { z } from 'zod';
import { ORDER_STATUSES } from '../domain/order';
const oid = z.string().regex(/^[a-f\d]{24}$/i);
export const placeOrderDto = z.object({
  items: z.array(z.object({ productId: oid, variant: z.string().optional(), quantity: z.number().int().min(1).max(50) })).min(1),
  couponCode: z.string().optional(), idempotencyKey: z.string().min(8).max(100).optional(),
  paymentMethod: z.enum(['COD', 'JazzCash', 'EasyPaisa', 'BankTransfer']),
  customer: z.object({ fullName: z.string().min(2), email: z.string().email(), phone: z.string().regex(/^(\+92|0)3\d{9}$/, 'Invalid Pakistani mobile number'), notes: z.string().max(500).optional() }),
  shippingAddress: z.object({ line1: z.string().min(5), city: z.string().min(2), postalCode: z.string().optional() }),
});
export type PlaceOrderInput = z.infer<typeof placeOrderDto>;
export const updateStatusDto = z.object({ status: z.enum(ORDER_STATUSES), note: z.string().max(300).optional() });
export const markPaymentDto = z.object({ status: z.enum(['Paid', 'Failed']), reference: z.string().optional() });
export const refundDto = z.object({ amount: z.number().positive().optional(), note: z.string().max(300).optional() });
