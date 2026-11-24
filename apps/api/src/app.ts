import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { Container } from './container';
import { openapi } from './docs/openapi';
import { Env } from './shared/infrastructure/env';
import { logger } from './shared/infrastructure/logger';
import { crudRouter } from './shared/presentation/crud.router';
import { createErrorHandler, publicCache, sanitize } from './shared/presentation/http';
import { buildAuthRoutes } from './modules/identity/presentation/auth.routes';
import { buildCatalogAdminRoutes, buildCatalogRoutes } from './modules/catalog/presentation/catalog.routes';
import { buildCartRoutes } from './modules/cart/presentation/cart.routes';
import { buildOrderRoutes } from './modules/orders/presentation/order.routes';
import { buildPaymentRoutes } from './modules/payments/presentation/payment.routes';
import { buildContactRoutes, buildReviewAdminRoutes, buildAddressRoutes, buildNewsletterRoutes, buildNotificationRoutes, buildReviewRoutes, buildWishlistRoutes } from './modules/engagement/presentation/engagement.routes';
import { buildAdminContentRoutes, buildPublicContentRoutes } from './modules/content/presentation/content.routes';
import { contactDto, contactUpdateDto } from './modules/engagement/application/engagement.dto';
import { bannerDto, testimonialDto } from './modules/content/application/content.dto';
import { buildAdminSettingsRoutes, buildPublicSettingsRoutes } from './modules/settings/presentation/settings.routes';
import { deliveryAreaDto, deliveryAreaUpdateDto } from './modules/delivery/application/delivery.dto';
import { buildPublicDeliveryRoutes } from './modules/delivery/presentation/delivery.routes';
import { buildCouponAdminRoutes, buildCouponPublicRoutes } from './modules/promotions/presentation/promotion.routes';
import { buildAdminRoutes } from './modules/reporting/presentation/admin.routes';
import { buildImageServeRoutes } from './modules/uploads/presentation/image.routes';
import { buildUploadRoutes } from './modules/uploads/presentation/upload.routes';

export function createApp(c: Container, env: Env) {
  const app = express(); const { guards: g, controllers: k, useCases: u } = c;
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1);
  const skip = () => env.NODE_ENV === 'test';
  app.use(helmet({ contentSecurityPolicy: false })); // CSP is set on the Next.js app; Swagger UI needs inline scripts
  app.use(cors({ origin: [env.CUSTOMER_URL, env.ADMIN_URL].filter(Boolean) as string[], credentials: true }));
  app.disable('x-powered-by');
  if (!process.env.VERCEL && env.NODE_ENV !== 'test') app.use(compression()); // Vercel's edge already compresses; self-hosted deployments need it for JSON lists

  // Static uploads are mounted BEFORE the body/cookie/sanitize/logging middleware: image requests don't need any of it, and file names are
  // random UUIDs so they can be cached "immutable" for a long time.
  app.use(['/uploads', '/api/uploads'], express.static(c.uploadDir, { maxAge: '30d', immutable: true, setHeaders: r => { r.setHeader('X-Content-Type-Options', 'nosniff'); r.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); } }));
  app.use(['/uploads', '/api/uploads'], buildImageServeRoutes(u.uploads.serve)); // pictures stored in MongoDB (files not found on disk above fall through to here)

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' })); // gateway callbacks
  app.use(cookieParser());
  app.use(sanitize);
  app.use((req, res, next) => { const t = Date.now(); res.on('finish', () => logger.info({ m: req.method, u: req.originalUrl.split('?')[0], s: res.statusCode, ms: Date.now() - t })); next(); });
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, skip }));
  if (!process.env.VERCEL) { const swaggerUi = require('swagger-ui-express') as typeof import('swagger-ui-express'); app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi)); } // lazy: not loaded on serverless cold starts
  app.get('/api/docs.json', (_q, r) => r.json(openapi));
  app.get('/api/health', (_q, r) => r.json({ ok: true }));

  // public, rarely-changing storefront reads: cacheable by the browser/CDN (short TTLs, stale-while-revalidate)
  app.get(['/api/categories', '/api/banners', '/api/testimonials', '/api/content/:key', '/api/settings/public', '/api/delivery-areas'], publicCache(60));
  app.get(['/api/products', '/api/products/slug/:slug', '/api/products/:id'], publicCache(30));
  // strict limit for login/register/password flows only; session checks (profile / refresh) are called on every page load and must not be blocked
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 40, skip: req => skip() || ['/profile', '/refresh-token'].includes(req.path) }), buildAuthRoutes(k.auth, g));
  app.use('/api/cart', buildCartRoutes(k.cart, g));
  app.use('/api/orders', buildOrderRoutes(k.orders, g));
  app.use('/api/payments', buildPaymentRoutes(k.payments, g));
  app.use('/api/wishlist', buildWishlistRoutes(k.engagement, g));
  app.use('/api/addresses', buildAddressRoutes(k.engagement, g));
  app.use('/api/notifications', buildNotificationRoutes(k.engagement, g));
  app.use('/api/newsletter', rateLimit({ windowMs: 60_000, limit: 10, skip }), buildNewsletterRoutes(k.engagement));
  app.use('/api/contact', rateLimit({ windowMs: 60_000, limit: 5, skip }), buildContactRoutes(k.engagement));
  app.use('/api/coupons', buildCouponPublicRoutes(u.promotions.validate));
  app.use('/api/delivery-areas', buildPublicDeliveryRoutes(u.delivery.list));
  app.use('/api/settings', buildPublicSettingsRoutes(k.settings));
  app.use('/api/products', buildReviewRoutes(k.engagement, g));
  app.use('/api', buildCatalogRoutes(k.catalog, g));
  app.use('/api', buildPublicContentRoutes({ banners: u.content.banners, testimonials: u.content.testimonials, page: u.content.page }));

  const admin = Router(); admin.use(...g.adminOnly);
  admin.use('/settings', buildAdminSettingsRoutes(k.settings));
  admin.use('/content', buildAdminContentRoutes(u.content.updatePage));
  admin.use('/coupons', buildCouponAdminRoutes(u.promotions.manage));
  admin.use('/delivery-areas', crudRouter(u.delivery.manage, deliveryAreaDto, deliveryAreaUpdateDto));
  admin.use('/banners', crudRouter(u.content.manageBanners, bannerDto, bannerDto.partial()));
  admin.use('/testimonials', crudRouter(u.content.manageTestimonials, testimonialDto, testimonialDto.partial()));
  admin.use('/uploads', buildUploadRoutes(u.uploads.sign, u.uploads.image));
  admin.use('/reviews', buildReviewAdminRoutes(k.engagement));
  admin.use('/messages', crudRouter(u.engagement.manageMessages, contactDto, contactUpdateDto));
  admin.use('/', buildCatalogAdminRoutes(k.catalog));
  admin.use('/', buildAdminRoutes(k.admin));
  app.use('/api/admin', admin);

  app.use('/api', (_req, res) => { res.removeHeader('Cache-Control'); res.status(404).json({ message: 'Route not found' }); });
  app.use(createErrorHandler(logger));
  return app;
}
