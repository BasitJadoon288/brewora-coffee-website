import { z } from 'zod';
export const bannerDto = z.object({ title: z.string().min(1), subtitle: z.string().optional(), image: z.string().min(1), linkUrl: z.string().optional(), buttonText: z.string().optional(), placement: z.enum(['hero', 'promo']).default('hero'), sortOrder: z.number().int().default(0), isActive: z.boolean().default(true) });
export const testimonialDto = z.object({ name: z.string().min(1), text: z.string().min(1).max(1000), rating: z.number().int().min(1).max(5).default(5), avatar: z.string().optional(), isActive: z.boolean().default(true) });
export const pageContentDto = z.record(z.any());
