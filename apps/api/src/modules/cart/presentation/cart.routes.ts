import { Router } from 'express';
import { AuthGuards, idParams, validate } from '../../../shared/presentation/http';
import * as D from '../application/cart.dto';
import { CartController } from './cart.controller';
export function buildCartRoutes(c: CartController, g: AuthGuards) {
  const r = idParams(Router(), ['id']);
  r.post('/quote', g.optionalAuth, validate(D.quoteDto), c.quote); // guests (localStorage cart) and members
  r.use(g.authenticate);
  r.get('/', c.get); r.post('/items', validate(D.cartItemDto), c.add); r.post('/merge', validate(D.mergeCartDto), c.merge);
  r.put('/items/:id', validate(D.updateQtyDto), c.update); r.delete('/items/:id', c.remove);
  return r;
}
