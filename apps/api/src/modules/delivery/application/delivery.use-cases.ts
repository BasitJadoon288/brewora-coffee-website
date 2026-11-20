import { DeliveryAreaRepository } from '../domain/delivery-area';
export class ListActiveDeliveryAreas {
  constructor(private repo: DeliveryAreaRepository) {}
  async execute() { return (await this.repo.listActive()).map(a => ({ id: a.id, name: a.name, city: a.city, charge: a.charge, freeDeliveryThreshold: a.freeDeliveryThreshold ?? null })); }
}
