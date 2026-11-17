import { Router } from 'express';
import { AuthGuards, idParams, validate } from '../../../shared/presentation/http';
import { bankReferenceDto } from '../application/payment.dto';
import { PaymentController } from './payment.controller';
export function buildPaymentRoutes(c: PaymentController, g: AuthGuards) {
  const r = idParams(Router(), ['orderId']);
  r.post('/jazzcash/callback', c.callback('JazzCash'));
  r.post('/easypaisa/callback', c.callback('EasyPaisa'));
  r.post('/:orderId/initiate', g.optionalAuth, c.initiate);
  r.post('/:orderId/bank-reference', g.optionalAuth, validate(bankReferenceDto), c.bankReference);
  return r;
}
