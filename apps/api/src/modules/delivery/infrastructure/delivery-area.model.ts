import { Schema, model } from 'mongoose';
const schema = new Schema({
  name: { type: String, required: true, trim: true }, city: { type: String, default: 'Karachi', trim: true }, charge: { type: Number, required: true, min: 0 },
  freeDeliveryThreshold: { type: Number, default: null, min: 0 }, isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
schema.index({ isActive: 1, sortOrder: 1, name: 1 });
schema.index({ city: 1, name: 1 }, { unique: true });
export const DeliveryAreaModel = model('DeliveryArea', schema);
