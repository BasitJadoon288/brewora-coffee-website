import { AppConfig, Mailer, PasswordHasher, TokenService } from '../../../shared/application/ports';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/domain/errors';
import { escapeHtml } from '../../../shared/domain/text';
import { User, UserRepository } from '../domain/user';
import { RegisterInput, UpdateProfileInput } from './auth.dto';

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
export class EmailVerificationSender {
  constructor(private users: UserRepository, private tokens: TokenService, private mailer: Mailer, private config: AppConfig) {}
  async send(user: User) {
    const token = this.tokens.generateOpaqueToken();
    await this.users.setEmailVerifyToken(user.id, this.tokens.fingerprint(token));
    const link = `${this.config.customerUrl}/verify-email?token=${token}`;
    await this.mailer.send(user.email, 'Verify your BREWORA email', `<p>Hi ${escapeHtml(user.fullName)}, verify your email: <a href="${link}">${link}</a></p>`);
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
    const user = await this.users.findById(v.userId);
    const stored = await this.users.getRefreshFingerprint(v.userId);
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
  constructor(private users: UserRepository, private tokens: TokenService, private mailer: Mailer, private config: AppConfig) {}
  async execute(email: string) {
    const c = await this.users.getCredentialsByEmail(email.toLowerCase());
    if (!c || !c.user.isActive) return; // never reveal whether the email exists
    const token = this.tokens.generateOpaqueToken();
    await this.users.setPasswordResetToken(c.user.id, this.tokens.fingerprint(token), new Date(Date.now() + 3600e3));
    const link = `${this.config.customerUrl}/reset-password?token=${token}`;
    void this.mailer.send(c.user.email, 'Reset your BREWORA password', `<p>Reset link (valid 1 hour): <a href="${link}">${link}</a></p>`);
  }
}
export class ResetPassword {
  constructor(private users: UserRepository, private tokens: TokenService, private hasher: PasswordHasher) {}
  async execute(token: string, password: string) {
    const id = await this.users.findIdByValidResetToken(this.tokens.fingerprint(token), new Date());
    if (!id) throw new BadRequestError('Reset link is invalid or expired');
    await this.users.replacePassword(id, await this.hasher.hash(password));
  }
}
export class VerifyEmail {
  constructor(private users: UserRepository, private tokens: TokenService) {}
  async execute(token: string) { if (!(await this.users.verifyEmailByToken(this.tokens.fingerprint(token)))) throw new BadRequestError('Verification link is invalid'); }
}
export class ResendVerification {
  constructor(private users: UserRepository, private sender: EmailVerificationSender) {}
  async execute(userId: string) {
    const u = await this.users.findById(userId); if (!u) throw new NotFoundError('User not found');
    if (u.isEmailVerified) throw new BadRequestError('Email already verified');
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
