import { Role } from '../../../shared/domain/types';
export interface User { id: string; fullName: string; email: string; phoneNumber?: string; role: Role; isActive: boolean; isEmailVerified: boolean; createdAt: Date; updatedAt: Date }
export interface NewUser { fullName: string; email: string; passwordHash: string; phoneNumber?: string; role: Role; isEmailVerified?: boolean }
export type OtpPurpose = 'verify' | 'reset';
export interface StoredOtp { userId: string; hash: string; expires: Date; attempts: number }
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(data: NewUser): Promise<User>;
  getCredentialsByEmail(email: string): Promise<{ user: User; passwordHash: string } | null>;
  getPasswordHash(userId: string): Promise<string | null>;
  getRefreshFingerprint(userId: string): Promise<string | null>;
  setRefreshFingerprint(userId: string, fingerprint: string | null): Promise<void>;
  setPasswordResetToken(userId: string, fingerprint: string, expires: Date): Promise<void>;
  findIdByValidResetToken(fingerprint: string, now: Date): Promise<string | null>;
  /** Sets the password and clears reset token + all sessions. */
  replacePassword(userId: string, passwordHash: string): Promise<void>;
  /** One-time codes (6 digits, stored hashed) for e-mail verification and password reset. */
  setOtp(userId: string, purpose: OtpPurpose, hash: string, expires: Date): Promise<void>;
  getOtp(email: string, purpose: OtpPurpose): Promise<StoredOtp | null>;
  bumpOtpAttempts(userId: string, purpose: OtpPurpose): Promise<void>;
  clearOtp(userId: string, purpose: OtpPurpose): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
  setEmailVerifyToken(userId: string, fingerprint: string): Promise<void>;
  verifyEmailByToken(fingerprint: string): Promise<boolean>;
  updateProfile(userId: string, patch: { fullName?: string; phoneNumber?: string }): Promise<User | null>;
  setCustomerActive(userId: string, active: boolean): Promise<User | null>;
}
