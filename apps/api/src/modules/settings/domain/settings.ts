import { PaymentMethod } from '../../../shared/domain/types';
export interface StoreSettings {
  id: string; storeName: string; logo?: string; contactEmail?: string; phone?: string; whatsapp?: string; address?: string;
  deliveryCharges: number; freeDeliveryThreshold: number; taxPercent: number; currency: string; lowStockThreshold: number;
  paymentMethods: Record<PaymentMethod, boolean>;
  bank: { bankName?: string; accountTitle?: string; accountNumber?: string; iban?: string; instructions?: string };
  social: { facebook?: string; instagram?: string; twitter?: string; tiktok?: string; youtube?: string };
  createdAt: Date; updatedAt: Date;
}
export type SettingsPatch = Partial<Omit<StoreSettings, 'id' | 'createdAt' | 'updatedAt' | 'paymentMethods' | 'bank' | 'social'>> & {
  paymentMethods?: Partial<Record<PaymentMethod, boolean>>; bank?: StoreSettings['bank']; social?: StoreSettings['social'];
};
export interface SettingsRepository { get(): Promise<StoreSettings>; update(patch: SettingsPatch): Promise<StoreSettings> }
