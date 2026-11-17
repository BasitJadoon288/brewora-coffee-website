import { CrudRepository } from '../../../shared/domain/crud';
export interface Banner { id: string; title: string; subtitle?: string; image: string; linkUrl?: string; buttonText?: string; placement: 'hero' | 'promo'; sortOrder: number; isActive: boolean; createdAt: Date }
export type NewBanner = Omit<Banner, 'id' | 'createdAt'>;
export interface Testimonial { id: string; name: string; text: string; rating: number; avatar?: string; isActive: boolean; createdAt: Date }
export type NewTestimonial = Omit<Testimonial, 'id' | 'createdAt'>;
export interface BannerRepository extends CrudRepository<Banner, NewBanner> { listActive(placement?: string): Promise<Banner[]> }
export interface TestimonialRepository extends CrudRepository<Testimonial, NewTestimonial> { listActive(): Promise<Testimonial[]> }
export interface PageContentRepository { get(key: string): Promise<Record<string, unknown>>; put(key: string, data: Record<string, unknown>): Promise<Record<string, unknown>> }
