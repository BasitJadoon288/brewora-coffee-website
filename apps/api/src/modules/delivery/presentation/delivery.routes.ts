import { Router } from 'express';
import { asyncHandler } from '../../../shared/presentation/http';
import { ListActiveDeliveryAreas } from '../application/delivery.use-cases';
/** Mounted at /api/delivery-areas */
export const buildPublicDeliveryRoutes = (list: ListActiveDeliveryAreas) => Router().get('/', asyncHandler(async (_q, res) => { res.json(await list.execute()); }));
