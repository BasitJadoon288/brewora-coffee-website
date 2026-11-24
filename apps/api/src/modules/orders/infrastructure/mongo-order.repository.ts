import { PageRequest, skipOf, toPage } from '../../../shared/domain/pagination';
import { fromMongo, guard, oidOrNull } from '../../../shared/infrastructure/mongo';
import { NewOrder, Order, OrderNumberGenerator, OrderRepository, OrderStatus, PaymentStatus, StatusEntry } from '../domain/order';
import { CounterModel, OrderModel } from './order.models';
const map = (d: any) => fromMongo<Order>(d);
export class MongoOrderRepository implements OrderRepository {
  async create(o: NewOrder) { return map((await guard(OrderModel.create(o))).toObject()); }
  async findById(id: string) { const k = oidOrNull(id); const d = k && (await OrderModel.findById(k).lean()); return d ? map(d) : null; }
  async findByIdempotencyKey(key: string) { const d = await OrderModel.findOne({ idempotencyKey: key }).lean(); return d ? map(d) : null; }
  async findByNumberAndEmail(orderNumber: string, email: string) { const d = await OrderModel.findOne({ orderNumber, 'customerDetails.email': email }).lean(); return d ? map(d) : null; }
  async listByUser(userId: string, req: PageRequest) {
    const f = { userId };
    const [docs, total] = await Promise.all([OrderModel.find(f).sort('-createdAt').skip(skipOf(req)).limit(req.limit).lean(), OrderModel.countDocuments(f)]);
    return toPage(docs.map(map), total, req);
  }
  async transitionStatus(id: string, from: OrderStatus, to: OrderStatus, entry: StatusEntry) {
    const r = await OrderModel.updateOne({ _id: id, orderStatus: from }, { orderStatus: to, $push: { statusHistory: entry } }); return r.modifiedCount > 0;
  }
  async setPaymentStatus(id: string, status: PaymentStatus, entry?: StatusEntry) { await OrderModel.updateOne({ _id: id }, { paymentStatus: status, ...(entry && { $push: { statusHistory: entry } }) }); }
  async requestRefund(id: string, amount: number) { await OrderModel.updateOne({ _id: id }, { 'refund.status': 'Requested', 'refund.amount': amount }); }
  async recordRefund(id: string, amount: number, note: string | undefined, entry: StatusEntry) {
    await OrderModel.updateOne({ _id: id }, { paymentStatus: 'Refunded', refund: { status: 'Refunded', amount, note, at: new Date() }, $push: { statusHistory: entry } });
  }
  async delete(id: string) { await OrderModel.deleteOne({ _id: id }); }
  async hasDeliveredPurchase(userId: string, productId: string) { return !!(await OrderModel.exists({ userId, orderStatus: 'Delivered', 'items.productId': productId })); }
}
/**
 * Sequential, human-friendly order numbers: BRW-1001, BRW-1002, ... The counter is one atomic $inc in MongoDB, so concurrent
 * checkouts (and several serverless instances) can never get the same number. A failed checkout leaves a gap, never a duplicate.
 */
export class SequentialOrderNumberGenerator implements OrderNumberGenerator {
  async next() { const c = await CounterModel.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { upsert: true, new: true }).lean() as { seq: number }; return `BRW-${1000 + c.seq}`; }
}
