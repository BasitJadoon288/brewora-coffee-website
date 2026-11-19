import { Request } from 'express';
import { asyncHandler, pageRequest } from '../../../shared/presentation/http';
import { toCsv } from '../../../shared/presentation/csv';
import { UpdateOrderStatus, MarkPaymentStatus, RefundOrder, GetOrderDetailForAdmin } from '../../orders/application/order.use-cases';
import { ListSubscribers } from '../../engagement/application/engagement.use-cases';
import { GetSettings } from '../../settings/application/settings.use-cases';
import * as UC from '../application/reporting.use-cases';
import { renderInvoice } from './invoice.view';

const dateQ = (v: unknown) => { const d = v ? new Date(String(v)) : undefined; return d && !isNaN(+d) ? d : undefined; };
export interface AdminUseCases {
  dashboard: UC.GetDashboard; searchOrders: UC.SearchOrders; orderDetail: GetOrderDetailForAdmin; updateStatus: UpdateOrderStatus; markPayment: MarkPaymentStatus; refund: RefundOrder;
  customers: UC.ListCustomers; customer: UC.GetCustomerProfile; setActive: UC.SetCustomerActive; report: UC.GetReport; analytics: UC.GetAnalytics; subscribers: ListSubscribers; settings: GetSettings;
}
export class AdminController {
  constructor(private uc: AdminUseCases) {}
  dashboard = asyncHandler(async (_q, res) => { res.json(await this.uc.dashboard.execute()); });
  orders = asyncHandler(async (req, res) => {
    const q = req.query; res.json(await this.uc.searchOrders.execute({ q: q.q ? String(q.q) : undefined, orderStatus: q.orderStatus as string, paymentStatus: q.paymentStatus as string, paymentMethod: q.paymentMethod as string, from: dateQ(q.from), to: dateQ(q.to) }, pageRequest(q)));
  });
  order = asyncHandler(async (req, res) => { res.json(await this.uc.orderDetail.execute(req.params.id)); });
  invoice = asyncHandler(async (req, res) => { const [o, s] = await Promise.all([this.uc.orderDetail.execute(req.params.id), this.uc.settings.execute()]); res.type('html').send(renderInvoice(o, s)); });
  status = asyncHandler(async (req, res) => { res.json(await this.uc.updateStatus.execute(req.params.id, req.body.status, req.user!.id, req.body.note)); });
  payment = asyncHandler(async (req, res) => { res.json(await this.uc.markPayment.execute(req.params.id, req.body.status, req.user!.id, req.body.reference)); });
  refund = asyncHandler(async (req, res) => { res.json(await this.uc.refund.execute(req.params.id, req.user!.id, req.body.amount, req.body.note)); });
  customers = asyncHandler(async (req, res) => { res.json(await this.uc.customers.execute(req.query.q ? String(req.query.q) : undefined, pageRequest(req.query))); });
  customer = asyncHandler(async (req, res) => { res.json(await this.uc.customer.execute(req.params.id)); });
  customerStatus = asyncHandler(async (req, res) => { res.json(await this.uc.setActive.execute(req.params.id, req.body.isActive)); });
  reports = asyncHandler(async (req: Request, res) => {
    const type = String(req.query.type ?? 'sales'); const period = String(req.query.period ?? 'daily') as any;
    const rows = await this.uc.report.execute(type, period, dateQ(req.query.from), dateQ(req.query.to));
    if (req.query.format === 'csv') return void res.type('text/csv').attachment(`brewora-${type}-${period}.csv`).send(toCsv(rows));
    res.json({ type, period, rows });
  });
  analytics = asyncHandler(async (_q, res) => { res.json(await this.uc.analytics.execute()); });
  newsletter = asyncHandler(async (req, res) => {
    const p: any = await this.uc.subscribers.execute(pageRequest(req.query));
    if (req.query.format === 'csv') return void res.type('text/csv').attachment('newsletter.csv').send(toCsv(p.items, ['email', 'isActive', 'createdAt']));
    res.json(p);
  });
}
