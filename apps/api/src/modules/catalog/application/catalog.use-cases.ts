import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/domain/errors';
import { PageRequest, toPage } from '../../../shared/domain/pagination';
import { slugify } from '../../../shared/domain/text';
import { SettingsRepository } from '../../settings/domain/settings';
import { CategoryRepository, NewCategory } from '../domain/category';
import { InventoryLedger } from '../domain/inventory';
import { assertValidPricing, Product, ProductRepository } from '../domain/product';
import { AdjustStockInput, CreateProductInput, ListProductsInput, UpdateProductInput } from './catalog.dto';

export class ListProducts {
  constructor(private products: ProductRepository, private categories: CategoryRepository) {}
  async execute(q: ListProductsInput, opts: { activeOnly: boolean } = { activeOnly: true }) {
    const req: PageRequest = { page: q.page, limit: q.limit };
    let categoryId = q.categoryId;
    if (q.category) { const c = await this.categories.findBySlug(q.category); if (!c) return toPage<Product>([], 0, req); categoryId = c.id; }
    return this.products.search({ activeOnly: opts.activeOnly, search: q.q, categoryId, minPrice: q.minPrice, maxPrice: q.maxPrice, featured: !!q.featured, bestSeller: !!q.bestSeller }, q.sort, req);
  }
}
export class GetProductBySlug {
  constructor(private products: ProductRepository) {}
  async execute(slug: string) {
    const p = await this.products.findBySlug(slug, true); if (!p) throw new NotFoundError('Product not found');
    return { ...p, related: await this.products.findRelated(p.categoryId, p.id, 4) };
  }
}
export class GetProduct { constructor(private products: ProductRepository) {} async execute(id: string, activeOnly = true) { const p = await this.products.findById(id, activeOnly); if (!p) throw new NotFoundError('Product not found'); return p; } }
export class CreateProduct {
  constructor(private products: ProductRepository, private ledger: InventoryLedger) {}
  async execute(i: CreateProductInput, by: string) {
    assertValidPricing(i.price, i.discountPrice);
    const p = await this.products.create({ ...i, slug: i.slug ?? slugify(i.name) });
    await this.ledger.record({ productId: p.id, type: 'Initial', change: p.stockQuantity, balanceAfter: p.stockQuantity, reason: 'Product created', by });
    return p;
  }
}
export class UpdateProduct {
  constructor(private products: ProductRepository, private ledger: InventoryLedger) {}
  async execute(id: string, patch: UpdateProductInput, by: string) {
    const cur = await this.products.findById(id, false); if (!cur) throw new NotFoundError('Product not found');
    const { stockQuantity, ...rest } = patch; // stock changes always go through the ledger
    assertValidPricing(rest.price ?? cur.price, 'discountPrice' in rest ? rest.discountPrice : cur.discountPrice);
    if (Object.keys(rest).length) await this.products.update(id, rest);
    if (stockQuantity !== undefined) {
      const r = await this.products.setStock(id, stockQuantity);
      if (r && r.after !== r.before) await this.ledger.record({ productId: id, type: 'Adjustment', change: r.after - r.before, balanceAfter: r.after, reason: 'Edited in product form', by });
    }
    return (await this.products.findById(id, false))!;
  }
}
export class DeleteProduct { constructor(private products: ProductRepository) {} async execute(id: string) { if (!(await this.products.delete(id))) throw new NotFoundError('Product not found'); } }

export class ListCategories { constructor(private categories: CategoryRepository) {} execute(activeOnly = true) { return this.categories.list(activeOnly); } }
export class CreateCategory { constructor(private categories: CategoryRepository) {} execute(i: Omit<NewCategory, 'slug'> & { slug?: string }) { return this.categories.create({ ...i, slug: i.slug ?? slugify(i.name) }); } }
export class UpdateCategory { constructor(private categories: CategoryRepository) {} async execute(id: string, p: Partial<NewCategory>) { const c = await this.categories.update(id, p); if (!c) throw new NotFoundError('Category not found'); return c; } }
export class DeleteCategory {
  constructor(private categories: CategoryRepository, private products: ProductRepository) {}
  async execute(id: string) {
    if (await this.products.existsInCategory(id)) throw new ConflictError('Category has products; deactivate it or move the products first');
    if (!(await this.categories.delete(id))) throw new NotFoundError('Category not found');
  }
}
export class AdjustStock {
  constructor(private products: ProductRepository, private ledger: InventoryLedger) {}
  async execute(productId: string, i: AdjustStockInput, by: string) {
    let change: number; let after: number;
    if (i.set !== undefined) {
      if (i.set < 0) throw new BadRequestError('Stock cannot be negative');
      const r = await this.products.setStock(productId, i.set); if (!r) throw new NotFoundError('Product not found');
      change = r.after - r.before; after = r.after;
    } else {
      change = i.change ?? 0; const r = await this.products.changeStock(productId, change);
      if (!r.ok) throw r.reason === 'not_found' ? new NotFoundError('Product not found') : new ConflictError('Insufficient stock for this adjustment');
      after = r.after;
    }
    if (change !== 0) await this.ledger.record({ productId, type: change > 0 ? 'Restock' : 'Adjustment', change, balanceAfter: after, reason: i.reason, by });
    return { change, balanceAfter: after };
  }
}
export class ListInventory {
  constructor(private products: ProductRepository, private settings: SettingsRepository) {}
  async execute(status: 'all' | 'low' | 'out', req: PageRequest) {
    const { lowStockThreshold: threshold } = await this.settings.get();
    const page = await this.products.listStock(status, threshold, req);
    return { threshold, ...page, items: page.items.map(p => ({ id: p.id, name: p.name, sku: p.sku, stockQuantity: p.stockQuantity, isActive: p.isActive, status: p.stockQuantity === 0 ? 'out' : p.stockQuantity <= threshold ? 'low' : 'ok' })) };
  }
}
export class GetInventoryHistory { constructor(private ledger: InventoryLedger) {} execute(productId: string | undefined, req: PageRequest) { return this.ledger.history(productId, req); } }
