export interface Product { id: string; name: string; slug: string; description: string; shortDescription?: string; price: number; discountPrice?: number | null;
  images: { url: string; alt: string }[]; variants: { name: string; size?: string; priceDelta: number }[]; stockQuantity: number; sku: string;
  isFeatured: boolean; isBestSeller: boolean; isActive: boolean; ratingAverage?: number; ratingCount?: number; specifications?: Record<string, string>;
  categoryId?: string; category?: { id: string; name: string; slug: string }; related?: Product[] }
export interface Category { id: string; name: string; slug: string; description?: string; image?: string; isActive: boolean }
export interface Paged<T> { items: T[]; total: number; page: number; pages: number }
export interface User { id: string; fullName: string; email: string; role: 'Admin' | 'Customer'; phoneNumber?: string; isActive?: boolean; isEmailVerified?: boolean; createdAt?: string }
export interface PublicSettings { storeName: string; logo?: string; freeDeliveryThreshold: number; deliveryCharges: number; taxPercent: number; currency: string; contactEmail?: string; phone?: string; whatsapp?: string; address?: string;
  paymentMethods: Record<'COD' | 'JazzCash' | 'EasyPaisa' | 'BankTransfer', boolean>; bank?: { bankName?: string; accountTitle?: string; accountNumber?: string; iban?: string; instructions?: string }; social?: Record<string, string> }
export interface OrderItem { productId: string; name: string; sku: string; variant?: string; image?: string; unitPrice: number; quantity: number; lineTotal: number }
export interface Order { id: string; orderNumber: string; customerDetails: { fullName: string; email: string; phone: string; notes?: string }; items: OrderItem[]; subTotal: number; deliveryCharges: number; discount: number; tax: number; totalAmount: number;
  couponCode?: string; paymentMethod: PaymentMethod; paymentStatus: string; orderStatus: string; shippingAddress: { line1: string; city: string; postalCode?: string };
  refund?: { status: string; amount?: number }; statusHistory: { status: string; at: string; note?: string }[]; createdAt: string; payment?: { paymentStatus: string; transactionReference?: string } | null }
export type PaymentMethod = 'COD' | 'JazzCash' | 'EasyPaisa' | 'BankTransfer';
export interface Address { id: string; label: string; fullName: string; phone: string; line1: string; city: string; postalCode?: string; isDefault: boolean }
export interface Review { id: string; userName?: string; rating: number; comment?: string; isVerifiedPurchase: boolean; createdAt: string }
export interface Quote { lines: { productId: string; name: string; variant?: string; unitPrice: number; quantity: number; lineTotal: number }[]; subTotal: number; discount: number; deliveryCharges: number; tax: number; totalAmount: number; coupon: string | null }
export const money = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-US')}`;
export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
