import { CrudRepository } from '../../../shared/domain/crud';
/** A named delivery zone (e.g. a Karachi neighbourhood) with its own delivery charge, managed by the admin. */
export interface DeliveryArea {
  id: string; name: string; city: string; charge: number;
  /** Optional per-area free-delivery limit; falls back to the store-wide limit when empty. */
  freeDeliveryThreshold?: number | null; isActive: boolean; sortOrder: number; createdAt: Date; updatedAt: Date;
}
export type NewDeliveryArea = Omit<DeliveryArea, 'id' | 'createdAt' | 'updatedAt'>;
export interface DeliveryAreaRepository extends CrudRepository<DeliveryArea, NewDeliveryArea> {
  listActive(): Promise<DeliveryArea[]>;
  findActiveById(id: string): Promise<DeliveryArea | null>;
}
