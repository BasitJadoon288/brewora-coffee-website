import { BadRequestError } from '../../../shared/domain/errors';
import { BannerRepository, PageContentRepository, TestimonialRepository } from '../domain/content';
export class ListActiveBanners { constructor(private r: BannerRepository) {} execute(placement?: string) { return this.r.listActive(placement); } }
export class ListActiveTestimonials { constructor(private r: TestimonialRepository) {} execute() { return this.r.listActive(); } }
export class GetPageContent { constructor(private r: PageContentRepository) {} execute(key: string) { return this.r.get(key); } }
export class UpdatePageContent {
  constructor(private r: PageContentRepository) {}
  execute(key: string, data: Record<string, unknown>) { if (!/^[a-z-]{2,30}$/.test(key)) throw new BadRequestError('Invalid key'); return this.r.put(key, data); }
}
