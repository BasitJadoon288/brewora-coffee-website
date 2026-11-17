import { Page, PageRequest } from '../../../shared/domain/pagination';
export type InventoryEntryType = 'Initial' | 'Sale' | 'Cancellation' | 'Restock' | 'Adjustment';
export interface InventoryEntry { id: string; productId: string; product?: { id: string; name: string; sku: string }; type: InventoryEntryType; change: number; balanceAfter: number; reason?: string; orderId?: string; by?: string; createdAt: Date }
export type NewInventoryEntry = Omit<InventoryEntry, 'id' | 'product' | 'createdAt'>;
export interface InventoryLedger {
  record(e: NewInventoryEntry): Promise<void>;
  recordMany(e: NewInventoryEntry[]): Promise<void>;
  history(productId: string | undefined, req: PageRequest): Promise<Page<InventoryEntry>>;
  deleteByOrder(orderId: string): Promise<void>;
}
