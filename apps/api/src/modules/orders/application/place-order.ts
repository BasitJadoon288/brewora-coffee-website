import { Mailer, Notifier } from '../../../shared/application/ports';
import { BadRequestError, ConflictError } from '../../../shared/domain/errors';
import { escapeHtml } from '../../../shared/domain/text';
import { CartRepository } from '../../cart/domain/cart';
import { InventoryLedger } from '../../catalog/domain/inventory';
import { ProductRepository } from '../../catalog/domain/product';
import { CouponRepository } from '../../promotions/domain/coupon';
import { QuoteService } from '../../pricing/application/quote.service';
import { SettingsRepository } from '../../settings/domain/settings';
import { Order, OrderNumberGenerator, OrderRepository } from '../domain/order';
import { PaymentRepository } from '../domain/payment';
import { PlaceOrderInput } from './order.dto';

export interface PlaceOrderDeps { quote: QuoteService; products: ProductRepository; coupons: CouponRepository; orders: OrderRepository; payments: PaymentRepository; ledger: InventoryLedger; carts: CartRepository; settings: SettingsRepository; numbers: OrderNumberGenerator; notifier: Notifier; mailer: Mailer }

/** Reserves stock atomically, consumes the coupon, persists order+payment+ledger; compensates everything on failure. */
export class PlaceOrder {
  constructor(private d: PlaceOrderDeps) {}
  async execute(userId: string | undefined, i: PlaceOrderInput): Promise<{ order: Order; duplicate: boolean }> {
    const d = this.d;
    if (i.idempotencyKey) { const ex = await d.orders.findByIdempotencyKey(i.idempotencyKey); if (ex) return { order: ex, duplicate: true }; }
    const settings = await d.settings.get();
    if (!settings.paymentMethods[i.paymentMethod]) throw new BadRequestError(`${i.paymentMethod} is not available`);
    const q = await d.quote.execute(i.items, i.couponCode);

    const reserved: { productId: string; qty: number; balance: number }[] = [];
    let couponId: string | null = null; let orderId: string | null = null;
    try {
      for (const l of q.lines) {
        const balance = await d.products.reserveStock(l.productId, l.quantity);
        if (balance === null) throw new ConflictError(`Insufficient stock for ${l.name}`);
        reserved.push({ productId: l.productId, qty: l.quantity, balance });
      }
      if (q.coupon) { if (!(await d.coupons.tryIncrementUsage(q.coupon.id))) throw new ConflictError('Coupon usage limit reached'); couponId = q.coupon.id; }
      const order = await d.orders.create({
        orderNumber: d.numbers.next(), idempotencyKey: i.idempotencyKey, userId,
        customerDetails: { ...i.customer, email: i.customer.email.toLowerCase() }, items: q.lines, subTotal: q.subTotal, deliveryCharges: q.deliveryCharges,
        discount: q.discount, tax: q.tax, totalAmount: q.totalAmount, couponCode: q.coupon?.code, paymentMethod: i.paymentMethod, shippingAddress: i.shippingAddress,
        statusHistory: [{ status: 'Pending', at: new Date(), by: userId, note: 'Order placed' }],
      });
      orderId = order.id;
      await d.payments.create({ orderId: order.id, amount: order.totalAmount, paymentMethod: order.paymentMethod });
      await d.ledger.recordMany(reserved.map(r => ({ productId: r.productId, type: 'Sale' as const, change: -r.qty, balanceAfter: r.balance, orderId: order.id, reason: `Sale: ${order.orderNumber}` })));
      if (userId) await d.carts.delete(userId);
      void d.notifier.toAdmins({ title: 'New order', message: `${order.orderNumber} — Rs. ${order.totalAmount}`, type: 'order', link: `/admin/orders/${order.id}` });
      void d.mailer.send(order.customerDetails.email, `BREWORA order ${order.orderNumber}`, `<p>Thank you ${escapeHtml(order.customerDetails.fullName)}! Your order <b>${escapeHtml(order.orderNumber)}</b> totals Rs. ${order.totalAmount}.</p>`);
      return { order, duplicate: false };
    } catch (e) {
      for (const r of reserved) await d.products.releaseStock(r.productId, r.qty);
      if (couponId && q.coupon) await d.coupons.decrementUsageByCode(q.coupon.code);
      if (orderId) { await d.orders.delete(orderId); await d.payments.deleteByOrderId(orderId); await d.ledger.deleteByOrder(orderId); }
      if (e instanceof ConflictError && i.idempotencyKey) { const ex = await d.orders.findByIdempotencyKey(i.idempotencyKey); if (ex) return { order: ex, duplicate: true }; } // concurrent duplicate submit
      throw e;
    }
  }
}
