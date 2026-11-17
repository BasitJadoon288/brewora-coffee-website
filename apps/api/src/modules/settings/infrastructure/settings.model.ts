import { Schema, model } from 'mongoose';
export const SettingsModel = model('StoreSettings', new Schema({
  key: { type: String, default: 'main', unique: true },
  storeName: { type: String, default: 'BREWORA' }, logo: String, contactEmail: String, phone: String, whatsapp: String, address: String,
  deliveryCharges: { type: Number, default: 200, min: 0 }, freeDeliveryThreshold: { type: Number, default: 3000, min: 0 },
  taxPercent: { type: Number, default: 0, min: 0, max: 100 }, currency: { type: String, default: 'PKR' }, lowStockThreshold: { type: Number, default: 10 },
  paymentMethods: { COD: { type: Boolean, default: true }, JazzCash: { type: Boolean, default: false }, EasyPaisa: { type: Boolean, default: false }, BankTransfer: { type: Boolean, default: true } },
  bank: { bankName: String, accountTitle: String, accountNumber: String, iban: String, instructions: String },
  social: { facebook: String, instagram: String, twitter: String, tiktok: String, youtube: String },
}, { timestamps: true }));
