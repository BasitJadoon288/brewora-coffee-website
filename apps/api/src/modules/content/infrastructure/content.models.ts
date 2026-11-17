import { Schema, model } from 'mongoose';
export const BannerModel = model('Banner', new Schema({
  title: { type: String, required: true }, subtitle: String, image: { type: String, required: true }, linkUrl: String, buttonText: String,
  placement: { type: String, enum: ['hero', 'promo'], default: 'hero' }, sortOrder: { type: Number, default: 0 }, isActive: { type: Boolean, default: true },
}, { timestamps: true }));
export const TestimonialModel = model('Testimonial', new Schema({
  name: { type: String, required: true }, text: { type: String, required: true }, rating: { type: Number, min: 1, max: 5, default: 5 }, avatar: String, isActive: { type: Boolean, default: true },
}, { timestamps: true }));
export const ContentModel = model('Content', new Schema({ key: { type: String, required: true, unique: true }, data: Schema.Types.Mixed }, { timestamps: true }));
