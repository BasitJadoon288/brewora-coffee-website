import { asyncHandler, pageRequest, validated } from '../../../shared/presentation/http';
import { isObjectId } from '../../../shared/domain/ids';
import * as UC from '../application/catalog.use-cases';
import { ListProductsInput } from '../application/catalog.dto';
export interface CatalogUseCases {
  listProducts: UC.ListProducts; getBySlug: UC.GetProductBySlug; getProduct: UC.GetProduct; createProduct: UC.CreateProduct; updateProduct: UC.UpdateProduct; deleteProduct: UC.DeleteProduct;
  listCategories: UC.ListCategories; createCategory: UC.CreateCategory; updateCategory: UC.UpdateCategory; deleteCategory: UC.DeleteCategory;
  adjustStock: UC.AdjustStock; listInventory: UC.ListInventory; inventoryHistory: UC.GetInventoryHistory;
}
export class CatalogController {
  constructor(private uc: CatalogUseCases) {}
  categories = asyncHandler(async (_q, res) => { res.json(await this.uc.listCategories.execute(true)); });
  adminCategories = asyncHandler(async (_q, res) => { res.json(await this.uc.listCategories.execute(false)); });
  createCategory = asyncHandler(async (req, res) => { res.status(201).json(await this.uc.createCategory.execute(req.body)); });
  updateCategory = asyncHandler(async (req, res) => { res.json(await this.uc.updateCategory.execute(req.params.id, req.body)); });
  deleteCategory = asyncHandler(async (req, res) => { await this.uc.deleteCategory.execute(req.params.id); res.status(204).end(); });
  products = asyncHandler(async (req, res) => { res.json(await this.uc.listProducts.execute(validated<ListProductsInput>(req))); });
  adminProducts = asyncHandler(async (req, res) => {
    const p = pageRequest(req.query); const c = String(req.query.category ?? '');
    res.json(await this.uc.listProducts.execute({ q: req.query.q ? String(req.query.q) : undefined, categoryId: isObjectId(c) ? c : undefined, sort: 'newest', ...p }, { activeOnly: false }));
  });
  bySlug = asyncHandler(async (req, res) => { res.json(await this.uc.getBySlug.execute(req.params.slug)); });
  adminProduct = asyncHandler(async (req, res) => { res.json(await this.uc.getProduct.execute(req.params.id, false)); });
  byId = asyncHandler(async (req, res) => { res.json(await this.uc.getProduct.execute(req.params.id)); });
  create = asyncHandler(async (req, res) => { res.status(201).json(await this.uc.createProduct.execute(req.body, req.user!.id)); });
  update = asyncHandler(async (req, res) => { res.json(await this.uc.updateProduct.execute(req.params.id, req.body, req.user!.id)); });
  remove = asyncHandler(async (req, res) => { await this.uc.deleteProduct.execute(req.params.id); res.status(204).end(); });
  inventory = asyncHandler(async (req, res) => { const s = String(req.query.status ?? 'all'); res.json(await this.uc.listInventory.execute(s === 'low' || s === 'out' ? s : 'all', pageRequest(req.query))); });
  adjust = asyncHandler(async (req, res) => { res.json(await this.uc.adjustStock.execute(req.params.productId, req.body, req.user!.id)); });
  history = asyncHandler(async (req, res) => { res.json(await this.uc.inventoryHistory.execute(req.query.productId ? String(req.query.productId) : undefined, pageRequest(req.query))); });
}
