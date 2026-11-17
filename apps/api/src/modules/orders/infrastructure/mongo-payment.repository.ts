import { fromMongo } from '../../../shared/infrastructure/mongo';
import { PaymentMethod } from '../../../shared/domain/types';
import { NewPayment, Payment, PaymentRepository } from '../domain/payment';
import { PaymentModel } from './order.models';
const map = (d: any) => { const p = fromMongo<any>(d); delete p.gatewayResponse; return p as Payment; }; // raw gateway payloads never leave the repository
export class MongoPaymentRepository implements PaymentRepository {
  async create(p: NewPayment) { return map((await PaymentModel.create(p)).toObject()); }
  async findByOrderId(orderId: string) { const d = await PaymentModel.findOne({ orderId }).lean(); return d ? map(d) : null; }
  async findByReference(method: PaymentMethod, reference: string) { const d = await PaymentModel.findOne({ transactionReference: reference, paymentMethod: method }).lean(); return d ? map(d) : null; }
  async updateByOrderId(orderId: string, patch: any) { await PaymentModel.updateOne({ orderId }, patch); }
  async deleteByOrderId(orderId: string) { await PaymentModel.deleteMany({ orderId }); }
}
