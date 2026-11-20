import { Router } from 'express';
import { AuthGuards, idParams, validate } from '../../../shared/presentation/http';
import { placeOrderDto } from '../application/order.dto';
import { OrderController } from './order.controller';
export function buildOrderRoutes(c: OrderController, g: AuthGuards) {
  const r = idParams(Router(), ['id']);
  r.post('/', g.optionalAuth, validate(placeOrderDto), c.place);
  r.get('/my-orders', g.authenticate, c.mine);
  r.get('/track/:orderNumber', c.track);
  r.get('/track/:orderNumber/receipt', c.guestReceipt);
  r.get('/:id/receipt', g.authenticate, c.receipt);
  r.get('/:id', g.authenticate, c.get);
  r.post('/:id/cancel', g.authenticate, c.cancel);
  return r;
}
