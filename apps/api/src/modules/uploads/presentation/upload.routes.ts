import express, { Router } from 'express';
import { asyncHandler, validate } from '../../../shared/presentation/http';
import { SignUpload, signUploadDto, UploadImage, uploadFolderDto } from '../application/upload';
export function buildUploadRoutes(sign: SignUpload, image: UploadImage) {
  const r = Router();
  r.post('/sign', validate(signUploadDto), asyncHandler(async (req, res) => { res.json(sign.execute(req.body.folder)); }));
  // raw binary body (Content-Type: image/*); size capped by the parser and again by the use case
  r.post('/image', express.raw({ type: 'image/*', limit: '5mb' }), validate(uploadFolderDto, 'query'), asyncHandler(async (req, res) => { res.status(201).json(await image.execute((req as any).validated.folder, req.body)); }));
  return r;
}
