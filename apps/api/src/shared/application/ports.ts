import { Role } from '../domain/types';
export interface Mailer { /** Never throws: e-mail failure must not break business flows. */ send(to: string, subject: string, html: string): Promise<boolean> }
export interface PasswordHasher { hash(plain: string): Promise<string>; compare(plain: string, hash: string): Promise<boolean> }
export interface TokenService {
  issueAccessToken(u: { id: string; role: Role }): string;
  issueRefreshToken(userId: string): string;
  verifyAccessToken(t: string): { userId: string; role: Role } | null;
  verifyRefreshToken(t: string): { userId: string } | null;
  generateOpaqueToken(): string;
  /** 6-digit one-time code from a CSPRNG. */
  generateOtp(): string;
  fingerprint(value: string): string;
}
export interface Notifier {
  toAdmins(n: { title: string; message?: string; type?: string; link?: string }): Promise<void>;
  toUser(userId: string, n: { title: string; message?: string; type?: string; link?: string }): Promise<void>;
}
export interface AppConfig { customerUrl: string; apiUrl: string }
