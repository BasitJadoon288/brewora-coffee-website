import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/domain/errors';
import { PageRequest } from '../../../shared/domain/pagination';
import { Viewer } from '../../../shared/domain/types';
import { AddCartItem } from '../../cart/application/cart.use-cases';
import { ProductRepository } from '../../catalog/domain/product';
import { UserRepository } from '../../identity/domain/user';
import { OrderRepository } from '../../orders/domain/order';
import { AddressRepository, ContactRepository, NewAddress, NewsletterRepository, NotificationRepository, NotificationScope, ReviewRepository, WishlistRepository } from '../domain/engagement';

// ---- Wishlist
export class GetWishlist {
  constructor(private wishlist: WishlistRepository, private products: ProductRepository) {}
  async execute(userId: string) {
    const ids = await this.wishlist.productIds(userId); const by = new Map((await this.products.findByIds(ids)).map(p => [p.id, p]));
    return { products: ids.map(i => by.get(i)).filter(Boolean) };
  }
}
export class AddToWishlist {
  constructor(private wishlist: WishlistRepository, private products: ProductRepository, private get: GetWishlist) {}
  async execute(userId: string, productId: string) { if (!(await this.products.findById(productId, true))) throw new NotFoundError('Product not found'); await this.wishlist.add(userId, productId); return this.get.execute(userId); }
}
export class RemoveFromWishlist { constructor(private wishlist: WishlistRepository, private get: GetWishlist) {} async execute(userId: string, productId: string) { await this.wishlist.remove(userId, productId); return this.get.execute(userId); } }
export class MoveWishlistToCart {
  constructor(private wishlist: WishlistRepository, private addToCart: AddCartItem) {}
  async execute(userId: string, productId: string) { const cart = await this.addToCart.execute(userId, { productId, quantity: 1 }); await this.wishlist.remove(userId, productId); return cart; }
}
// ---- Reviews
export class RatingUpdater {
  constructor(private reviews: ReviewRepository, private products: ProductRepository) {}
  async refresh(productId: string) { const s = await this.reviews.ratingStats(productId); await this.products.updateRating(productId, Math.round(s.average * 10) / 10, s.count); }
}
export class ListReviews { constructor(private reviews: ReviewRepository) {} async execute(productId: string, req: PageRequest) { const p = await this.reviews.listApproved(productId, req); return { ...p, items: p.items.map(({ userId, ...r }) => r) }; } }
export class AddReview {
  constructor(private reviews: ReviewRepository, private products: ProductRepository, private users: UserRepository, private orders: OrderRepository, private rating: RatingUpdater) {}
  async execute(viewer: Viewer, productId: string, i: { rating: number; comment?: string }) {
    if (!(await this.products.findById(productId))) throw new NotFoundError('Product not found');
    const user = await this.users.findById(viewer.id); if (!user) throw new NotFoundError('User not found');
    const isVerifiedPurchase = await this.orders.hasDeliveredPurchase(viewer.id, productId);
    let review; try { review = await this.reviews.create({ productId, userId: viewer.id, userName: user.fullName, rating: i.rating, comment: i.comment, isVerifiedPurchase }); }
    catch (e) { if (e instanceof ConflictError) throw new ConflictError('You already reviewed this product'); throw e; }
    await this.rating.refresh(productId); return review;
  }
}
export class DeleteReview {
  constructor(private reviews: ReviewRepository, private rating: RatingUpdater) {}
  async execute(viewer: Viewer, productId: string, reviewId: string) {
    const r = await this.reviews.findById(reviewId);
    if (!r || r.productId !== productId || (viewer.role !== 'Admin' && r.userId !== viewer.id)) throw new NotFoundError('Review not found');
    await this.reviews.delete(reviewId); await this.rating.refresh(productId);
  }
}
// ---- Addresses
export class ListAddresses { constructor(private a: AddressRepository) {} execute(userId: string) { return this.a.listByUser(userId); } }
export class CreateAddress {
  constructor(private a: AddressRepository) {}
  async execute(userId: string, i: NewAddress) { const first = (await this.a.countByUser(userId)) === 0; if (i.isDefault) await this.a.clearDefault(userId); return this.a.create(userId, { ...i, isDefault: i.isDefault || first }); }
}
export class UpdateAddress {
  constructor(private a: AddressRepository) {}
  async execute(userId: string, id: string, p: Partial<NewAddress>) { if (p.isDefault) await this.a.clearDefault(userId); const r = await this.a.update(userId, id, p); if (!r) throw new NotFoundError('Address not found'); return r; }
}
export class DeleteAddress { constructor(private a: AddressRepository) {} async execute(userId: string, id: string) { if (!(await this.a.delete(userId, id))) throw new NotFoundError('Address not found'); } }
// ---- Notifications
const scopeOf = (v: Viewer): NotificationScope => (v.role === 'Admin' ? { audience: 'Admin' } : { audience: 'User', userId: v.id });
export class ListNotifications { constructor(private n: NotificationRepository) {} async execute(v: Viewer, req: PageRequest) { const s = scopeOf(v); const [items, unread] = await Promise.all([this.n.list(s, req), this.n.countUnread(s)]); return { items, unread, page: req.page }; } }
export class MarkNotificationRead { constructor(private n: NotificationRepository) {} async execute(v: Viewer, id: string) { const r = await this.n.markRead(scopeOf(v), id); if (!r) throw new NotFoundError('Notification not found'); return r; } }
export class MarkAllNotificationsRead { constructor(private n: NotificationRepository) {} async execute(v: Viewer) { await this.n.markAll(scopeOf(v)); return { ok: true }; } }
// ---- Newsletter
export class SubscribeNewsletter { constructor(private n: NewsletterRepository) {} async execute(email: string) { await this.n.subscribe(email.toLowerCase()); return { message: 'Subscribed' }; } }
export class ListSubscribers { constructor(private n: NewsletterRepository) {} execute(req: PageRequest) { return this.n.list(req); } }
// ---- Contact form
export class SubmitContactMessage {
  constructor(private repo: ContactRepository) {}
  async execute(i: { name: string; email: string; phone?: string; subject?: string; message: string }) { await this.repo.create({ ...i, email: i.email.toLowerCase(), isRead: false }); return { message: 'Thanks! We will get back to you soon.' }; }
}
// ---- Review moderation (admin)
export class ListAllReviews { constructor(private reviews: ReviewRepository) {} execute(req: PageRequest, approved?: boolean) { return this.reviews.listAll(req, approved); } }
export class SetReviewApproval {
  constructor(private reviews: ReviewRepository, private rating: RatingUpdater) {}
  async execute(id: string, approved: boolean) { const r = await this.reviews.setApproved(id, approved); if (!r) throw new NotFoundError('Review not found'); await this.rating.refresh(r.productId); return r; }
}
export class RemoveReview {
  constructor(private reviews: ReviewRepository, private rating: RatingUpdater) {}
  async execute(id: string) { const r = await this.reviews.findById(id); if (!r) throw new NotFoundError('Review not found'); await this.reviews.delete(id); await this.rating.refresh(r.productId); }
}
