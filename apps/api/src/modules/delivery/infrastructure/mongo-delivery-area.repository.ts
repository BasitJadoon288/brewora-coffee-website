import { fromMongo, oidOrNull } from '../../../shared/infrastructure/mongo';
import { MongoCrudRepository } from '../../../shared/infrastructure/mongo-crud.repository';
import { DeliveryArea, DeliveryAreaRepository, NewDeliveryArea } from '../domain/delivery-area';
import { DeliveryAreaModel } from './delivery-area.model';
export class MongoDeliveryAreaRepository extends MongoCrudRepository<DeliveryArea, NewDeliveryArea> implements DeliveryAreaRepository {
  constructor() { super(DeliveryAreaModel, 'name', 'sortOrder name'); }
  async listActive() { return (await DeliveryAreaModel.find({ isActive: true }).sort('sortOrder name').lean()).map(d => fromMongo<DeliveryArea>(d)); }
  async findActiveById(id: string) { const k = oidOrNull(id); const d = k && (await DeliveryAreaModel.findOne({ _id: k, isActive: true }).lean()); return d ? fromMongo<DeliveryArea>(d) : null; }
}
