import { Router } from 'express';
import { AuthGuards, idParams, validate } from '../../../shared/presentation/http';
import * as D from '../application/catalog.dto';
import { CatalogController } from './catalog.controller';
/** Mounted at /api */
export function buildCatalogRoutes(c: CatalogController, g: AuthGuards) {
  const r = idParams(Router(), ['id']);
  r.get('/categories', c.categories);
  r.post('/categories', ...g.adminOnly, validate(D.categoryDto), c.createCategory);
  r.put('/categories/:id', ...g.adminOnly, validate(D.categoryUpdateDto), c.updateCategory);
  r.delete('/categories/:id', ...g.adminOnly, c.deleteCategory);
  r.get('/products', validate(D.listProductsDto, 'query'), c.products);
  r.get('/products/slug/:slug', c.bySlug);
  r.get('/products/:id', c.byId);
  r.post('/products', ...g.adminOnly, validate(D.createProductDto), c.create);
  r.put('/products/:id', ...g.adminOnly, validate(D.updateProductDto), c.update);
  r.delete('/products/:id', ...g.adminOnly, c.remove);
  return r;
}
/** Mounted at /api/admin (admin guard applied by the parent router) */
export function buildCatalogAdminRoutes(c: CatalogController) {
  const r = idParams(Router(), ['productId', 'id']);
  r.get('/products', c.adminProducts); r.get('/products/:id', c.adminProduct); r.get('/categories', c.adminCategories);
  r.get('/inventory', c.inventory); r.get('/inventory/history', c.history); r.put('/inventory/:productId', validate(D.adjustStockDto), c.adjust);
  return r;
}
