import { asyncHandler } from '../../../shared/presentation/http';
import { pageRequest } from '../../../shared/presentation/http';
import { PlaceOrder } from '../application/place-order';
import { CancelOwnOrder, GenerateReceipt, GetOrder, ListMyOrders, TrackOrder } from '../application/order.use-cases';
export class OrderController {
  constructor(private d: { place: PlaceOrder; mine: ListMyOrders; get: GetOrder; track: TrackOrder; cancel: CancelOwnOrder; receipt: GenerateReceipt }) {}
  place = asyncHandler(async (req, res) => { const r = await this.d.place.execute(req.user?.id, req.body); res.status(r.duplicate ? 200 : 201).json(r); });
  mine = asyncHandler(async (req, res) => { res.json(await this.d.mine.execute(req.user!.id, pageRequest(req.query))); });
  track = asyncHandler(async (req, res) => { res.json(await this.d.track.execute(req.params.orderNumber, String(req.query.email ?? ''))); });
  get = asyncHandler(async (req, res) => { res.json(await this.d.get.execute(req.params.id, req.user!)); });
  private sendPdf = (res: any, r: { filename: string; pdf: Buffer }, download: unknown) => { res.type('application/pdf').set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${r.filename}"`).set('Cache-Control', 'private, no-store').send(r.pdf); };
  receipt = asyncHandler(async (req, res) => { this.sendPdf(res, await this.d.receipt.forViewer(req.params.id, req.user!), req.query.download); });
  guestReceipt = asyncHandler(async (req, res) => { this.sendPdf(res, await this.d.receipt.forGuest(req.params.orderNumber, String(req.query.email ?? '')), req.query.download); });
  cancel = asyncHandler(async (req, res) => { res.json(await this.d.cancel.execute(req.params.id, req.user!.id)); });
}
