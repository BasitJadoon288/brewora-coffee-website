import mongoose, { FilterQuery, Model } from 'mongoose';
import { BadRequestError, ConflictError } from '../domain/errors';
/** Deep-maps a lean Mongo document to a plain entity: _id -> id, ObjectId -> string, drops __v. */
export function fromMongo<T = any>(v: any): T {
  if (v === null || typeof v !== 'object' || v instanceof Date) return v;
  if (Array.isArray(v)) { const a = new Array(v.length); for (let i = 0; i < v.length; i++) a[i] = fromMongo(v[i]); return a as any; }
  if (v._bsontype === 'ObjectId' || v._bsontype === 'ObjectID') return String(v) as any;
  const o: any = {};
  for (const k in v) { if (k !== '__v') o[k === '_id' ? 'id' : k] = fromMongo(v[k]); } // for..in: no Object.entries() tuple allocation per field
  return o;
}
import { isObjectId } from '../domain/ids';
export { isObjectId };
/** Translates driver errors into domain errors so upper layers never see Mongo specifics. */
export function translateMongoError(e: any): never {
  if (e?.code === 11000) throw new ConflictError('Duplicate value', e.keyValue);
  if (e?.name === 'ValidationError') throw new BadRequestError('Validation failed', Object.fromEntries(Object.entries(e.errors ?? {}).map(([k, v]: any) => [k, v.message])));
  if (e?.name === 'CastError') throw new BadRequestError('Invalid identifier');
  throw e;
}
export async function guard<T>(p: Promise<T>): Promise<T> { try { return await p; } catch (e) { return translateMongoError(e); } }
export const oidOrNull = (id: string) => (isObjectId(id) ? id : null);
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Count for pagination: an empty filter uses collection metadata (O(1)) instead of counting documents. */
export const countFast = (model: Model<any>, filter: FilterQuery<any> = {}) => (Object.keys(filter).length ? model.countDocuments(filter) : model.estimatedDocumentCount());
export const connectDatabase = async (uri: string, o: { serverless?: boolean } = {}) => {
  if (o.serverless) { await mongoose.connect(uri, { maxPoolSize: 10, minPoolSize: 0, maxIdleTimeMS: 30_000, serverSelectionTimeoutMS: 8000, socketTimeoutMS: 20000 }); return; } // indexes still build in the background (mongoose autoIndex)
  await mongoose.connect(uri, { maxPoolSize: 20, minPoolSize: 2, maxIdleTimeMS: 60_000 });
  await Promise.all(Object.values(mongoose.models).map(m => m.init()));
};
