import { PaymentMethod } from '../../../shared/domain/types';
export interface GatewayRequest { url: string; httpMethod: 'POST'; fields: Record<string, string> }
export interface GatewayCallbackResult { authentic: boolean; reference?: string; amountPkr?: number; success?: boolean; raw: Record<string, string> }
/** Port implemented per provider in infrastructure. */
export interface PaymentGateway {
  readonly method: Extract<PaymentMethod, 'JazzCash' | 'EasyPaisa'>;
  readonly callbackPath: string;
  isConfigured(): boolean;
  createRequest(i: { orderNumber: string; amountPkr: number; reference: string; returnUrl: string }): GatewayRequest;
  parseCallback(params: Record<string, string>): GatewayCallbackResult;
}
export type GatewayRegistry = Record<'JazzCash' | 'EasyPaisa', PaymentGateway>;
