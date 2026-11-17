import { Router } from 'express';
import { AuthGuards, idParams, validate } from '../../../shared/presentation/http';
import * as D from '../application/engagement.dto';
import { EngagementController } from './engagement.controller';
export const buildWishlistRoutes = (c: EngagementController, g: AuthGuards) => {
  const r = idParams(Router(), ['productId']).use(g.authenticate);
  r.get('/', c.wishlist); r.post('/:productId', c.wishlistAdd); r.delete('/:productId', c.wishlistRemove); r.post('/:productId/move-to-cart', c.wishlistMove); return r;
};
/** Mounted at /api/products */
export const buildReviewRoutes = (c: EngagementController, g: AuthGuards) => {
  const r = idParams(Router(), ['id', 'reviewId']);
  r.get('/:id/reviews', c.reviews); r.post('/:id/reviews', g.authenticate, validate(D.reviewDto), c.addReview); r.delete('/:id/reviews/:reviewId', g.authenticate, c.deleteReview); return r;
};
export const buildAddressRoutes = (c: EngagementController, g: AuthGuards) => {
  const r = idParams(Router(), ['id']).use(g.authenticate);
  r.get('/', c.addresses); r.post('/', validate(D.addressDto), c.createAddress); r.put('/:id', validate(D.addressUpdateDto), c.updateAddress); r.delete('/:id', c.deleteAddress); return r;
};
export const buildNotificationRoutes = (c: EngagementController, g: AuthGuards) => {
  const r = idParams(Router(), ['id']).use(g.authenticate);
  r.get('/', c.notifications); r.put('/read-all', c.readAll); r.put('/:id/read', c.readOne); return r;
};
export const buildNewsletterRoutes = (c: EngagementController) => Router().post('/subscribe', validate(D.subscribeDto), c.subscribe);
export const buildContactRoutes = (c: EngagementController) => Router().post('/', validate(D.contactDto), c.contact);
/** Mounted at /api/admin/reviews */
export const buildReviewAdminRoutes = (c: EngagementController) => {
  const r = idParams(Router(), ['id']);
  r.get('/', c.adminReviews); r.put('/:id/approval', validate(D.approvalDto), c.approve); r.delete('/:id', c.adminRemoveReview); return r;
};
