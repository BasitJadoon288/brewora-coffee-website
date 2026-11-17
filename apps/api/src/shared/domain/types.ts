export type Role = 'Admin' | 'Customer';
export interface Viewer { id: string; role: Role }
export type PaymentMethod = 'COD' | 'JazzCash' | 'EasyPaisa' | 'BankTransfer';
