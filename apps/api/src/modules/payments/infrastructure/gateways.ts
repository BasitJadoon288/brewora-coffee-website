import { GatewayCallbackResult, GatewayRequest, PaymentGateway } from '../application/payment-gateway';
import { easypaisaHash, jazzSecureHash, pkTimestamp, verifyEasypaisa, verifyJazz } from './signing';

export class JazzCashGateway implements PaymentGateway {
  readonly method = 'JazzCash' as const; readonly callbackPath = 'jazzcash';
  constructor(private cfg: { merchantId?: string; password?: string; salt?: string; baseUrl: string }) {}
  isConfigured() { return !!(this.cfg.merchantId && this.cfg.password && this.cfg.salt); }
  createRequest(i: { orderNumber: string; amountPkr: number; reference: string; returnUrl: string }, now = new Date()): GatewayRequest {
    const f: Record<string, string> = {
      pp_Version: '1.1', pp_TxnType: 'MWALLET', pp_Language: 'EN', pp_MerchantID: this.cfg.merchantId!, pp_Password: this.cfg.password!, pp_TxnRefNo: i.reference,
      pp_Amount: String(Math.round(i.amountPkr * 100)), pp_TxnCurrency: 'PKR', pp_TxnDateTime: pkTimestamp(now), pp_BillReference: i.orderNumber.replace(/-/g, ''),
      pp_Description: `BREWORA ${i.orderNumber}`, pp_TxnExpiryDateTime: pkTimestamp(new Date(now.getTime() + 24 * 3600e3)), pp_ReturnURL: i.returnUrl,
    };
    f.pp_SecureHash = jazzSecureHash(f, this.cfg.salt!);
    return { url: this.cfg.baseUrl, httpMethod: 'POST', fields: f };
  }
  parseCallback(p: Record<string, string>): GatewayCallbackResult {
    return { authentic: verifyJazz(p, this.cfg.salt!), reference: p.pp_TxnRefNo, amountPkr: Number(p.pp_Amount) / 100, success: p.pp_ResponseCode === '000', raw: p };
  }
}
export class EasyPaisaGateway implements PaymentGateway {
  readonly method = 'EasyPaisa' as const; readonly callbackPath = 'easypaisa';
  constructor(private cfg: { storeId?: string; hashKey?: string; baseUrl: string }) {}
  isConfigured() { return !!(this.cfg.storeId && this.cfg.hashKey); }
  createRequest(i: { orderNumber: string; amountPkr: number; reference: string; returnUrl: string }): GatewayRequest {
    const f: Record<string, string> = { storeId: this.cfg.storeId!, amount: i.amountPkr.toFixed(1), orderRefNum: i.reference, postBackURL: i.returnUrl, paymentMethod: 'InitialRequest' };
    return { url: this.cfg.baseUrl, httpMethod: 'POST', fields: { ...f, merchantHashedReq: easypaisaHash(f, this.cfg.hashKey!) } };
  }
  parseCallback(p: Record<string, string>): GatewayCallbackResult {
    return { authentic: verifyEasypaisa(p, this.cfg.hashKey!), reference: p.orderRefNum, amountPkr: Number(p.amount), success: p.paymentStatus === 'PAID' || p.status === 'success', raw: p };
  }
}
