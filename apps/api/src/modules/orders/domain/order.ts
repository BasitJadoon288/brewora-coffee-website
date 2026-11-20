import { Page, PageRequest } from '../../../shared/domain/pagination';
import { PaymentMethod, Viewer } from '../../../shared/domain/types';
export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
export interface OrderItem { productId: string; name: string; sku: string; variant?: string; image?: string; unitPrice: number; quantity: number; lineTotal: number }
export interface StatusEntry { status: OrderStatus; at: Date; by?: string; note?: string }
export interface Order {
  id: string; orderNumber: string; idempotencyKey?: string; userId?: string;
  customerDetails: { fullName: string; email: string; phone: string; notes?: string };
  items: OrderItem[]; subTotal: number; deliveryCharges: number; discount: number; tax: number; totalAmount: number; couponCode?: string;
  paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; orderStatus: OrderStatus;
  shippingAddress: { line1: string; city: string; area?: string; postalCode?: string };
  refund: { status: 'None' | 'Requested' | 'Refunded'; amount?: number; note?: string; at?: Date };
  statusHistory: StatusEntry[]; createdAt: Date; updatedAt: Date;
}
export type NewOrder = Omit<Order, 'id' | 'paymentStatus' | 'orderStatus' | 'refund' | 'createdAt' | 'updatedAt'>;
export interface OrderRepository {
  create(o: NewOrder): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  findByNumberAndEmail(orderNumber: string, email: string): Promise<Order | null>;
  listByUser(userId: string, req: PageRequest): Promise<Page<Order>>;
  /** Compare-and-set: succeeds only if the order is still in `from` (guards concurrent admins). */
  transitionStatus(id: string, from: OrderStatus, to: OrderStatus, entry: StatusEntry): Promise<boolean>;
  setPaymentStatus(id: string, status: PaymentStatus, entry?: StatusEntry): Promise<void>;
  requestRefund(id: string, amount: number): Promise<void>;
  recordRefund(id: string, amount: number, note: string | undefined, entry: StatusEntry): Promise<void>;
  delete(id: string): Promise<void>;
  hasDeliveredPurchase(userId: string, productId: string): Promise<boolean>;
}
export interface OrderNumberGenerator { next(): string }
export const canAccessOrder = (o: Order, viewer?: Viewer, email?: string) =>
  !!((viewer && (viewer.role === 'Admin' || o.userId === viewer.id)) || (email && o.customerDetails.email === email.toLowerCase()));
const next: Record<OrderStatus, OrderStatus[]> = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Processing', 'Cancelled'], Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered'], Delivered: [], Cancelled: [] };
export const canTransition = (from: OrderStatus, to: OrderStatus) => next[from]?.includes(to) ?? false;
