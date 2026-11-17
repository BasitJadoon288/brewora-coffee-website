import { Request } from 'express';
import { asyncHandler } from '../../../shared/presentation/http';
import { HandleGatewayCallback, InitiatePayment, SubmitBankReference } from '../application/payment.use-cases';
export class PaymentController {
  constructor(private d: { initiate: InitiatePayment; bank: SubmitBankReference; callback: HandleGatewayCallback }, private customerUrl: string) {}
  private access = (req: Request) => ({ viewer: req.user, email: String(req.query.email ?? req.body?.email ?? '').toLowerCase() || undefined });
  initiate = asyncHandler(async (req, res) => { res.json(await this.d.initiate.execute(req.params.orderId, this.access(req))); });
  bankReference = asyncHandler(async (req, res) => { res.json(await this.d.bank.execute(req.params.orderId, this.access(req), req.body.reference, req.body.senderName)); });
  callback = (method: 'JazzCash' | 'EasyPaisa') => asyncHandler(async (req, res) => {
    const r = await this.d.callback.execute(method, req.body as Record<string, string>);
    res.redirect(`${this.customerUrl}/order-confirmation/${r.orderId ?? ''}?payment=${r.paid ? 'success' : 'failed'}`);
  });
}
