import { BadRequestError, NotFoundError } from '../../../shared/domain/errors';
import { PageRequest } from '../../../shared/domain/pagination';
import { ProductRepository } from '../../catalog/domain/product';
import { NotificationRepository } from '../../engagement/domain/engagement';
import { UserRepository } from '../../identity/domain/user';
import { SettingsRepository } from '../../settings/domain/settings';
import { OrderSearch, Period, ReportingRepository } from '../domain/reporting';

export class GetDashboard {
  constructor(private r: ReportingRepository, private products: ProductRepository, private settings: SettingsRepository, private notifications: NotificationRepository) {}
  async execute() {
    const { lowStockThreshold: t } = await this.settings.get();
    const [revenue, totalOrders, pending, completed, customers, products, lowCount, daily, weekly, monthly, yearly, byStatus, recent, best, latest, low, activities] = await Promise.all([
      this.r.paidRevenue(), this.r.countOrders(), this.r.countOrders('Pending'), this.r.countOrders('Delivered'), this.r.countCustomers(), this.products.countAll(), this.products.countLowStock(t),
      this.r.salesSeries('daily'), this.r.salesSeries('weekly'), this.r.salesSeries('monthly'), this.r.salesSeries('yearly'), this.r.orderStatusCounts(),
      this.r.recentOrders(8), this.r.productPerformance(undefined, undefined, 5), this.r.latestCustomers(5), this.products.lowStock(t, 10), this.notifications.recentForAdmins(10),
    ]);
    return {
      cards: { totalRevenue: revenue, totalOrders, pendingOrders: pending, completedOrders: completed, totalCustomers: customers, totalProducts: products, lowStockProducts: lowCount },
      charts: { daily, weekly, monthly, yearly, orderStats: byStatus },
      recentOrders: recent.map(o => ({ id: o.id, orderNumber: o.orderNumber, customerDetails: { fullName: o.customerDetails.fullName }, totalAmount: o.totalAmount, orderStatus: o.orderStatus, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
      bestSellers: best.map(b => ({ id: b.productId, name: b.name, unitsSold: b.unitsSold })),
      latestCustomers: latest.map(u => ({ id: u.id, fullName: u.fullName, email: u.email, createdAt: u.createdAt })),
      lowStockAlerts: low.map(p => ({ id: p.id, name: p.name, sku: p.sku, stockQuantity: p.stockQuantity })), recentActivities: activities,
    };
  }
}
export class SearchOrders { constructor(private r: ReportingRepository) {} execute(f: OrderSearch, req: PageRequest) { return this.r.searchOrders(f, req); } }
export class ListCustomers { constructor(private r: ReportingRepository) {} execute(q: string | undefined, req: PageRequest) { return this.r.customers(q, req); } }
export class GetCustomerProfile {
  constructor(private users: UserRepository, private r: ReportingRepository) {}
  async execute(id: string) {
    const u = await this.users.findById(id); if (!u || u.role !== 'Customer') throw new NotFoundError('Customer not found');
    const orders = await this.r.customerOrders(id, 50);
    return { customer: u, orders, totalSpent: orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0) };
  }
}
export class SetCustomerActive { constructor(private users: UserRepository) {} async execute(id: string, active: boolean) { const u = await this.users.setCustomerActive(id, active); if (!u) throw new NotFoundError('Customer not found'); return u; } }
export class GetReport {
  constructor(private r: ReportingRepository) {}
  async execute(type: string, period: Period, from?: Date, to?: Date): Promise<Record<string, unknown>[]> {
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) throw new BadRequestError('Invalid period');
    switch (type) {
      case 'sales': case 'revenue': return (await this.r.salesSeries(period, from, to)) as any;
      case 'products': return (await this.r.productPerformance(from, to)).map(p => ({ product: p.name, sku: p.sku, unitsSold: p.unitsSold, revenue: p.revenue }));
      case 'orders': return (await this.r.ordersForReport(from, to, 5000)).map(o => ({ orderNumber: o.orderNumber, date: o.createdAt, customer: o.customerDetails.fullName, email: o.customerDetails.email, status: o.orderStatus, payment: o.paymentMethod, paymentStatus: o.paymentStatus, total: o.totalAmount }));
      case 'customers': return (await this.r.customersForReport(5000)).map(u => ({ name: u.fullName, email: u.email, phone: u.phoneNumber, joined: u.createdAt, active: u.isActive, orders: u.orders, totalSpent: u.totalSpent }));
      default: throw new BadRequestError('Unknown report type');
    }
  }
}
export class GetAnalytics {
  constructor(private r: ReportingRepository) {}
  async execute() {
    const [salesByCategory, paymentMethods, topCustomers, newCustomersByMonth, topProducts] = await Promise.all([this.r.salesByCategory(), this.r.paymentMix(), this.r.topCustomers(5), this.r.newCustomersByMonth(), this.r.productPerformance(undefined, undefined, 10)]);
    return { salesByCategory, paymentMethods, topCustomers, newCustomersByMonth, topProducts };
  }
}
