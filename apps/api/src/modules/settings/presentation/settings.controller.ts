import { asyncHandler } from '../../../shared/presentation/http';
import { GetPublicSettings, GetSettings, UpdateSettings } from '../application/settings.use-cases';
export class SettingsController {
  constructor(private pub: GetPublicSettings, private get: GetSettings, private upd: UpdateSettings) {}
  getPublic = asyncHandler(async (_q, res) => { res.json(await this.pub.execute()); });
  getAdmin = asyncHandler(async (_q, res) => { res.json(await this.get.execute()); });
  update = asyncHandler(async (req, res) => { res.json(await this.upd.execute(req.body)); });
}
