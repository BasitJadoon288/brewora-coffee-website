import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { ImageStorage } from '../application/upload';
/** Stores images on local disk (served at /uploads). Swap for S3/Cloudinary by implementing ImageStorage. */
export class LocalDiskImageStorage implements ImageStorage {
  constructor(private dir: string) {}
  async save(folder: string, data: Buffer, ext: string) {
    const name = `${crypto.randomUUID()}.${ext}`; const target = path.join(this.dir, folder);
    await fs.mkdir(target, { recursive: true }); await fs.writeFile(path.join(target, name), data);
    return `/uploads/${folder}/${name}`;
  }
}
