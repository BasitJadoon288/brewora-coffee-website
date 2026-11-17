import { SettingsPatch, SettingsRepository } from '../domain/settings';
export class GetPublicSettings {
  constructor(private repo: SettingsRepository) {}
  async execute() { const { id, createdAt, updatedAt, bank, ...pub } = await this.repo.get(); return { ...pub, bank: pub.paymentMethods.BankTransfer ? bank : undefined }; }
}
export class GetSettings { constructor(private repo: SettingsRepository) {} execute() { return this.repo.get(); } }
export class UpdateSettings { constructor(private repo: SettingsRepository) {} execute(p: SettingsPatch) { return this.repo.update(p); } }
