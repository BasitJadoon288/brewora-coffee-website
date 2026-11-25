import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { TokenService } from '../application/ports';
import { DomainError, ErrorKind, ForbiddenError, UnauthorizedError } from '../domain/errors';
import { PageRequest } from '../domain/pagination';
import { Viewer } from '../domain/types';
import { isObjectId } from '../domain/ids';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };

export const validate = (schema: ZodSchema, part: 'body' | 'query' = 'body'): RequestHandler => (req, _res, next) => {
  const r = schema.safeParse(req[part]);
  if (!r.success) return next(r.error);
  if (part === 'body') req.body = r.data; else (req as any).validated = r.data;
  next();
};
/** Public storefront reads are always revalidated (ETag/304), so an admin change is visible on the very next request. The Next.js data cache (purged by /revalidate) is the only caching layer; a CDN or browser copy here would make admin edits show up minutes late. */
export const publicCache = (_seconds?: number, _staleSeconds?: number): RequestHandler => (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate'); next();
};
export const validated = <T>(req: Request) => (req as any).validated as T;
export const viewerOf = (req: Request): Viewer | undefined => req.user;
export const pageRequest = (q: any, max = 100): PageRequest => ({ page: Math.max(1, parseInt(q.page) || 1), limit: Math.min(max, Math.max(1, parseInt(q.limit) || 20)) });

/** Rejects malformed ObjectId route params with 400 before they reach any use case. */
export function idParams(router: Router, names: string[]) {
  for (const n of names) router.param(n, (_req, _res, next, v) => (isObjectId(v) ? next() : next(new DomainError('invalid', 'Invalid identifier'))));
  return router;
}

export function createAuthGuards(tokens: TokenService) {
  const read = (req: Request) => { const h = req.headers.authorization; return h?.startsWith('Bearer ') ? tokens.verifyAccessToken(h.slice(7)) : null; };
  const authenticate: RequestHandler = (req, _res, next) => {
    const t = read(req); if (!t) return next(new UnauthorizedError('Authentication required'));
    req.user = { id: t.userId, role: t.role }; next();
  };
  const optionalAuth: RequestHandler = (req, _res, next) => { const t = read(req); if (t) req.user = { id: t.userId, role: t.role }; next(); };
  const requireAdmin: RequestHandler = (req, _res, next) => (req.user?.role === 'Admin' ? next() : next(new ForbiddenError()));
  return { authenticate, optionalAuth, requireAdmin, adminOnly: [authenticate, requireAdmin] as RequestHandler[] };
}
export type AuthGuards = ReturnType<typeof createAuthGuards>;

const STATUS: Record<ErrorKind, number> = { invalid: 400, unauthorized: 401, forbidden: 403, not_found: 404, conflict: 409, unavailable: 503 };
export const createErrorHandler = (log: { error(obj: unknown, msg?: string): void }) => (err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.removeHeader('Cache-Control');
  if (err instanceof ZodError) return res.status(400).json({ message: 'Validation failed', errors: err.flatten().fieldErrors });
  if (err instanceof DomainError) return res.status(STATUS[err.kind]).json({ message: err.message, ...(err.details ? { details: err.details } : {}) });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON' });
  log.error({ err }, 'unhandled error');
  res.status(500).json({ message: 'Internal server error' });
};

function clean(v: any): any {
  if (Array.isArray(v)) return v.map(clean);
  if (ArrayBuffer.isView(v)) return v; // Buffers (image uploads) must pass through untouched
  if (v && typeof v === 'object' && !(v instanceof Date)) { const o: any = {}; for (const k of Object.keys(v)) { if (!k.startsWith('$') && !k.includes('.')) o[k] = clean(v[k]); } return o; }
  return v;
}
/** Strips Mongo operator keys ($, dotted) from user input. */
export const sanitize: RequestHandler = (req, _res, next) => { if (req.body) req.body = clean(req.body); if (req.query) req.query = clean(req.query); next(); };
export { clean as cleanInput };
