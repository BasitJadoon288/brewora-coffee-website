import { Router } from 'express';
import { asyncHandler, validate } from '../../../shared/presentation/http';
import { crudRouter } from '../../../shared/presentation/crud.router';
import { couponBaseDto, couponUpdateDto, validateCouponDto } from '../application/coupon.dto';
import { ManageCoupons, ValidateCoupon } from '../application/coupon.use-cases';
export function buildCouponPublicRoutes(v: ValidateCoupon) {
  const r = Router();
  r.post('/validate', validate(validateCouponDto), asyncHandler(async (req, res) => { res.json(await v.execute(req.body.code, req.body.subTotal)); }));
  return r;
}
export const buildCouponAdminRoutes = (m: ManageCoupons) => crudRouter(m, couponBaseDto, couponUpdateDto);
