import { orderStatusMail } from '../../../shared/application/email-templates';
import { Mailer, Notifier } from '../../../shared/application/ports';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../../shared/domain/errors';
import { PageRequest } from '../../../shared/domain/pagination';
import { Viewer } from '../../../shared/domain/types';
import { InventoryLedger } from '../../catalog/domain/inventory';
import { ProductRepository } from '../../catalog/domain/product';
import { UserRepository } from '../../identity/domain/user';
import { CouponRepository } from '../../promotions/domain/coupon';
import { canAccessOrder, canTransition, Order, OrderRepository, OrderStatus } from '../domain/order';
import { PaymentRepository } from '../domain/payment';

export class ListMyOrders { constructor(private orders: OrderRepository) {} execute(userId: string, req: PageRequest) { return this.orders.listByUser(userId, req); } }
export class GetOrder {
  constructor(private orders: OrderRepository, private payments: PaymentRepository) {}
  async execute(id: string, viewer: Viewer) {
    const [o, payment] = await Promise.all([this.orders.findById(id), this.payments.findByOrderId(id)]);
    if (!o || !canAccessOrder(o, viewer)) throw new NotFoundError('Order not found');
    return { ...o, payment };
  }
}
export class GetOrderDetailForAdmin {
  constructor(private orders: OrderRepository, private payments: PaymentRepository, private users: UserRepository) {}
  async execute(id: string) {
    const [o, payment] = await Promise.all([this.orders.findById(id), this.payments.findByOrderId(id)]);
    if (!o) throw new NotFoundError('Order not found');
    return { ...o, user: o.userId ? await this.users.findById(o.userId) : null, payment };
  }
}
/** Public tracking needs BOTH the order number and the checkout e-mail. */
export class TrackOrder {
  constructor(private orders: OrderRepository) {}
  async execute(orderNumber: string, email: string) {
    const o = email ? await this.orders.findByNumberAndEmail(orderNumber, email.toLowerCase()) : null; if (!o) throw new NotFoundError('Order not found');
    return { orderNumber: o.orderNumber, orderStatus: o.orderStatus, paymentStatus: o.paymentStatus, paymentMethod: o.paymentMethod, totalAmount: o.totalAmount, createdAt: o.createdAt, history: o.statusHistory.map(h => ({ status: h.status, at: h.at })) };
  }
}
export interface OrderLifecycleDeps { orders: OrderRepository; payments: PaymentRepository; products: ProductRepository; coupons: CouponRepository; ledger: InventoryLedger; notifier: Notifier; mailer: Mailer }

export class UpdateOrderStatus {
  constructor(private d: OrderLifecycleDeps) {}
  async execute(orderId: string, to: OrderStatus, by: string, note?: string): Promise<Order> {
    const d = this.d; const order = await d.orders.findById(orderId); if (!order) throw new NotFoundError('Order not found');
    if (!canTransition(order.orderStatus, to)) throw new ConflictError(`Cannot move order from ${order.orderStatus} to ${to}`);
    if (!(await d.orders.transitionStatus(orderId, order.orderStatus, to, { status: to, by, note, at: new Date() }))) throw new ConflictError('Order was updated by someone else; reload and retry');
    if (to === 'Cancelled') {
      // release all stock lines concurrently, then write ONE bulk ledger insert (was 2 sequential awaits per line)
      const balances = await Promise.all(order.items.map(i => d.products.releaseStock(i.productId, i.quantity)));
      const entries = order.items.flatMap((i, n) => (balances[n] === null ? [] : [{ productId: i.productId, type: 'Cancellation' as const, change: i.quantity, balanceAfter: balances[n] as number, orderId, reason: `Cancelled: ${order.orderNumber}`, by }]));
      await Promise.all([
        d.ledger.recordMany(entries),
        order.couponCode ? d.coupons.decrementUsageByCode(order.couponCode) : undefined,
        order.paymentStatus === 'Paid' ? d.orders.requestRefund(orderId, order.totalAmount) : d.orders.setPaymentStatus(orderId, 'Failed'),
      ]);
    }
    if (to === 'Delivered' && order.paymentMethod === 'COD') { await Promise.all([d.orders.setPaymentStatus(orderId, 'Paid'), d.payments.updateByOrderId(orderId, { paymentStatus: 'Paid', verifiedAt: new Date() })]); }
    if (order.userId) void d.notifier.toUser(order.userId, { title: `Order ${to}`, message: order.orderNumber, type: 'order', link: `/account/orders/${orderId}` });
    { const mail = orderStatusMail(order, to); void d.mailer.send(order.customerDetails.email, mail.subject, mail.html); }
    return (await d.orders.findById(orderId))!;
  }
}
export class CancelOwnOrder {
  constructor(private orders: OrderRepository, private update: UpdateOrderStatus) {}
  async execute(orderId: string, userId: string) {
    const o = await this.orders.findById(orderId); if (!o || o.userId !== userId) throw new NotFoundError('Order not found');
    if (o.orderStatus !== 'Pending') throw new ConflictError('Only pending orders can be cancelled. Please contact support.');
    return this.update.execute(orderId, 'Cancelled', userId, 'Cancelled by customer');
  }
}
export class MarkPaymentStatus {
  constructor(private orders: OrderRepository, private payments: PaymentRepository) {}
  async execute(orderId: string, status: 'Paid' | 'Failed', by: string, reference?: string) {
    const o = await this.orders.findById(orderId); if (!o) throw new NotFoundError('Order not found');
    if (o.paymentMethod === 'JazzCash' || o.paymentMethod === 'EasyPaisa') throw new ForbiddenError('Online gateway payments can only be confirmed by the provider callback');
    await Promise.all([
      this.orders.setPaymentStatus(orderId, status, { status: o.orderStatus, by, note: `Payment marked ${status}`, at: new Date() }),
      this.payments.updateByOrderId(orderId, { paymentStatus: status, verifiedAt: new Date(), ...(reference && { transactionReference: reference }) }),
    ]);
    return (await this.orders.findById(orderId))!;
  }
}
/** Records a refund in BREWORA. It does not call the payment provider. */
export class RefundOrder {
  constructor(private orders: OrderRepository, private payments: PaymentRepository) {}
  async execute(orderId: string, by: string, amount?: number, note?: string) {
    const o = await this.orders.findById(orderId); if (!o) throw new NotFoundError('Order not found');
    if (o.paymentStatus !== 'Paid') throw new ConflictError('Only paid orders can be refunded');
    const amt = amount ?? o.totalAmount; if (amt <= 0 || amt > o.totalAmount) throw new BadRequestError('Invalid refund amount');
    await Promise.all([
      this.orders.recordRefund(orderId, amt, note, { status: o.orderStatus, by, note: `Refund Rs. ${amt} recorded`, at: new Date() }),
      this.payments.updateByOrderId(orderId, { paymentStatus: 'Refunded' }),
    ]);
    return (await this.orders.findById(orderId))!;
  }
}
