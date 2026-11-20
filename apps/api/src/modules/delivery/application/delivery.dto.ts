import { z } from 'zod';
export const deliveryAreaDto = z.object({
  name: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(60).default('Karachi'), charge: z.number().min(0),
  freeDeliveryThreshold: z.number().min(0).nullable().optional(), isActive: z.boolean().default(true), sortOrder: z.number().int().default(0),
});
export const deliveryAreaUpdateDto = deliveryAreaDto.partial();
