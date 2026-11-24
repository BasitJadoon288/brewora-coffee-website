import type { PipelineStage } from 'mongoose';
import { PageRequest, skipOf, toPage } from '../../../shared/domain/pagination';
import { escapeRegex, fromMongo, oidOrNull } from '../../../shared/infrastructure/mongo';
import { OrderModel } from '../../orders/infrastructure/order.models';
import { UserModel } from '../../identity/infrastructure/user.model';
import { Order, OrderStatus } from '../../orders/domain/order';
import { User } from '../../identity/domain/user';
import { CustomerRow, OrderSearch, Period, ProductPerformance, ReportingRepository, SalesPoint } from '../domain/reporting';

const TZ = 'Asia/Karachi';
const defaultFrom = (p: Period) => new Date(Date.now() - { daily: 30, weekly: 84, monthly: 366, yearly: 1825 }[p] * 86400e3);
const mapOrder = (d: any) => fromMongo<Order>(d);
const mapUser = (d: any) => fromMongo<User>(d);

export class MongoReportingRepository implements ReportingRepository {
  /** $group + $sort stages for one period granularity (shared by the single-period and the dashboard "all periods" query). */
  private seriesStages(period: Period): PipelineStage.FacetPipelineStage[] {
    const idExpr: any = period === 'weekly'
      ? { y: { $isoWeekYear: { date: '$createdAt', timezone: TZ } }, w: { $isoWeek: { date: '$createdAt', timezone: TZ } } }
      : { $dateToString: { format: { daily: '%Y-%m-%d', monthly: '%Y-%m', yearly: '%Y' }[period], date: '$createdAt', timezone: TZ } };
    return [
      { $group: { _id: idExpr, orders: { $sum: 1 }, sales: { $sum: '$totalAmount' }, paidRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$totalAmount', 0] } } } },
      { $sort: { _id: 1 } },
    ];
  }
  private toPoints(rows: any[]): SalesPoint[] {
    return rows.map((r: any) => ({ period: typeof r._id === 'string' ? r._id : `${r._id.y}-W${String(r._id.w).padStart(2, '0')}`, orders: r.orders, sales: r.sales, paidRevenue: r.paidRevenue }));
  }
  async salesSeries(period: Period, from?: Date, to?: Date): Promise<SalesPoint[]> {
    const rows = await OrderModel.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' }, createdAt: { $gte: from ?? defaultFrom(period), $lte: to ?? new Date() } } },
      ...this.seriesStages(period),
    ]);
    return this.toPoints(rows);
  }
  /** Dashboard: all four default series from ONE pass over orders ($facet) instead of four separate aggregations. */
  async salesOverview(): Promise<Record<Period, SalesPoint[]>> {
    const periods: Period[] = ['daily', 'weekly', 'monthly', 'yearly']; const now = new Date();
    const facets: Record<string, PipelineStage.FacetPipelineStage[]> = Object.fromEntries(periods.map(p => [p, [{ $match: { createdAt: { $gte: defaultFrom(p) } } }, ...this.seriesStages(p)]]));
    const [row] = await OrderModel.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' }, createdAt: { $gte: defaultFrom('yearly'), $lte: now } } }, { $facet: facets }]);
    return Object.fromEntries(periods.map(p => [p, this.toPoints(row?.[p] ?? [])])) as Record<Period, SalesPoint[]>;
  }
  async productPerformance(from?: Date, to?: Date, limit = 100): Promise<ProductPerformance[]> {
    const rows = await OrderModel.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' }, ...(from || to ? { createdAt: { ...(from && { $gte: from }), ...(to && { $lte: to }) } } : {}) } }, { $unwind: '$items' },
      { $group: { _id: '$items.productId', name: { $first: '$items.name' }, sku: { $first: '$items.sku' }, unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { unitsSold: -1 } }, { $limit: limit },
    ]);
    return rows.map((r: any) => ({ productId: String(r._id), name: r.name, sku: r.sku, unitsSold: r.unitsSold, revenue: r.revenue }));
  }
  async paidRevenue() { const r = await OrderModel.aggregate([{ $match: { paymentStatus: 'Paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]); return r[0]?.total ?? 0; }
  countOrders(status?: OrderStatus) { return OrderModel.countDocuments(status ? { orderStatus: status } : {}); }
  countCustomers() { return UserModel.countDocuments({ role: 'Customer' }); }
  async orderStatusCounts() { return (await OrderModel.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }])).map((x: any) => ({ status: x._id, count: x.count })); }
  async recentOrders(limit: number) { return (await OrderModel.find().select('orderNumber customerDetails.fullName totalAmount orderStatus paymentStatus createdAt').sort('-createdAt').limit(limit).lean()).map(mapOrder); } // only the fields the dashboard shows
  async latestCustomers(limit: number) { return (await UserModel.find({ role: 'Customer' }).select('fullName email createdAt').sort('-createdAt').limit(limit).lean()).map(mapUser); }
  async searchOrders(f: OrderSearch, req: PageRequest) {
    const q: any = {}; const s = (f.q ?? '').trim();
    if (s) { const r = new RegExp(escapeRegex(s), 'i'); q.$or = [{ orderNumber: r }, { 'customerDetails.fullName': r }, { 'customerDetails.email': r }, { 'customerDetails.phone': r }]; }
    for (const k of ['orderStatus', 'paymentStatus', 'paymentMethod'] as const) if (f[k]) q[k] = f[k];
    if (f.from || f.to) q.createdAt = { ...(f.from && { $gte: f.from }), ...(f.to && { $lte: f.to }) };
    const [docs, total] = await Promise.all([OrderModel.find(q).sort('-createdAt').skip(skipOf(req)).limit(req.limit).lean(), OrderModel.countDocuments(q)]);
    return toPage(docs.map(mapOrder), total, req);
  }
  private async withStats(users: any[]): Promise<CustomerRow[]> {
    const stats = await OrderModel.aggregate([{ $match: { userId: { $in: users.map(u => u._id) }, orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: '$userId', orders: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } }]);
    const m = new Map(stats.map((x: any) => [String(x._id), x]));
    return users.map(u => ({ ...mapUser(u), orders: m.get(String(u._id))?.orders ?? 0, totalSpent: m.get(String(u._id))?.totalSpent ?? 0 }));
  }
  async customers(search: string | undefined, req: PageRequest) {
    const f: any = { role: 'Customer' }; if (search) { const r = new RegExp(escapeRegex(search), 'i'); f.$or = [{ fullName: r }, { email: r }, { phoneNumber: r }]; }
    const [users, total] = await Promise.all([UserModel.find(f).sort('-createdAt').skip(skipOf(req)).limit(req.limit).lean(), UserModel.countDocuments(f)]);
    return toPage(await this.withStats(users), total, req);
  }
  async customersForReport(limit: number) { return this.withStats(await UserModel.find({ role: 'Customer' }).sort('-createdAt').limit(limit).lean()); }
  async customerOrders(userId: string, limit: number) { const k = oidOrNull(userId); return k ? (await OrderModel.find({ userId: k }).sort('-createdAt').limit(limit).lean()).map(mapOrder) : []; }
  async ordersForReport(from: Date | undefined, to: Date | undefined, limit: number) { const f: any = from || to ? { createdAt: { ...(from && { $gte: from }), ...(to && { $lte: to }) } } : {}; return (await OrderModel.find(f).select('orderNumber createdAt customerDetails.fullName customerDetails.email orderStatus paymentMethod paymentStatus totalAmount').sort('-createdAt').limit(limit).lean()).map(mapOrder); } // report rows need only these columns
  /** Group order lines per product FIRST (small result), and only then join products/categories - the old pipeline did a $lookup for every single order line. */
  async salesByCategory() {
    const rows = await OrderModel.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } }, { $unwind: '$items' },
      { $group: { _id: '$items.productId', revenue: { $sum: '$items.lineTotal' }, units: { $sum: '$items.quantity' } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } }, { $unwind: '$p' },
      { $group: { _id: '$p.categoryId', revenue: { $sum: '$revenue' }, units: { $sum: '$units' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'c' } },
      { $project: { category: { $arrayElemAt: ['$c.name', 0] }, revenue: 1, units: 1 } }, { $sort: { revenue: -1 } }]);
    return rows.map((r: any) => ({ categoryId: String(r._id), category: r.category, revenue: r.revenue, units: r.units }));
  }
  async paymentMix() { return (await OrderModel.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' } } }, { $group: { _id: '$paymentMethod', orders: { $sum: 1 }, amount: { $sum: '$totalAmount' } } }])).map((x: any) => ({ method: x._id, orders: x.orders, amount: x.amount })); }
  async topCustomers(limit: number) {
    const rows = await OrderModel.aggregate([{ $match: { orderStatus: { $ne: 'Cancelled' }, userId: { $ne: null } } }, { $group: { _id: '$userId', spent: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }, { $sort: { spent: -1 } }, { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } }, { $project: { name: { $arrayElemAt: ['$u.fullName', 0] }, spent: 1, orders: 1 } }]);
    return rows.map((r: any) => ({ userId: String(r._id), name: r.name, spent: r.spent, orders: r.orders }));
  }
  async newCustomersByMonth() { return (await UserModel.aggregate([{ $match: { role: 'Customer' } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TZ } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])).map((x: any) => ({ month: x._id, count: x.count })); }
}
