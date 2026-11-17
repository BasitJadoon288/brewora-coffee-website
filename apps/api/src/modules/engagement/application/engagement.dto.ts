import { z } from 'zod';
export const reviewDto = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(2000).optional() });
export const addressDto = z.object({ label: z.string().max(30).default('Home'), fullName: z.string().min(2), phone: z.string().regex(/^(\+92|0)3\d{9}$/), line1: z.string().min(5), city: z.string().min(2), postalCode: z.string().optional(), isDefault: z.boolean().default(false) });
export const addressUpdateDto = addressDto.partial();
export const subscribeDto = z.object({ email: z.string().email() });
export const contactDto = z.object({ name: z.string().min(2).max(100), email: z.string().email(), phone: z.string().max(30).optional(), subject: z.string().max(150).optional(), message: z.string().min(10).max(3000) });
export const contactUpdateDto = z.object({ isRead: z.boolean() });
export const approvalDto = z.object({ isApproved: z.boolean() });
