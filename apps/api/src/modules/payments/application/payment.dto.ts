import { z } from 'zod';
export const bankReferenceDto = z.object({ reference: z.string().min(4).max(100), senderName: z.string().max(100).optional(), email: z.string().email().optional() });
