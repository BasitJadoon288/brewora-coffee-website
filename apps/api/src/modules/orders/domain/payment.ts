import { PaymentMethod } from '../../../shared/domain/types';
import { PaymentStatus } from './order';
export interface Payment { id: string; orderId: string; amount: number; paymentMethod: PaymentMethod; transactionReference?: string; senderName?: string; paymentStatus: PaymentStatus; verifiedAt?: Date; createdAt: Date }
export type NewPayment = Pick<Payment, 'orderId' | 'amount' | 'paymentMethod'>;
export interface PaymentRepository {
  create(p: NewPayment): Promise<Payment>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByReference(method: PaymentMethod, reference: string): Promise<Payment | null>;
  updateByOrderId(orderId: string, patch: Partial<Pick<Payment, 'paymentStatus' | 'transactionReference' | 'senderName' | 'verifiedAt'>> & { gatewayResponse?: unknown }): Promise<void>;
  deleteByOrderId(orderId: string): Promise<void>;
}
