import { Page, PageRequest } from './pagination';
/** Generic port for simple admin-managed resources (banners, testimonials, coupons...). */
export interface CrudRepository<T, TNew> {
  list(search: string | undefined, req: PageRequest): Promise<Page<T>>;
  findById(id: string): Promise<T | null>;
  create(data: TNew): Promise<T>;
  update(id: string, patch: Partial<TNew>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
