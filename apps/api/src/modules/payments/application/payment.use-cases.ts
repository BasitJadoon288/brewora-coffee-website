import { AppConfig } from '../../../shared/application/ports';
import { BadRequestError, ConflictError, NotFoundError, ServiceUnavailableError } from '../../../shared/domain/errors';
import { Viewer } from '../../../shared/domain/types';
import { canAccessOrder, Order, OrderRepository } from '../../orders/domain/order';
import { PaymentRepository } from '../../orders/domain/payment';
import { SettingsRepository } from '../../settings/domain/settings';
import { GatewayRegistry } from './payment-gateway';

export interface OrderAccess { viewer?: Viewer; email?: string }
async function loadAccessible(orders: OrderRepository, orderId: string, a: OrderAccess): Promise<Order> {
  const o = await orders.findById(orderId); if (!o || !canAccessOrder(o, a.viewer, a.email)) throw new NotFoundError('Order not found'); return o;
}
export class InitiatePayment {
  constructor(private orders: OrderRepository, private payments: PaymentRepository, private settings: SettingsRepository, private gateways: GatewayRegistry, private config: AppConfig) {}
  async execute(orderId: string, access: OrderAccess) {
    const o = await loadAccessible(this.orders, orderId, access);
    if (o.paymentStatus === 'Paid') throw new ConflictError('Order already paid');
    if (o.orderStatus === 'Cancelled') throw new ConflictError('Order is cancelled');
    if (o.paymentMethod === 'COD') return { method: 'COD' as const, message: 'Pay cash on delivery' };
    if (o.paymentMethod === 'BankTransfer') return { method: 'BankTransfer' as const, bank: (await this.settings.get()).bank, reference: o.orderNumber, message: 'Transfer the amount, then submit your transaction reference.' };
    const g = this.gateways[o.paymentMethod];
    if (!g.isConfigured()) throw new ServiceUnavailableError(`${o.paymentMethod} is not configured on this server. Order remains pending.`);
    const reference = `T${Date.now()}`;
    await this.payments.updateByOrderId(o.id, { transactionReference: reference });
    return { method: o.paymentMethod, ...g.createRequest({ orderNumber: o.orderNumber, amountPkr: o.totalAmount, reference, returnUrl: `${this.config.apiUrl}/api/payments/${g.callbackPath}/callback` }) };
  }
}
export class SubmitBankReference {
  constructor(private orders: OrderRepository, private payments: PaymentRepository) {}
  async execute(orderId: string, access: OrderAccess, reference: string, senderName?: string) {
    const o = await loadAccessible(this.orders, orderId, access);
    if (o.paymentMethod !== 'BankTransfer') throw new BadRequestError('Order is not a bank transfer order');
    if (o.paymentStatus === 'Paid') throw new ConflictError('Order already paid');
    await this.payments.updateByOrderId(o.id, { transactionReference: reference, senderName });
    return { message: 'Reference received. Payment stays pending until our team verifies the transfer.', paymentStatus: 'Pending' as const };
  }
}
/** Marks paid ONLY for an authentic callback with matching reference and amount. Idempotent. */
export class HandleGatewayCallback {
  constructor(private orders: OrderRepository, private payments: PaymentRepository, private gateways: GatewayRegistry) {}
  async execute(method: 'JazzCash' | 'EasyPaisa', params: Record<string, string>): Promise<{ paid: boolean; orderId?: string }> {
    const g = this.gateways[method];
    if (!g.isConfigured()) throw new ServiceUnavailableError('Not configured');
    const r = g.parseCallback(params);
    if (!r.authentic || !r.reference) return { paid: false };
    const p = await this.payments.findByReference(method, r.reference);
    if (!p) return { paid: false };
    if (p.paymentStatus === 'Paid') return { paid: true, orderId: p.orderId };
    const amountOk = r.amountPkr !== undefined && Math.abs(r.amountPkr - p.amount) < 0.01;
    if (r.success && amountOk) {
      await this.payments.updateByOrderId(p.orderId, { paymentStatus: 'Paid', verifiedAt: new Date(), gatewayResponse: r.raw });
      await this.orders.transitionStatus(p.orderId, 'Pending', 'Confirmed', { status: 'Confirmed', note: `${method} payment verified`, at: new Date() });
      await this.orders.setPaymentStatus(p.orderId, 'Paid');
      return { paid: true, orderId: p.orderId };
    }
    await this.payments.updateByOrderId(p.orderId, { paymentStatus: r.success && !amountOk ? 'Pending' : 'Failed', gatewayResponse: r.raw });
    return { paid: false, orderId: p.orderId };
  }
}
