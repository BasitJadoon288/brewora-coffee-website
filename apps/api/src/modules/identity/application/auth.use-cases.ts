import { AppConfig, Mailer, PasswordHasher, TokenService } from '../../../shared/application/ports';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/domain/errors';
import crypto from 'crypto';
import { resetPasswordMail, verifyEmailMail } from '../../../shared/application/email-templates';
import { OtpPurpose, User, UserRepository } from '../domain/user';
import { ProofInput, RegisterInput, UpdateProfileInput } from './auth.dto';

export interface AuthResult { user: User; accessToken: string; refreshToken: string }

export class SessionIssuer {
  constructor(private users: UserRepository, private tokens: TokenService) {}
  async start(user: User): Promise<AuthResult> {
    const accessToken = this.tokens.issueAccessToken({ id: user.id, role: user.role });
    const refreshToken = this.tokens.issueRefreshToken(user.id);
    await this.users.setRefreshFingerprint(user.id, this.tokens.fingerprint(refreshToken)); // only a hash is stored
    return { user, accessToken, refreshToken };
  }
}
export const OTP_MINUTES = 10; const OTP_MAX_ATTEMPTS = 5; const OTP_RESEND_SECONDS = 60;
/** Issues, e-mails and checks 6-digit one-time codes. Codes are stored hashed (bound to the user id), expire, and lock after too many wrong tries. */
export class OtpService {
  constructor(private users: UserRepository, private tokens: TokenService) {}
  private hash(userId: string, otp: string) { return this.tokens.fingerprint(`${userId}:${otp}`); }
  async issue(userId: string, purpose: OtpPurpose) { const otp = this.tokens.generateOtp(); await this.users.setOtp(userId, purpose, this.hash(userId, otp), new Date(Date.now() + OTP_MINUTES * 60e3)); return otp; }
  /** True when a code was issued less than a minute ago (resend throttle). */
  async sentRecently(email: string, purpose: OtpPurpose) { const o = await this.users.getOtp(email, purpose); return !!o && Date.now() - (o.expires.getTime() - OTP_MINUTES * 60e3) < OTP_RESEND_SECONDS * 1000; }
  /** Returns the user id when the code is right (and consumes it); null otherwise. */
  async consume(email: string, purpose: OtpPurpose, otp: string): Promise<string | null> {
    const o = await this.users.getOtp(email.toLowerCase(), purpose);
    if (!o || o.expires.getTime() < Date.now() || o.attempts >= OTP_MAX_ATTEMPTS) return null;
    const given = Buffer.from(this.hash(o.userId, otp)); const stored = Buffer.from(o.hash);
    if (given.length !== stored.length || !crypto.timingSafeEqual(given, stored)) { await this.users.bumpOtpAttempts(o.userId, purpose); return null; }
    await this.users.clearOtp(o.userId, purpose); return o.userId;
  }
}
export class EmailVerificationSender {
  constructor(private users: UserRepository, private tokens: TokenService, private mailer: Mailer, private config: AppConfig, private otps: OtpService) {}
  async send(user: User) {
    const token = this.tokens.generateOpaqueToken();
    const [otp] = await Promise.all([this.otps.issue(user.id, 'verify'), this.users.setEmailVerifyToken(user.id, this.tokens.fingerprint(token))]);
    const mail = verifyEmailMail({ name: user.fullName, otp, link: `${this.config.customerUrl}/verify-email?token=${token}`, minutes: OTP_MINUTES });
    await this.mailer.send(user.email, mail.subject, mail.html);
  }
}
export class RegisterUser {
  constructor(private users: UserRepository, private hasher: PasswordHasher, private sessions: SessionIssuer, private verification: EmailVerificationSender) {}
  async execute(i: RegisterInput): Promise<AuthResult> {
    const email = i.email.toLowerCase();
    if (await this.users.existsByEmail(email)) throw new ConflictError('Email already registered');
    const user = await this.users.create({ fullName: i.fullName, email, phoneNumber: i.phoneNumber, passwordHash: await this.hasher.hash(i.password), role: 'Customer' });
    void this.verification.send(user).catch(() => undefined);
    return this.sessions.start(user);
  }
}
export class LoginUser {
  constructor(private users: UserRepository, private hasher: PasswordHasher, private sessions: SessionIssuer) {}
  async execute(email: string, password: string): Promise<AuthResult> {
    const c = await this.users.getCredentialsByEmail(email.toLowerCase());
    if (!c || !(await this.hasher.compare(password, c.passwordHash))) throw new UnauthorizedError('Invalid email or password'); // same message for both cases
    if (!c.user.isActive) throw new ForbiddenError('Account deactivated');
    return this.sessions.start(c.user);
  }
}
/** Rotating refresh tokens with reuse detection: a stale token revokes the whole session. */
export class RefreshSession {
  constructor(private users: UserRepository, private tokens: TokenService, private sessions: SessionIssuer) {}
  async execute(token?: string) {
    if (!token) throw new UnauthorizedError('Missing refresh token');
    const v = this.tokens.verifyRefreshToken(token);
    if (!v) throw new UnauthorizedError('Invalid refresh token');
    const [user, stored] = await Promise.all([this.users.findById(v.userId), this.users.getRefreshFingerprint(v.userId)]);
    if (!user || !user.isActive || stored !== this.tokens.fingerprint(token)) {
      if (user) await this.users.setRefreshFingerprint(user.id, null);
      throw new UnauthorizedError('Refresh token rejected');
    }
    const { accessToken, refreshToken } = await this.sessions.start(user);
    return { accessToken, refreshToken };
  }
}
export class LogoutUser { constructor(private users: UserRepository) {} execute(userId: string) { return this.users.setRefreshFingerprint(userId, null); } }
export class RequestPasswordReset {
  constructor(private users: UserRepository, private tokens: TokenService, private mailer: Mailer, private config: AppConfig, private otps: OtpService) {}
  async execute(email: string) {
    const c = await this.users.getCredentialsByEmail(email.toLowerCase());
    if (!c || !c.user.isActive) return; // never reveal whether the email exists
    if (await this.otps.sentRecently(c.user.email, 'reset')) return; // throttle: at most one reset e-mail per minute
    const token = this.tokens.generateOpaqueToken();
    const [otp] = await Promise.all([this.otps.issue(c.user.id, 'reset'), this.users.setPasswordResetToken(c.user.id, this.tokens.fingerprint(token), new Date(Date.now() + OTP_MINUTES * 60e3))]);
    const mail = resetPasswordMail({ name: c.user.fullName, otp, link: `${this.config.customerUrl}/reset-password?token=${token}`, minutes: OTP_MINUTES });
    void this.mailer.send(c.user.email, mail.subject, mail.html);
  }
}
export class ResetPassword {
  constructor(private users: UserRepository, private tokens: TokenService, private hasher: PasswordHasher, private otps: OtpService) {}
  async execute(proof: ProofInput, password: string) {
    const id = proof.otp && proof.email ? await this.otps.consume(proof.email, 'reset', proof.otp) : proof.token ? await this.users.findIdByValidResetToken(this.tokens.fingerprint(proof.token), new Date()) : null;
    if (!id) throw new BadRequestError('Reset code is invalid or expired');
    await this.users.replacePassword(id, await this.hasher.hash(password)); // also clears reset tokens/codes and revokes sessions
  }
}
export class VerifyEmail {
  constructor(private users: UserRepository, private tokens: TokenService, private otps: OtpService) {}
  async execute(proof: ProofInput) {
    if (proof.otp && proof.email) {
      const id = await this.otps.consume(proof.email, 'verify', proof.otp); if (!id) throw new BadRequestError('Verification code is invalid or expired');
      await this.users.markEmailVerified(id); return;
    }
    if (!proof.token || !(await this.users.verifyEmailByToken(this.tokens.fingerprint(proof.token)))) throw new BadRequestError('Verification link is invalid');
  }
}
export class ResendVerification {
  constructor(private users: UserRepository, private sender: EmailVerificationSender, private otps: OtpService) {}
  async execute(userId: string) {
    const u = await this.users.findById(userId); if (!u) throw new NotFoundError('User not found');
    if (u.isEmailVerified) throw new BadRequestError('Email already verified');
    if (await this.otps.sentRecently(u.email, 'verify')) throw new BadRequestError('A code was sent a moment ago. Please wait a minute before requesting another.');
    await this.sender.send(u);
  }
}
export class ChangePassword {
  constructor(private users: UserRepository, private hasher: PasswordHasher) {}
  async execute(userId: string, current: string, next: string) {
    const hash = await this.users.getPasswordHash(userId);
    if (!hash || !(await this.hasher.compare(current, hash))) throw new BadRequestError('Current password is incorrect');
    await this.users.replacePassword(userId, await this.hasher.hash(next)); // also revokes sessions
  }
}
export class GetProfile { constructor(private users: UserRepository) {} async execute(id: string) { const u = await this.users.findById(id); if (!u) throw new NotFoundError('User not found'); return u; } }
export class UpdateProfile { constructor(private users: UserRepository) {} async execute(id: string, p: UpdateProfileInput) { const u = await this.users.updateProfile(id, p); if (!u) throw new NotFoundError('User not found'); return u; } }

export interface AuthUseCases {
  register: RegisterUser; login: LoginUser; refresh: RefreshSession; logout: LogoutUser; forgotPassword: RequestPasswordReset; resetPassword: ResetPassword;
  verifyEmail: VerifyEmail; resendVerification: ResendVerification; changePassword: ChangePassword; getProfile: GetProfile; updateProfile: UpdateProfile;
}
