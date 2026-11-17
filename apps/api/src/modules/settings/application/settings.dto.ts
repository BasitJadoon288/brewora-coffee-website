import { z } from 'zod';
export const updateSettingsDto = z.object({
  storeName: z.string().min(1), logo: z.string(), contactEmail: z.string().email(), phone: z.string(), whatsapp: z.string(), address: z.string(),
  deliveryCharges: z.number().min(0), freeDeliveryThreshold: z.number().min(0), taxPercent: z.number().min(0).max(100), currency: z.string().length(3), lowStockThreshold: z.number().int().min(0),
  paymentMethods: z.object({ COD: z.boolean(), JazzCash: z.boolean(), EasyPaisa: z.boolean(), BankTransfer: z.boolean() }).partial(),
  bank: z.object({ bankName: z.string(), accountTitle: z.string(), accountNumber: z.string(), iban: z.string(), instructions: z.string() }).partial(),
  social: z.object({ facebook: z.string(), instagram: z.string(), twitter: z.string(), tiktok: z.string(), youtube: z.string() }).partial(),
}).partial();
