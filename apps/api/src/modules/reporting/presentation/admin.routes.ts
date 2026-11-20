import { Router } from 'express';
import { z } from 'zod';
import { idParams, validate } from '../../../shared/presentation/http';
import { markPaymentDto, refundDto, updateStatusDto } from '../../orders/application/order.dto';
import { AdminController } from './admin.controller';
/** Mounted at /api/admin (admin guard applied by the parent router) */
export function buildAdminRoutes(c: AdminController) {
  const r = idParams(Router(), ['id']);
  r.get('/dashboard', c.dashboard); r.get('/analytics', c.analytics); r.get('/reports', c.reports); r.get('/newsletter', c.newsletter);
  r.get('/orders', c.orders); r.get('/orders/:id', c.order); r.get('/orders/:id/invoice', c.invoice); r.get('/orders/:id/receipt', c.receipt);
  r.put('/orders/:id/status', validate(updateStatusDto), c.status); r.put('/orders/:id/payment', validate(markPaymentDto), c.payment); r.post('/orders/:id/refund', validate(refundDto), c.refund);
  r.get('/customers', c.customers); r.get('/customers/:id', c.customer); r.put('/customers/:id/status', validate(z.object({ isActive: z.boolean() })), c.customerStatus);
  return r;
}
