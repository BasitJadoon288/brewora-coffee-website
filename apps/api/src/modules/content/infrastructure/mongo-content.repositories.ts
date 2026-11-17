import { fromMongo } from '../../../shared/infrastructure/mongo';
import { MongoCrudRepository } from '../../../shared/infrastructure/mongo-crud.repository';
import { Banner, BannerRepository, NewBanner, NewTestimonial, PageContentRepository, Testimonial, TestimonialRepository } from '../domain/content';
import { BannerModel, ContentModel, TestimonialModel } from './content.models';
export class MongoBannerRepository extends MongoCrudRepository<Banner, NewBanner> implements BannerRepository {
  constructor() { super(BannerModel, 'title'); }
  async listActive(placement?: string) { return (await BannerModel.find({ isActive: true, ...(placement && { placement }) }).sort('sortOrder').lean()).map(d => fromMongo<Banner>(d)); }
}
export class MongoTestimonialRepository extends MongoCrudRepository<Testimonial, NewTestimonial> implements TestimonialRepository {
  constructor() { super(TestimonialModel, 'name'); }
  async listActive() { return (await TestimonialModel.find({ isActive: true }).sort('-createdAt').lean()).map(d => fromMongo<Testimonial>(d)); }
}
export class MongoPageContentRepository implements PageContentRepository {
  async get(key: string) { return ((await ContentModel.findOne({ key }).lean()) as any)?.data ?? {}; }
  async put(key: string, data: Record<string, unknown>) { return ((await ContentModel.findOneAndUpdate({ key }, { data }, { upsert: true, new: true }).lean()) as any).data; }
}
