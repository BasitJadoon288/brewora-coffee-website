import { Router } from 'express';
import { asyncHandler, validate } from '../../../shared/presentation/http';
import { pageContentDto } from '../application/content.dto';
import { GetPageContent, ListActiveBanners, ListActiveTestimonials, UpdatePageContent } from '../application/content.use-cases';
/** Mounted at /api */
export function buildPublicContentRoutes(d: { banners: ListActiveBanners; testimonials: ListActiveTestimonials; page: GetPageContent }) {
  const r = Router();
  r.get('/banners', asyncHandler(async (req, res) => { res.json(await d.banners.execute(req.query.placement ? String(req.query.placement) : undefined)); }));
  r.get('/testimonials', asyncHandler(async (_q, res) => { res.json(await d.testimonials.execute()); }));
  r.get('/content/:key', asyncHandler(async (req, res) => { res.json(await d.page.execute(req.params.key)); }));
  return r;
}
export const buildAdminContentRoutes = (u: UpdatePageContent) => Router().put('/:key', validate(pageContentDto), asyncHandler(async (req, res) => { res.json(await u.execute(req.params.key, req.body)); }));
