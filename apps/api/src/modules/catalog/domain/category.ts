export interface Category { id: string; name: string; slug: string; description?: string; image?: string; isActive: boolean; createdAt: Date; updatedAt: Date }
export type NewCategory = { name: string; slug: string; description?: string; image?: string; isActive: boolean };
export interface CategoryRepository {
  list(activeOnly: boolean): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  create(d: NewCategory): Promise<Category>;
  update(id: string, patch: Partial<NewCategory>): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
}
