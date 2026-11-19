import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { TokenService } from '../application/ports';
import { Role } from '../domain/types';
export class JwtTokenService implements TokenService {
  constructor(private accessSecret: string, private refreshSecret: string) {}
  issueAccessToken(u: { id: string; role: Role }) { return jwt.sign({ role: u.role }, this.accessSecret, { subject: u.id, expiresIn: 900 }); }
  issueRefreshToken(userId: string) { return jwt.sign({ jti: crypto.randomUUID() }, this.refreshSecret, { subject: userId, expiresIn: 7 * 86400 }); }
  verifyAccessToken(t: string) {
    try { const p = jwt.verify(t, this.accessSecret) as jwt.JwtPayload; return { userId: p.sub as string, role: p.role as Role }; } catch { return null; }
  }
  verifyRefreshToken(t: string) { try { return { userId: (jwt.verify(t, this.refreshSecret) as jwt.JwtPayload).sub as string }; } catch { return null; } }
  generateOtp() { return String(crypto.randomInt(100000, 1000000)); }
  generateOpaqueToken() { return crypto.randomBytes(32).toString('hex'); }
  fingerprint(v: string) { return crypto.createHash('sha256').update(v).digest('hex'); }
}
