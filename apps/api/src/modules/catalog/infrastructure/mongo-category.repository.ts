import { fromMongo, guard, oidOrNull } from '../../../shared/infrastructure/mongo';
import { Category, CategoryRepository, NewCategory } from '../domain/category';
import { CategoryModel } from './catalog.models';
const map = (d: any) => fromMongo<Category>(d);
export class MongoCategoryRepository implements CategoryRepository {
  async list(activeOnly: boolean) { return (await CategoryModel.find(activeOnly ? { isActive: true } : {}).sort('name').lean()).map(map); }
  async findById(id: string) { const k = oidOrNull(id); const d = k && (await CategoryModel.findById(k).lean()); return d ? map(d) : null; }
  async findBySlug(slug: string) { const d = await CategoryModel.findOne({ slug }).lean(); return d ? map(d) : null; }
  async create(data: NewCategory) { return map((await guard(CategoryModel.create(data))).toObject()); }
  async update(id: string, patch: Partial<NewCategory>) { const k = oidOrNull(id); if (!k) return null; const d = await guard(CategoryModel.findByIdAndUpdate(k, patch, { new: true, runValidators: true }).lean()); return d ? map(d) : null; }
  async delete(id: string) { const k = oidOrNull(id); return !!(k && (await CategoryModel.findByIdAndDelete(k))); }
}
