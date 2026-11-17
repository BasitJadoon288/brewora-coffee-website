import { Schema, model } from 'mongoose';
const ref = (r: string, extra: object = {}) => ({ type: Schema.Types.ObjectId, ref: r, ...extra });
export const CategoryModel = model('Category', new Schema({
  name: { type: String, required: true, unique: true, trim: true }, slug: { type: String, required: true, unique: true },
  description: String, image: String, isActive: { type: Boolean, default: true },
}, { timestamps: true }));
const productSchema = new Schema({
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true },
  description: { type: String, required: true }, shortDescription: String,
  price: { type: Number, required: true, min: 0 }, discountPrice: { type: Number, min: 0 },
  categoryId: ref('Category', { required: true, index: true }),
  images: [{ url: String, alt: String }],
  variants: [{ name: String, size: String, priceDelta: { type: Number, default: 0 } }],
  specifications: { type: Schema.Types.Mixed },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true, unique: true },
  salesCount: { type: Number, default: 0 }, ratingAverage: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }, isBestSeller: { type: Boolean, default: false }, isActive: { type: Boolean, default: true },
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1, categoryId: 1, price: 1 });
export const ProductModel = model('Product', productSchema);
export const InventoryTransactionModel = model('InventoryTransaction', new Schema({
  productId: ref('Product', { required: true, index: true }),
  type: { type: String, enum: ['Initial', 'Sale', 'Cancellation', 'Restock', 'Adjustment'], required: true },
  change: { type: Number, required: true }, balanceAfter: { type: Number, required: true }, reason: String, orderId: ref('Order'), by: ref('User'),
}, { timestamps: { createdAt: true, updatedAt: false } }));
