import crypto from 'crypto';
import { UploadSigner } from '../application/upload';
/** Signed direct-upload params; the API secret never leaves the server. */
export class CloudinarySigner implements UploadSigner {
  constructor(private cfg: { cloudName?: string; apiKey?: string; apiSecret?: string }) {}
  isConfigured() { return !!(this.cfg.cloudName && this.cfg.apiKey && this.cfg.apiSecret); }
  sign(folder: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${this.cfg.apiSecret}`).digest('hex');
    return { cloudName: this.cfg.cloudName, apiKey: this.cfg.apiKey, timestamp, folder, signature, uploadUrl: `https://api.cloudinary.com/v1_1/${this.cfg.cloudName}/image/upload` };
  }
}
