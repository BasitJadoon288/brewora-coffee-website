import { Schema, model } from 'mongoose';
const ref = (r: string, extra: object = {}) => ({ type: Schema.Types.ObjectId, ref: r, ...extra });
const reviewSchema = new Schema({
  productId: ref('Product', { required: true, index: true }), userId: ref('User', { required: true }), userName: String,
  rating: { type: Number, min: 1, max: 5, required: true }, comment: { type: String, maxlength: 2000 },
  isVerifiedPurchase: { type: Boolean, default: false }, isApproved: { type: Boolean, default: true },
}, { timestamps: true });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
export const ReviewModel = model('Review', reviewSchema);
export const WishlistModel = model('Wishlist', new Schema({ userId: ref('User', { required: true, unique: true }), products: [ref('Product')] }, { timestamps: true }));
export const AddressModel = model('Address', new Schema({
  userId: ref('User', { required: true, index: true }), label: { type: String, default: 'Home' }, fullName: { type: String, required: true }, phone: { type: String, required: true },
  line1: { type: String, required: true }, city: { type: String, required: true }, postalCode: String, isDefault: { type: Boolean, default: false },
}, { timestamps: true }));
export const NotificationModel = model('Notification', new Schema({
  audience: { type: String, enum: ['Admin', 'User'], required: true }, userId: ref('User', { index: true }), title: { type: String, required: true },
  message: String, type: String, link: String, isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } }));
export const NewsletterModel = model('NewsletterSubscriber', new Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true }, isActive: { type: Boolean, default: true } }, { timestamps: true }));
export const ContactModel = model('ContactMessage', new Schema({
  name: { type: String, required: true }, email: { type: String, required: true, lowercase: true }, phone: String, subject: String,
  message: { type: String, required: true }, isRead: { type: Boolean, default: false },
}, { timestamps: true }));
