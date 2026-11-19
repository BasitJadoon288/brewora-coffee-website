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
// The unused text index was removed (search uses regex, never $text): it slowed every product write and bloated storage.
productSchema.index({ isActive: 1, categoryId: 1, price: 1 }); // category pages + price sort/filter + related products
productSchema.index({ isActive: 1, createdAt: -1 }); // storefront "newest"
productSchema.index({ isActive: 1, salesCount: -1 }); // storefront "popular"
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 }); // featured rail
productSchema.index({ isActive: 1, isBestSeller: 1, salesCount: -1 }); // best-seller rail
productSchema.index({ stockQuantity: 1 }); // inventory list + low-stock alerts
export const ProductModel = model('Product', productSchema);
const inventorySchema = new Schema({
  productId: ref('Product', { required: true }),
  type: { type: String, enum: ['Initial', 'Sale', 'Cancellation', 'Restock', 'Adjustment'], required: true },
  change: { type: Number, required: true }, balanceAfter: { type: Number, required: true }, reason: String, orderId: ref('Order', { index: true }), by: ref('User'), // orderId index: compensation deletes (deleteByOrder) were full scans
}, { timestamps: { createdAt: true, updatedAt: false } });
inventorySchema.index({ productId: 1, createdAt: -1 });
inventorySchema.index({ createdAt: -1 });
export const InventoryTransactionModel = model('InventoryTransaction', inventorySchema);
