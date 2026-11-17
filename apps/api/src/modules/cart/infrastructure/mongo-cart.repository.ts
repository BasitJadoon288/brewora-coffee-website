import { fromMongo, oidOrNull } from '../../../shared/infrastructure/mongo';
import { Cart, CartRepository } from '../domain/cart';
import { CartModel } from './cart.model';
const map = (d: any): Cart => { const c = fromMongo<any>(d); return { userId: c.userId, items: c.items ?? [] }; };
export class MongoCartRepository implements CartRepository {
  async findByUser(userId: string) { const k = oidOrNull(userId); const d = k && (await CartModel.findOne({ userId: k }).lean()); return d ? map(d) : null; }
  async save(cart: Cart) {
    const items = cart.items.map(i => ({ ...(i.id ? { _id: i.id } : {}), productId: i.productId, variant: i.variant, quantity: i.quantity }));
    return map(await CartModel.findOneAndUpdate({ userId: cart.userId }, { items }, { upsert: true, new: true }).lean());
  }
  async delete(userId: string) { await CartModel.deleteOne({ userId }); }
}
