import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { connectDatabase } from '../shared/infrastructure/mongo';
import { loadEnv } from '../shared/infrastructure/env';
import { ImageModel } from '../modules/uploads/infrastructure/image.model';
import { contentTypeOf } from '../modules/uploads/infrastructure/mongo-image.storage';

/**
 * One-time (re-runnable) migration: copies every picture in the local uploads/ folder into MongoDB.
 * Keys are the same path below /uploads, so existing image URLs in products, banners, etc. keep working unchanged.
 *   npm run migrate:images            -> copy new files only
 */
async function* walk(dir: string, base = dir): AsyncGenerator<string> {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p, base); else yield path.relative(base, p).split(path.sep).join('/');
  }
}
(async () => {
  const env = loadEnv(); await connectDatabase(env.MONGODB_URI);
  const dir = path.resolve(env.UPLOAD_DIR ?? 'uploads'); let added = 0, skipped = 0, bytes = 0;
  try { await fs.access(dir); } catch { console.log(`Folder not found: ${dir}`); return; }
  for await (const key of walk(dir)) {
    const type = contentTypeOf(key); if (!type) { skipped++; continue; }
    if (await ImageModel.exists({ key })) { skipped++; continue; }
    const data = await fs.readFile(path.join(dir, key)); await ImageModel.create({ key, contentType: type, data, size: data.length }); added++; bytes += data.length;
  }
  console.log(`Images copied to MongoDB: ${added} (${(bytes / 1048576).toFixed(1)} MB), skipped: ${skipped}`);
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => mongoose.disconnect());
