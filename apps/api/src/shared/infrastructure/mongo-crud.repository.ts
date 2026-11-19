import { Model } from 'mongoose';
import { CrudRepository } from '../domain/crud';
import { PageRequest, skipOf, toPage } from '../domain/pagination';
import { countFast, escapeRegex, fromMongo, guard, oidOrNull } from './mongo';
export class MongoCrudRepository<T, TNew> implements CrudRepository<T, TNew> {
  constructor(protected model: Model<any>, private searchField?: string, private sort = '-createdAt') {}
  async list(search: string | undefined, req: PageRequest) {
    const f: any = {}; if (this.searchField && search) f[this.searchField] = new RegExp(escapeRegex(search), 'i');
    const [docs, total] = await Promise.all([this.model.find(f).sort(this.sort).skip(skipOf(req)).limit(req.limit).lean(), countFast(this.model, f)]);
    return toPage(docs.map(d => fromMongo<T>(d)), total, req);
  }
  async findById(id: string) { const k = oidOrNull(id); const d = k && (await this.model.findById(k).lean()); return d ? fromMongo<T>(d) : null; }
  async create(data: TNew) { return fromMongo<T>((await guard(this.model.create(data))).toObject()); }
  async update(id: string, patch: Partial<TNew>) { const k = oidOrNull(id); if (!k) return null; const d = await guard(this.model.findByIdAndUpdate(k, patch as any, { new: true, runValidators: true }).lean()); return d ? fromMongo<T>(d) : null; }
  async delete(id: string) { const k = oidOrNull(id); return !!(k && (await this.model.findByIdAndDelete(k))); }
}
