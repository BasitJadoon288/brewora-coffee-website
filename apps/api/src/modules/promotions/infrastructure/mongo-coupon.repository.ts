import { toPage, skipOf, PageRequest } from '../../../shared/domain/pagination';
import { escapeRegex, fromMongo, guard, oidOrNull } from '../../../shared/infrastructure/mongo';
import { Coupon, CouponRepository, NewCoupon } from '../domain/coupon';
import { CouponModel } from './coupon.model';
const map = (d: any) => fromMongo<Coupon>(d);
export class MongoCouponRepository implements CouponRepository {
  async list(q: string | undefined, req: PageRequest) {
    const f: any = q ? { code: new RegExp(escapeRegex(q), 'i') } : {};
    const [docs, total] = await Promise.all([CouponModel.find(f).sort('-createdAt').skip(skipOf(req)).limit(req.limit).lean(), CouponModel.countDocuments(f)]);
    return toPage(docs.map(map), total, req);
  }
  async findById(id: string) { const k = oidOrNull(id); const d = k && (await CouponModel.findById(k).lean()); return d ? map(d) : null; }
  async findByCode(code: string) { const d = await CouponModel.findOne({ code }).lean(); return d ? map(d) : null; }
  async create(data: NewCoupon) { return map((await guard(CouponModel.create(data))).toObject()); }
  async update(id: string, patch: Partial<NewCoupon>) { const k = oidOrNull(id); if (!k) return null; const d = await guard(CouponModel.findByIdAndUpdate(k, patch, { new: true, runValidators: true }).lean()); return d ? map(d) : null; }
  async delete(id: string) { const k = oidOrNull(id); return !!(k && (await CouponModel.findByIdAndDelete(k))); }
  async tryIncrementUsage(id: string) {
    const r = await CouponModel.findOneAndUpdate({ _id: id, isActive: true, $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }, { $inc: { usedCount: 1 } });
    return !!r;
  }
  async decrementUsageByCode(code: string) { await CouponModel.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }); }
}
