import { Page, PageRequest, skipOf, toPage } from '../../../shared/domain/pagination';
import { escapeRegex, fromMongo, guard, oidOrNull } from '../../../shared/infrastructure/mongo';
import { NewProduct, Product, ProductFilter, ProductRepository, ProductSort, StockChange } from '../domain/product';
import { ProductModel } from './catalog.models';

const SORT: Record<ProductSort, Record<string, 1 | -1>> = { price_asc: { price: 1 }, price_desc: { price: -1 }, popular: { salesCount: -1 }, newest: { createdAt: -1 } };
/** Maps a (possibly category-populated) lean doc to the Product entity. */
function toProduct(d: any): Product {
  const { categoryId, ...rest } = d;
  const populated = categoryId && typeof categoryId === 'object' && categoryId.name;
  const p = fromMongo<any>({ ...rest, categoryId: populated ? categoryId._id : categoryId });
  if (populated) p.category = fromMongo(categoryId);
  p.specifications ??= undefined; p.discountPrice ??= undefined;
  return p as Product;
}
export class MongoProductRepository implements ProductRepository {
  private async page(q: any, sort: Record<string, 1 | -1>, req: PageRequest): Promise<Page<Product>> {
    const [docs, total] = await Promise.all([ProductModel.find(q).sort(sort).skip(skipOf(req)).limit(req.limit).populate('categoryId', 'name slug').lean(), ProductModel.countDocuments(q)]);
    return toPage(docs.map(toProduct), total, req);
  }
  search(f: ProductFilter, sort: ProductSort, req: PageRequest) {
    const q: any = {};
    if (f.activeOnly) q.isActive = true;
    if (f.search) { const r = new RegExp(escapeRegex(f.search), 'i'); q.$or = [{ name: r }, { shortDescription: r }, { sku: r }]; }
    if (f.categoryId) q.categoryId = f.categoryId;
    if (f.minPrice !== undefined || f.maxPrice !== undefined) q.price = { ...(f.minPrice !== undefined && { $gte: f.minPrice }), ...(f.maxPrice !== undefined && { $lte: f.maxPrice }) };
    if (f.featured) q.isFeatured = true;
    if (f.bestSeller) q.isBestSeller = true;
    return this.page(q, SORT[sort], req);
  }
  /** `withCategory=false` skips the category populate (an extra round-trip) for internal callers that only need the product. */
  async findById(id: string, activeOnly = false, withCategory = true) {
    const k = oidOrNull(id); if (!k) return null;
    const q = ProductModel.findOne({ _id: k, ...(activeOnly && { isActive: true }) }); if (withCategory) q.populate('categoryId', 'name slug');
    const d = await q.lean(); return d ? toProduct(d) : null;
  }
  async findBySlug(slug: string, activeOnly = false) { const d = await ProductModel.findOne({ slug, ...(activeOnly && { isActive: true }) }).populate('categoryId', 'name slug').lean(); return d ? toProduct(d) : null; }
  async findByIds(ids: string[], activeOnly = false) { const valid = ids.filter(i => oidOrNull(i)); return (await ProductModel.find({ _id: { $in: valid }, ...(activeOnly && { isActive: true }) }).lean()).map(toProduct); }
  async findRelated(categoryId: string, excludeId: string, limit: number) { return (await ProductModel.find({ categoryId, _id: { $ne: excludeId }, isActive: true }).limit(limit).lean()).map(toProduct); }
  async create(d: NewProduct) { return toProduct((await guard(ProductModel.create(d))).toObject()); }
  async update(id: string, patch: Partial<NewProduct>) {
    const k = oidOrNull(id); if (!k) return null;
    const { discountPrice, ...rest } = patch as any;
    const update: any = { ...rest }; if ('discountPrice' in patch) update[discountPrice == null ? '$unset' : 'discountPrice'] = discountPrice == null ? { discountPrice: 1 } : discountPrice;
    const d = await guard(ProductModel.findByIdAndUpdate(k, update, { new: true, runValidators: true }).lean()); return d ? toProduct(d) : null;
  }
  async delete(id: string) { const k = oidOrNull(id); return !!(k && (await ProductModel.findByIdAndDelete(k))); }
  countAll() { return ProductModel.estimatedDocumentCount(); }
  async existsInCategory(categoryId: string) { return !!(await ProductModel.exists({ categoryId })); }
  async reserveStock(id: string, qty: number) {
    const d: any = await ProductModel.findOneAndUpdate({ _id: id, isActive: true, stockQuantity: { $gte: qty } }, { $inc: { stockQuantity: -qty, salesCount: qty } }, { new: true }).lean();
    return d ? (d.stockQuantity as number) : null;
  }
  async releaseStock(id: string, qty: number) { const d: any = await ProductModel.findOneAndUpdate({ _id: id }, { $inc: { stockQuantity: qty, salesCount: -qty } }, { new: true }).lean(); return d ? (d.stockQuantity as number) : null; }
  async changeStock(id: string, delta: number): Promise<StockChange> {
    const k = oidOrNull(id); if (!k) return { ok: false, reason: 'not_found' };
    const filter: any = { _id: k }; if (delta < 0) filter.stockQuantity = { $gte: -delta };
    const d: any = await ProductModel.findOneAndUpdate(filter, { $inc: { stockQuantity: delta } }, { new: true }).lean();
    if (d) return { ok: true, after: d.stockQuantity };
    return { ok: false, reason: (await ProductModel.exists({ _id: k })) ? 'insufficient' : 'not_found' };
  }
  async setStock(id: string, qty: number) { const k = oidOrNull(id); if (!k) return null; const b: any = await ProductModel.findOneAndUpdate({ _id: k }, { $set: { stockQuantity: qty } }, { new: false }).lean(); return b ? { before: b.stockQuantity as number, after: qty } : null; }
  listStock(status: 'all' | 'low' | 'out', threshold: number, req: PageRequest) {
    const q: any = status === 'out' ? { stockQuantity: 0 } : status === 'low' ? { stockQuantity: { $gt: 0, $lte: threshold } } : {};
    return this.page(q, { stockQuantity: 1 }, req);
  }
  countLowStock(threshold: number) { return ProductModel.countDocuments({ stockQuantity: { $lte: threshold } }); }
  async lowStock(threshold: number, limit: number) { return (await ProductModel.find({ stockQuantity: { $lte: threshold } }).sort('stockQuantity').limit(limit).lean()).map(toProduct); }
  async updateRating(id: string, average: number, count: number) { await ProductModel.updateOne({ _id: id }, { ratingAverage: average, ratingCount: count }); }
}
