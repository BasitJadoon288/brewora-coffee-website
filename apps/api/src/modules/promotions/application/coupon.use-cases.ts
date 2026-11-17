import { BadRequestError, NotFoundError } from '../../../shared/domain/errors';
import { PageRequest } from '../../../shared/domain/pagination';
import { assertCouponDefinition, couponDiscount, couponError, CouponRepository, NewCoupon } from '../domain/coupon';
export class ManageCoupons {
  constructor(private repo: CouponRepository) {}
  list(q: string | undefined, req: PageRequest) { return this.repo.list(q, req); }
  async get(id: string) { const c = await this.repo.findById(id); if (!c) throw new NotFoundError('Coupon not found'); return c; }
  create(d: NewCoupon) { assertCouponDefinition(d); return this.repo.create(d); }
  async update(id: string, patch: Partial<NewCoupon>) {
    const cur = await this.get(id); assertCouponDefinition({ ...cur, ...patch });
    const u = await this.repo.update(id, patch); if (!u) throw new NotFoundError('Coupon not found'); return u;
  }
  async remove(id: string) { if (!(await this.repo.delete(id))) throw new NotFoundError('Coupon not found'); }
}
export class ValidateCoupon {
  constructor(private repo: CouponRepository) {}
  async execute(code: string, subTotal: number) {
    const c = await this.repo.findByCode(code.trim().toUpperCase());
    const err = c ? couponError(c, subTotal) : 'Invalid coupon code';
    if (err || !c) throw new BadRequestError(err ?? 'Invalid coupon code');
    return { code: c.code, discount: couponDiscount(c, subTotal), description: c.description };
  }
}
