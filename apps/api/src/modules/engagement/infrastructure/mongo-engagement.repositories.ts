import { PageRequest, skipOf, toPage } from '../../../shared/domain/pagination';
import { fromMongo, guard, oidOrNull } from '../../../shared/infrastructure/mongo';
import { Address, AddressRepository, ContactMessage, ContactRepository, NewContactMessage, NewAddress, NewNotification, NewReview, NewsletterRepository, Notification, NotificationRepository, NotificationScope, Review, ReviewRepository, WishlistRepository } from '../domain/engagement';
import { AddressModel, ContactModel, NewsletterModel, NotificationModel, ReviewModel, WishlistModel } from './engagement.models';
import { Types } from 'mongoose';
import { MongoCrudRepository } from '../../../shared/infrastructure/mongo-crud.repository';

export class MongoReviewRepository implements ReviewRepository {
  async listApproved(productId: string, req: PageRequest) {
    const f = { productId, isApproved: true };
    const [docs, total] = await Promise.all([ReviewModel.find(f).sort('-createdAt').skip(skipOf(req)).limit(req.limit).lean(), ReviewModel.countDocuments(f)]);
    return toPage(docs.map(d => fromMongo<Review>(d)), total, req);
  }
  async create(r: NewReview) { return fromMongo<Review>((await guard(ReviewModel.create(r))).toObject()); }
  async findById(id: string) { const k = oidOrNull(id); const d = k && (await ReviewModel.findById(k).lean()); return d ? fromMongo<Review>(d) : null; }
  async delete(id: string) { await ReviewModel.deleteOne({ _id: id }); }
  async listAll(req: PageRequest, approved?: boolean) {
    const f: any = approved === undefined ? {} : { isApproved: approved };
    const [docs, total] = await Promise.all([ReviewModel.find(f).sort('-createdAt').skip(skipOf(req)).limit(req.limit).populate('productId', 'name slug').lean(), ReviewModel.countDocuments(f)]);
    return toPage(docs.map((d: any) => { const { productId, ...rest } = d; const pop = productId && typeof productId === 'object' && productId.name; const r = fromMongo<any>({ ...rest, productId: pop ? productId._id : productId }); if (pop) r.product = fromMongo(productId); return r as Review; }), total, req);
  }
  async setApproved(id: string, approved: boolean) { const k = oidOrNull(id); if (!k) return null; const d = await ReviewModel.findByIdAndUpdate(k, { isApproved: approved }, { new: true }).lean(); return d ? fromMongo<Review>(d) : null; }
  async ratingStats(productId: string) {
    const [a] = await ReviewModel.aggregate([{ $match: { productId: new Types.ObjectId(productId), isApproved: true } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
    return { average: a?.avg ?? 0, count: a?.n ?? 0 };
  }
}
export class MongoWishlistRepository implements WishlistRepository {
  async productIds(userId: string) { const d: any = await WishlistModel.findOne({ userId }).lean(); return (d?.products ?? []).map(String); }
  async add(userId: string, productId: string) { await WishlistModel.updateOne({ userId }, { $addToSet: { products: productId } }, { upsert: true }); }
  async remove(userId: string, productId: string) { await WishlistModel.updateOne({ userId }, { $pull: { products: productId } }); }
}
export class MongoAddressRepository implements AddressRepository {
  async listByUser(userId: string) { return (await AddressModel.find({ userId }).sort('-isDefault -createdAt').lean()).map(d => fromMongo<Address>(d)); }
  countByUser(userId: string) { return AddressModel.countDocuments({ userId }); }
  async clearDefault(userId: string) { await AddressModel.updateMany({ userId }, { isDefault: false }); }
  async create(userId: string, a: NewAddress) { return fromMongo<Address>((await AddressModel.create({ ...a, userId })).toObject()); }
  async update(userId: string, id: string, patch: Partial<NewAddress>) { const k = oidOrNull(id); if (!k) return null; const d = await AddressModel.findOneAndUpdate({ _id: k, userId }, patch, { new: true }).lean(); return d ? fromMongo<Address>(d) : null; }
  async delete(userId: string, id: string) { const k = oidOrNull(id); return !!(k && (await AddressModel.findOneAndDelete({ _id: k, userId }))); }
}
const nfilter = (s: NotificationScope): any => (s.audience === 'Admin' ? { audience: 'Admin' } : { audience: 'User', userId: s.userId });
export class MongoNotificationRepository implements NotificationRepository {
  async create(n: NewNotification) { await NotificationModel.create(n); }
  async list(s: NotificationScope, req: PageRequest) { return (await NotificationModel.find(nfilter(s)).sort('-createdAt').skip(skipOf(req)).limit(req.limit).lean()).map(d => fromMongo<Notification>(d)); }
  countUnread(s: NotificationScope) { return NotificationModel.countDocuments({ ...nfilter(s), isRead: false }); }
  async markRead(s: NotificationScope, id: string) { const k = oidOrNull(id); if (!k) return null; const d = await NotificationModel.findOneAndUpdate({ _id: k, ...nfilter(s) }, { isRead: true }, { new: true }).lean(); return d ? fromMongo<Notification>(d) : null; }
  async markAll(s: NotificationScope) { await NotificationModel.updateMany(nfilter(s), { isRead: true }); }
  async recentForAdmins(limit: number) { return (await NotificationModel.find({ audience: 'Admin' }).sort('-createdAt').limit(limit).lean()).map(d => fromMongo<Notification>(d)); }
}
export class MongoNewsletterRepository implements NewsletterRepository {
  async subscribe(email: string) { await NewsletterModel.updateOne({ email }, { isActive: true }, { upsert: true }); }
  async list(req: PageRequest) {
    const [docs, total] = await Promise.all([NewsletterModel.find().sort('-createdAt').skip(skipOf(req)).limit(req.limit).lean(), NewsletterModel.countDocuments()]);
    return toPage(docs.map(d => fromMongo<any>(d)), total, req);
  }
}
export class MongoContactRepository extends MongoCrudRepository<ContactMessage, NewContactMessage> implements ContactRepository { constructor() { super(ContactModel, 'email'); } }
