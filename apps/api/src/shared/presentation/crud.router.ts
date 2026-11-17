import { Router } from 'express';
import { ZodTypeAny } from 'zod';
import { PageRequest } from '../domain/pagination';
import { asyncHandler, idParams, pageRequest, validate } from './http';
export interface ManageLike { list(q: string | undefined, req: PageRequest): Promise<unknown>; get(id: string): Promise<unknown>; create(d: any): Promise<unknown>; update(id: string, p: any): Promise<unknown>; remove(id: string): Promise<void> }
/** Admin CRUD router for any resource exposed through ManageResource-like use cases. */
export function crudRouter(m: ManageLike, create: ZodTypeAny, update: ZodTypeAny) {
  const r = idParams(Router(), ['id']);
  r.get('/', asyncHandler(async (req, res) => { res.json(await m.list(req.query.q ? String(req.query.q) : undefined, pageRequest(req.query))); }));
  r.get('/:id', asyncHandler(async (req, res) => { res.json(await m.get(req.params.id)); }));
  r.post('/', validate(create), asyncHandler(async (req, res) => { res.status(201).json(await m.create(req.body)); }));
  r.put('/:id', validate(update), asyncHandler(async (req, res) => { res.json(await m.update(req.params.id, req.body)); }));
  r.delete('/:id', asyncHandler(async (req, res) => { await m.remove(req.params.id); res.status(204).end(); }));
  return r;
}
