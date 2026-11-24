import { Router } from 'express';
import { GetStoredImage } from '../application/upload';
/** Mounted at /uploads AFTER the static folder: serves pictures that are stored in MongoDB (works on Vercel, which has no persistent disk). */
export const buildImageServeRoutes = (get: GetStoredImage) => Router().get('/*', async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.path.replace(/^\/+/, '')); const img = await get.execute(key);
    if (!img) return void res.status(404).type('text').send('Not found');
    res.set({ 'Content-Type': img.contentType, 'Cache-Control': 'public, max-age=2592000, immutable', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'cross-origin' }).send(img.data);
  } catch (e) { next(e); }
});
