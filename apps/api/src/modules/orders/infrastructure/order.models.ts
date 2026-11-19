import { Schema, model } from 'mongoose';
const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  idempotencyKey: { type: String, index: { unique: true, sparse: true } },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  customerDetails: { fullName: String, email: String, phone: String, notes: String },
  items: [{ _id: false, productId: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, sku: String, variant: String, image: String, unitPrice: Number, quantity: { type: Number, min: 1 }, lineTotal: Number }],
  subTotal: Number, deliveryCharges: Number, discount: { type: Number, default: 0 }, tax: { type: Number, default: 0 }, totalAmount: Number, couponCode: String,
  paymentMethod: { type: String, enum: ['COD', 'JazzCash', 'EasyPaisa', 'BankTransfer'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
  orderStatus: { type: String, enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  shippingAddress: { line1: String, city: String, postalCode: String },
  refund: { status: { type: String, enum: ['None', 'Requested', 'Refunded'], default: 'None' }, amount: Number, note: String, at: Date },
  statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now }, by: Schema.Types.ObjectId, note: String }],
}, { timestamps: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'customerDetails.email': 1 });
orderSchema.index({ createdAt: -1 }); // recent orders, sales series, reports
orderSchema.index({ paymentStatus: 1, createdAt: -1 }); // paid revenue + payment filters
orderSchema.index({ userId: 1, orderStatus: 1, 'items.productId': 1 }); // "verified purchase" check
export const OrderModel = model('Order', orderSchema);
export const PaymentModel = model('Payment', new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['COD', 'JazzCash', 'EasyPaisa', 'BankTransfer'], required: true },
  transactionReference: { type: String, index: true }, senderName: String,
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
  gatewayResponse: Schema.Types.Mixed, verifiedAt: Date,
}, { timestamps: true }));
