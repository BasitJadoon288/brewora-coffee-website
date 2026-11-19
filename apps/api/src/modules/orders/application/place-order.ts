import { Mailer, Notifier } from '../../../shared/application/ports';
import { BadRequestError, ConflictError } from '../../../shared/domain/errors';
import { orderConfirmationMail } from '../../../shared/application/email-templates';
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
    const settings = await d.settings.get(); // cached; the quote below reuses the same cached copy
    if (!settings.paymentMethods[i.paymentMethod]) throw new BadRequestError(`${i.paymentMethod} is not available`);
    const q = await d.quote.execute(i.items, i.couponCode);

    const reserved: { productId: string; qty: number; balance: number }[] = [];
    let couponId: string | null = null; let orderId: string | null = null;
    try {
      // Reserve every line concurrently (each reservation is its own atomic conditional update).
      // allSettled (not all) so that on a failure we still know exactly which lines succeeded and must be released.
      const results = await Promise.allSettled(q.lines.map(l => d.products.reserveStock(l.productId, l.quantity)));
      let failure: unknown;
      results.forEach((r, n) => {
        const l = q.lines[n];
        if (r.status === 'fulfilled' && r.value !== null) reserved.push({ productId: l.productId, qty: l.quantity, balance: r.value });
        else failure ??= r.status === 'rejected' ? r.reason : new ConflictError(`Insufficient stock for ${l.name}`);
      });
      if (failure) throw failure;
      if (q.coupon) { if (!(await d.coupons.tryIncrementUsage(q.coupon.id))) throw new ConflictError('Coupon usage limit reached'); couponId = q.coupon.id; }
      const order = await d.orders.create({
        orderNumber: d.numbers.next(), idempotencyKey: i.idempotencyKey, userId,
        customerDetails: { ...i.customer, email: i.customer.email.toLowerCase() }, items: q.lines, subTotal: q.subTotal, deliveryCharges: q.deliveryCharges,
        discount: q.discount, tax: q.tax, totalAmount: q.totalAmount, couponCode: q.coupon?.code, paymentMethod: i.paymentMethod, shippingAddress: i.shippingAddress,
        statusHistory: [{ status: 'Pending', at: new Date(), by: userId, note: 'Order placed' }],
      });
      orderId = order.id;
      // independent writes: run together, but wait for ALL to settle so compensation below can never race a late write
      const writes = await Promise.allSettled([
        d.payments.create({ orderId: order.id, amount: order.totalAmount, paymentMethod: order.paymentMethod }),
        d.ledger.recordMany(reserved.map(r => ({ productId: r.productId, type: 'Sale' as const, change: -r.qty, balanceAfter: r.balance, orderId: order.id, reason: `Sale: ${order.orderNumber}` }))),
        userId ? d.carts.delete(userId) : undefined,
      ]);
      const bad = writes.find((w): w is PromiseRejectedResult => w.status === 'rejected'); if (bad) throw bad.reason;
      void d.notifier.toAdmins({ title: 'New order', message: `${order.orderNumber} — Rs. ${order.totalAmount}`, type: 'order', link: `/admin/orders/${order.id}` });
      { const mail = orderConfirmationMail(order); void d.mailer.send(order.customerDetails.email, mail.subject, mail.html); }
      return { order, duplicate: false };
    } catch (e) {
      await Promise.allSettled([
        ...reserved.map(r => d.products.releaseStock(r.productId, r.qty)),
        couponId && q.coupon ? d.coupons.decrementUsageByCode(q.coupon.code) : undefined,
        ...(orderId ? [d.orders.delete(orderId), d.payments.deleteByOrderId(orderId), d.ledger.deleteByOrder(orderId)] : []),
      ]);
      if (e instanceof ConflictError && i.idempotencyKey) { const ex = await d.orders.findByIdempotencyKey(i.idempotencyKey); if (ex) return { order: ex, duplicate: true }; } // concurrent duplicate submit
      throw e;
    }
  }
}
