import { z } from 'zod';
const oid = z.string().regex(/^[a-f\d]{24}$/i);
export const cartItemDto = z.object({ productId: oid, variant: z.string().optional(), quantity: z.number().int().min(1).max(50) });
export const updateQtyDto = z.object({ quantity: z.number().int().min(1).max(50) });
export const mergeCartDto = z.object({ items: z.array(cartItemDto).max(100) });
export const quoteDto = z.object({ items: z.array(cartItemDto).min(1), couponCode: z.string().optional() });
export type CartItemInput = z.infer<typeof cartItemDto>;
