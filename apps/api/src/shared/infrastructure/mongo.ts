import mongoose from 'mongoose';
import { BadRequestError, ConflictError } from '../domain/errors';
/** Deep-maps a lean Mongo document to a plain entity: _id -> id, ObjectId -> string, drops __v. */
export function fromMongo<T = any>(v: any): T {
  if (Array.isArray(v)) return v.map(fromMongo) as any;
  if (v === null || typeof v !== 'object' || v instanceof Date) return v;
  if (v._bsontype === 'ObjectId' || v._bsontype === 'ObjectID') return String(v) as any;
  const o: any = {};
  for (const [k, val] of Object.entries(v)) { if (k !== '__v') o[k === '_id' ? 'id' : k] = fromMongo(val); }
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
export const connectDatabase = async (uri: string) => { await mongoose.connect(uri); await Promise.all(Object.values(mongoose.models).map(m => m.init())); };
