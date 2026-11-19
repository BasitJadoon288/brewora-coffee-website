import { fromMongo, guard } from '../../../shared/infrastructure/mongo';
import { TtlCache } from '../../../shared/infrastructure/cache';
import { SettingsPatch, SettingsRepository, StoreSettings } from '../domain/settings';
import { SettingsModel } from './settings.model';
const flatten = (o: any, p = '', out: Record<string, unknown> = {}) => { for (const [k, v] of Object.entries(o)) (v && typeof v === 'object') ? flatten(v, p + k + '.', out) : (out[p + k] = v); return out; };
const toSettings = (d: any) => { const { key, ...rest } = fromMongo<any>(d); return rest as StoreSettings; };
/**
 * Settings are read on almost every request (quotes, checkout, inventory, dashboard) but change rarely,
 * so they are cached briefly per process. Writes through this repository invalidate the cache immediately.
 */
export class MongoSettingsRepository implements SettingsRepository {
  private cache = new TtlCache<StoreSettings>(15_000);
  async get() { return structuredClone(await this.cache.get(() => this.load())); }
  private async load() {
    // Plain read first; only the very first call ever needs the upsert (previously EVERY read was a write).
    const existing = await SettingsModel.findOne({ key: 'main' }).lean();
    if (existing) return toSettings(existing);
    return toSettings(await SettingsModel.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { upsert: true, new: true }).lean());
  }
  async update(patch: SettingsPatch) {
    await this.get(); // make sure the document exists
    const doc = await guard(SettingsModel.findOneAndUpdate({ key: 'main' }, { $set: flatten(patch) }, { new: true, runValidators: true }).lean());
    this.cache.clear(); // next read sees the new values immediately
    return toSettings(doc);
  }
}
