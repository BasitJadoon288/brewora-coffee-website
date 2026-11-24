import crypto from 'crypto';
import { ImageReader, ImageStorage, StoredImage } from '../application/upload';
import { ImageModel } from './image.model';
const TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
export const contentTypeOf = (key: string) => TYPES[key.split('.').pop()?.toLowerCase() ?? ''] ?? null;
export class MongoImageStorage implements ImageStorage, ImageReader {
  async save(folder: string, data: Buffer, ext: string) {
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
    await ImageModel.create({ key, contentType: contentTypeOf(key) ?? 'application/octet-stream', data, size: data.length });
    return `/api/uploads/${key}`; // under /api so the Next.js proxy always forwards it to the API
  }
  async find(key: string): Promise<StoredImage | null> {
    const d = await ImageModel.findOne({ key }).select('contentType data').lean() as { contentType: string; data: unknown } | null;
    if (!d) return null;
    const raw = d.data as any; // lean() gives a BSON Binary (has .buffer/.length()), a Buffer, or a Uint8Array depending on driver version
    const data = Buffer.isBuffer(raw) ? raw : raw?.buffer ? Buffer.from(raw.buffer).subarray(0, typeof raw.length === 'function' ? raw.length() : raw.position ?? raw.buffer.length) : Buffer.from(raw);
    return { contentType: d.contentType, data };
  }
}
