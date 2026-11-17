import { CrudRepository } from '../../../shared/domain/crud';
import { Page, PageRequest } from '../../../shared/domain/pagination';
export interface Review { id: string; product?: { id: string; name: string; slug: string }; productId: string; userId: string; userName?: string; rating: number; comment?: string; isVerifiedPurchase: boolean; isApproved: boolean; createdAt: Date }
export type NewReview = Omit<Review, 'id' | 'createdAt' | 'isApproved'>;
export interface ReviewRepository {
  listApproved(productId: string, req: PageRequest): Promise<Page<Review>>;
  create(r: NewReview): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  delete(id: string): Promise<void>;
  ratingStats(productId: string): Promise<{ average: number; count: number }>;
  listAll(req: PageRequest, approved?: boolean): Promise<Page<Review>>;
  setApproved(id: string, approved: boolean): Promise<Review | null>;
}
export interface WishlistRepository { productIds(userId: string): Promise<string[]>; add(userId: string, productId: string): Promise<void>; remove(userId: string, productId: string): Promise<void> }
export interface Address { id: string; userId: string; label: string; fullName: string; phone: string; line1: string; city: string; postalCode?: string; isDefault: boolean; createdAt: Date }
export type NewAddress = Omit<Address, 'id' | 'userId' | 'createdAt'>;
export interface AddressRepository {
  listByUser(userId: string): Promise<Address[]>; countByUser(userId: string): Promise<number>; clearDefault(userId: string): Promise<void>;
  create(userId: string, a: NewAddress): Promise<Address>; update(userId: string, id: string, patch: Partial<NewAddress>): Promise<Address | null>; delete(userId: string, id: string): Promise<boolean>;
}
export type NotificationScope = { audience: 'Admin' } | { audience: 'User'; userId: string };
export interface Notification { id: string; audience: 'Admin' | 'User'; userId?: string; title: string; message?: string; type?: string; link?: string; isRead: boolean; createdAt: Date }
export type NewNotification = Pick<Notification, 'audience' | 'userId' | 'title' | 'message' | 'type' | 'link'>;
export interface NotificationRepository {
  create(n: NewNotification): Promise<void>; list(scope: NotificationScope, req: PageRequest): Promise<Notification[]>; countUnread(scope: NotificationScope): Promise<number>;
  markRead(scope: NotificationScope, id: string): Promise<Notification | null>; markAll(scope: NotificationScope): Promise<void>; recentForAdmins(limit: number): Promise<Notification[]>;
}
export interface NewsletterSubscriber { id: string; email: string; isActive: boolean; createdAt: Date }
export interface NewsletterRepository { subscribe(email: string): Promise<void>; list(req: PageRequest): Promise<Page<NewsletterSubscriber>> }
export interface ContactMessage { id: string; name: string; email: string; phone?: string; subject?: string; message: string; isRead: boolean; createdAt: Date }
export type NewContactMessage = Omit<ContactMessage, 'id' | 'createdAt'>;
export type ContactRepository = CrudRepository<ContactMessage, NewContactMessage>;
