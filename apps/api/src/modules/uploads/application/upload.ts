import { BadRequestError, ServiceUnavailableError } from '../../../shared/domain/errors';
import { z } from 'zod';
export const signUploadDto = z.object({ folder: z.enum(['products', 'categories', 'banners', 'about', 'logo', 'content']).default('products') });
export interface UploadSigner { isConfigured(): boolean; sign(folder: string): Record<string, unknown> }
export class SignUpload { constructor(private signer: UploadSigner) {} execute(folder: string) { if (!this.signer.isConfigured()) throw new ServiceUnavailableError('Cloudinary is not configured'); return this.signer.sign(`brewora/${folder}`); } }

export const UPLOAD_FOLDERS = ['products', 'categories', 'banners', 'about', 'logo', 'content'] as const;
export const uploadFolderDto = z.object({ folder: z.enum(UPLOAD_FOLDERS).default('products') });
export interface ImageStorage { save(folder: string, data: Buffer, ext: string): Promise<string> }
export interface StoredImage { contentType: string; data: Buffer }
export interface ImageReader { find(key: string): Promise<StoredImage | null> }
/** Reads an uploaded image (stored in MongoDB) by its path under /uploads, e.g. "products/<uuid>.jpg". */
export class GetStoredImage {
  constructor(private reader: ImageReader) {}
  async execute(key: string): Promise<StoredImage | null> { return /^[\w][\w./-]{0,199}$/.test(key) && !key.includes('..') ? this.reader.find(key) : null; }
}
/** Identifies the image type from magic bytes — the client-declared Content-Type is never trusted. */
export function detectImageExt(b: Buffer): 'png' | 'jpg' | 'webp' | 'gif' | null {
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (b.length > 6 && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii'))) return 'gif';
  return null;
}
export class UploadImage {
  constructor(private storage: ImageStorage, private maxBytes = 5 * 1024 * 1024) {}
  async execute(folder: string, data: unknown) {
    if (!Buffer.isBuffer(data) || data.length === 0) throw new BadRequestError('No image data received');
    if (data.length > this.maxBytes) throw new BadRequestError('Image is larger than 5 MB');
    const ext = detectImageExt(data); if (!ext) throw new BadRequestError('Unsupported image. Use PNG, JPEG, WebP or GIF.');
    return { url: await this.storage.save(folder, data, ext) };
  }
}
