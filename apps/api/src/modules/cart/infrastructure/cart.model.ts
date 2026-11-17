import { Schema, model } from 'mongoose';
export const CartModel = model('Cart', new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, variant: String, quantity: { type: Number, min: 1, required: true } }],
}, { timestamps: true }));
