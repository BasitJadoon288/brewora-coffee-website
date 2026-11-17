import { skipOf, toPage, PageRequest } from '../../../shared/domain/pagination';
import { fromMongo, oidOrNull } from '../../../shared/infrastructure/mongo';
import { InventoryEntry, InventoryLedger, NewInventoryEntry } from '../domain/inventory';
import { InventoryTransactionModel } from './catalog.models';
function toEntry(d: any): InventoryEntry {
  const { productId, ...rest } = d; const populated = productId && typeof productId === 'object' && productId.name;
  const e = fromMongo<any>({ ...rest, productId: populated ? productId._id : productId }); if (populated) e.product = fromMongo(productId); return e;
}
export class MongoInventoryLedger implements InventoryLedger {
  async record(e: NewInventoryEntry) { await InventoryTransactionModel.create(e); }
  async recordMany(e: NewInventoryEntry[]) { if (e.length) await InventoryTransactionModel.insertMany(e); }
  async history(productId: string | undefined, req: PageRequest) {
    const f: any = {}; if (productId && oidOrNull(productId)) f.productId = productId;
    const [docs, total] = await Promise.all([InventoryTransactionModel.find(f).sort('-createdAt').skip(skipOf(req)).limit(req.limit).populate('productId', 'name sku').lean(), InventoryTransactionModel.countDocuments(f)]);
    return toPage(docs.map(toEntry), total, req);
  }
  async deleteByOrder(orderId: string) { await InventoryTransactionModel.deleteMany({ orderId }); }
}
