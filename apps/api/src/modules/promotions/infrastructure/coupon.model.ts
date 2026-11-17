import { Schema, model } from 'mongoose';
export const CouponModel = model('Coupon', new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }, description: String,
  discountType: { type: String, enum: ['Percentage', 'Fixed'], required: true }, discountValue: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number, default: null }, minimumOrderAmount: { type: Number, default: 0 }, expiryDate: { type: Date, default: null },
  usageLimit: { type: Number, default: null }, usedCount: { type: Number, default: 0, min: 0 }, isActive: { type: Boolean, default: true },
}, { timestamps: true }));
