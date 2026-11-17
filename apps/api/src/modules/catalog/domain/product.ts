import { BadRequestError } from '../../../shared/domain/errors';
import { Page, PageRequest } from '../../../shared/domain/pagination';
export interface ProductVariant { name: string; size?: string; priceDelta: number }
export interface ProductImage { url: string; alt: string }
export interface Product {
  id: string; name: string; slug: string; description: string; shortDescription?: string; price: number; discountPrice?: number | null;
  categoryId: string; category?: { id: string; name: string; slug: string }; images: ProductImage[]; variants: ProductVariant[]; specifications?: Record<string, string>;
  stockQuantity: number; sku: string; salesCount: number; ratingAverage: number; ratingCount: number;
  isFeatured: boolean; isBestSeller: boolean; isActive: boolean; createdAt: Date; updatedAt: Date;
}
export type NewProduct = Omit<Product, 'id' | 'category' | 'salesCount' | 'ratingAverage' | 'ratingCount' | 'createdAt' | 'updatedAt'>;
export type ProductSort = 'price_asc' | 'price_desc' | 'popular' | 'newest';
export interface ProductFilter { activeOnly: boolean; search?: string; categoryId?: string; minPrice?: number; maxPrice?: number; featured?: boolean; bestSeller?: boolean }
export type StockChange = { ok: true; after: number } | { ok: false; reason: 'not_found' | 'insufficient' };

export function assertValidPricing(price: number, discountPrice?: number | null) {
  if (price < 0) throw new BadRequestError('Price cannot be negative');
  if (discountPrice != null && discountPrice >= price) throw new BadRequestError('discountPrice must be below price');
}
export interface ProductRepository {
  search(f: ProductFilter, sort: ProductSort, req: PageRequest): Promise<Page<Product>>;
  findById(id: string, activeOnly?: boolean): Promise<Product | null>;
  findBySlug(slug: string, activeOnly?: boolean): Promise<Product | null>;
  findByIds(ids: string[], activeOnly?: boolean): Promise<Product[]>;
  findRelated(categoryId: string, excludeId: string, limit: number): Promise<Product[]>;
  create(d: NewProduct): Promise<Product>;
  update(id: string, patch: Partial<NewProduct>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  countAll(): Promise<number>;
  existsInCategory(categoryId: string): Promise<boolean>;
  /** Atomic: decrements stock only if enough is available (never negative). Returns balance, or null. */
  reserveStock(id: string, qty: number): Promise<number | null>;
  releaseStock(id: string, qty: number): Promise<number | null>;
  changeStock(id: string, delta: number): Promise<StockChange>;
  setStock(id: string, qty: number): Promise<{ before: number; after: number } | null>;
  listStock(status: 'all' | 'low' | 'out', threshold: number, req: PageRequest): Promise<Page<Product>>;
  countLowStock(threshold: number): Promise<number>;
  lowStock(threshold: number, limit: number): Promise<Product[]>;
  updateRating(id: string, average: number, count: number): Promise<void>;
}
