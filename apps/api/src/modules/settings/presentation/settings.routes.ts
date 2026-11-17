import { Router } from 'express';
import { validate } from '../../../shared/presentation/http';
import { updateSettingsDto } from '../application/settings.dto';
import { SettingsController } from './settings.controller';
export const buildPublicSettingsRoutes = (c: SettingsController) => Router().get('/public', c.getPublic);
export const buildAdminSettingsRoutes = (c: SettingsController) => Router().get('/', c.getAdmin).put('/', validate(updateSettingsDto), c.update);
