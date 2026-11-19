import { Page, PageRequest } from '../../../shared/domain/pagination';
import { Order, OrderStatus, PaymentStatus } from '../../orders/domain/order';
import { User } from '../../identity/domain/user';
export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface SalesPoint { period: string; orders: number; sales: number; paidRevenue: number }
export interface ProductPerformance { productId: string; name: string; sku: string; unitsSold: number; revenue: number }
export interface OrderSearch { q?: string; orderStatus?: string; paymentStatus?: string; paymentMethod?: string; from?: Date; to?: Date }
export type CustomerRow = User & { orders: number; totalSpent: number };
/** Read-side (query) port: cross-aggregate aggregations that don't belong to a single aggregate repository. */
export interface ReportingRepository {
  salesSeries(period: Period, from?: Date, to?: Date): Promise<SalesPoint[]>;
  /** Default daily/weekly/monthly/yearly series for the dashboard in a single query. */
  salesOverview(): Promise<Record<Period, SalesPoint[]>>;
  productPerformance(from?: Date, to?: Date, limit?: number): Promise<ProductPerformance[]>;
  paidRevenue(): Promise<number>;
  countOrders(status?: OrderStatus): Promise<number>;
  countCustomers(): Promise<number>;
  orderStatusCounts(): Promise<{ status: string; count: number }[]>;
  recentOrders(limit: number): Promise<Order[]>;
  latestCustomers(limit: number): Promise<User[]>;
  searchOrders(f: OrderSearch, req: PageRequest): Promise<Page<Order>>;
  customers(search: string | undefined, req: PageRequest): Promise<Page<CustomerRow>>;
  customersForReport(limit: number): Promise<CustomerRow[]>;
  customerOrders(userId: string, limit: number): Promise<Order[]>;
  ordersForReport(from: Date | undefined, to: Date | undefined, limit: number): Promise<Order[]>;
  salesByCategory(): Promise<{ categoryId: string; category?: string; revenue: number; units: number }[]>;
  paymentMix(): Promise<{ method: string; orders: number; amount: number }[]>;
  topCustomers(limit: number): Promise<{ userId: string; name?: string; spent: number; orders: number }[]>;
  newCustomersByMonth(): Promise<{ month: string; count: number }[]>;
}
export type { PaymentStatus };
