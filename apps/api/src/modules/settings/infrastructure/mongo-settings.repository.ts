import { fromMongo, guard } from '../../../shared/infrastructure/mongo';
import { SettingsPatch, SettingsRepository, StoreSettings } from '../domain/settings';
import { SettingsModel } from './settings.model';
const flatten = (o: any, p = '', out: Record<string, unknown> = {}) => { for (const [k, v] of Object.entries(o)) (v && typeof v === 'object') ? flatten(v, p + k + '.', out) : (out[p + k] = v); return out; };
const toSettings = (d: any) => { const { key, ...rest } = fromMongo<any>(d); return rest as StoreSettings; };
export class MongoSettingsRepository implements SettingsRepository {
  async get() { return toSettings(await SettingsModel.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true }).lean()); }
  async update(patch: SettingsPatch) {
    await this.get();
    return toSettings(await guard(SettingsModel.findOneAndUpdate({ key: 'main' }, { $set: flatten(patch) }, { new: true, runValidators: true }).lean()));
  }
}
