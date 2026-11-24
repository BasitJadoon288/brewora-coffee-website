import { CookieOptions } from 'express';
import { asyncHandler } from '../../../shared/presentation/http';
import { AuthUseCases } from '../application/auth.use-cases';

/** Admin panel and storefront keep separate sessions: each gets its own refresh cookie, chosen by ?portal=admin. */
const rtName = (req: { query: Record<string, unknown> }) => (req.query.portal === 'admin' ? 'rta' : 'rt');

export class AuthController {
  constructor(private uc: AuthUseCases, private cookie: CookieOptions) {}
  register = asyncHandler(async (req, res) => { const r = await this.uc.register.execute(req.body); res.cookie(rtName(req), r.refreshToken, this.cookie).status(201).json({ user: r.user, accessToken: r.accessToken }); });
  login = asyncHandler(async (req, res) => { const r = await this.uc.login.execute(req.body.email, req.body.password); res.cookie(rtName(req), r.refreshToken, this.cookie).json({ user: r.user, accessToken: r.accessToken }); });
  refresh = asyncHandler(async (req, res) => { const r = await this.uc.refresh.execute(req.cookies?.[rtName(req)]); res.cookie(rtName(req), r.refreshToken, this.cookie).json({ accessToken: r.accessToken }); });
  logout = asyncHandler(async (req, res) => { await this.uc.logout.execute(req.user!.id); res.clearCookie(rtName(req), { path: '/api/auth' }).status(204).end(); });
  forgotPassword = asyncHandler(async (req, res) => { await this.uc.forgotPassword.execute(req.body.email); res.json({ message: 'If that email exists, a 6-digit reset code has been sent' }); });
  resetPassword = asyncHandler(async (req, res) => { await this.uc.resetPassword.execute(req.body, req.body.password); res.json({ message: 'Password updated. Please log in.' }); });
  verifyEmail = asyncHandler(async (req, res) => { await this.uc.verifyEmail.execute(req.body); res.json({ message: 'Email verified' }); });
  resendVerification = asyncHandler(async (req, res) => { await this.uc.resendVerification.execute(req.user!.id); res.json({ message: 'Verification email sent' }); });
  changePassword = asyncHandler(async (req, res) => { await this.uc.changePassword.execute(req.user!.id, req.body.currentPassword, req.body.newPassword); res.clearCookie(rtName(req), { path: '/api/auth' }).json({ message: 'Password changed. Please log in again.' }); });
  getProfile = asyncHandler(async (req, res) => { res.json(await this.uc.getProfile.execute(req.user!.id)); });
  updateProfile = asyncHandler(async (req, res) => { res.json(await this.uc.updateProfile.execute(req.user!.id, req.body)); });
}
