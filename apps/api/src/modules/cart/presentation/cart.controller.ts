import { asyncHandler } from '../../../shared/presentation/http';
import { QuoteService } from '../../pricing/application/quote.service';
import { AddCartItem, GetCart, MergeGuestCart, RemoveCartItem, UpdateCartItem } from '../application/cart.use-cases';
export class CartController {
  constructor(private d: { quote: QuoteService; get: GetCart; add: AddCartItem; update: UpdateCartItem; remove: RemoveCartItem; merge: MergeGuestCart }) {}
  quote = asyncHandler(async (req, res) => { const q = await this.d.quote.execute(req.body.items, req.body.couponCode); res.json({ ...q, coupon: q.coupon?.code ?? null }); });
  get = asyncHandler(async (req, res) => { res.json(await this.d.get.execute(req.user!.id)); });
  add = asyncHandler(async (req, res) => { res.status(201).json(await this.d.add.execute(req.user!.id, req.body)); });
  merge = asyncHandler(async (req, res) => { res.json(await this.d.merge.execute(req.user!.id, req.body.items)); });
  update = asyncHandler(async (req, res) => { res.json(await this.d.update.execute(req.user!.id, req.params.id, req.body.quantity)); });
  remove = asyncHandler(async (req, res) => { res.json(await this.d.remove.execute(req.user!.id, req.params.id)); });
}
