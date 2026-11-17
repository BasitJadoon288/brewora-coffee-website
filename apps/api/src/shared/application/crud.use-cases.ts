import { CrudRepository } from '../domain/crud';
import { NotFoundError } from '../domain/errors';
import { PageRequest } from '../domain/pagination';
export class ManageResource<T, TNew> {
  constructor(private repo: CrudRepository<T, TNew>, private label: string) {}
  list(search: string | undefined, req: PageRequest) { return this.repo.list(search, req); }
  async get(id: string) { const r = await this.repo.findById(id); if (!r) throw new NotFoundError(`${this.label} not found`); return r; }
  create(data: TNew) { return this.repo.create(data); }
  async update(id: string, patch: Partial<TNew>) { const r = await this.repo.update(id, patch); if (!r) throw new NotFoundError(`${this.label} not found`); return r; }
  async remove(id: string) { if (!(await this.repo.delete(id))) throw new NotFoundError(`${this.label} not found`); }
}
