import { z } from 'zod';
const oid = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const img = z.object({ url: z.string().refine(u => u.startsWith('/') || /^https:\/\//.test(u), 'Must be https URL or /path'), alt: z.string().default('') });
export const listProductsDto = z.object({
  q: z.string().optional(), category: z.string().optional(), minPrice: z.coerce.number().min(0).optional(), maxPrice: z.coerce.number().min(0).optional(),
  featured: z.enum(['true']).optional(), bestSeller: z.enum(['true']).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'popular', 'newest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type ListProductsInput = z.infer<typeof listProductsDto> & { categoryId?: string };
const productBase = z.object({
  name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/).optional(), description: z.string().min(1), shortDescription: z.string().optional(),
  price: z.number().min(0), discountPrice: z.number().min(0).nullable().optional(), categoryId: oid, sku: z.string().min(1), stockQuantity: z.number().int().min(0),
  images: z.array(img).default([]), variants: z.array(z.object({ name: z.string(), size: z.string().optional(), priceDelta: z.number().default(0) })).default([]),
  specifications: z.record(z.string()).optional(), isFeatured: z.boolean().default(false), isBestSeller: z.boolean().default(false), isActive: z.boolean().default(true),
});
export const createProductDto = productBase;
export const updateProductDto = productBase.partial();
export type CreateProductInput = z.infer<typeof createProductDto>;
export type UpdateProductInput = z.infer<typeof updateProductDto>;
export const categoryDto = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/).optional(), description: z.string().optional(), image: z.string().optional(), isActive: z.boolean().default(true) });
export const categoryUpdateDto = categoryDto.partial();
export const adjustStockDto = z.object({ change: z.number().int().optional(), set: z.number().int().min(0).optional(), reason: z.string().min(2).max(200) })
  .refine(d => (d.change === undefined) !== (d.set === undefined), 'Provide exactly one of change or set');
export type AdjustStockInput = z.infer<typeof adjustStockDto>;
