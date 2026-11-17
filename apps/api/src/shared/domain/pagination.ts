export interface PageRequest { page: number; limit: number }
export interface Page<T> { items: T[]; total: number; page: number; pages: number }
export const toPage = <T>(items: T[], total: number, r: PageRequest): Page<T> => ({ items, total, page: r.page, pages: Math.ceil(total / r.limit) });
export const skipOf = (r: PageRequest) => (r.page - 1) * r.limit;
