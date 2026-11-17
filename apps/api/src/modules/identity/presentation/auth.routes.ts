import { Router } from 'express';
import { AuthGuards, validate } from '../../../shared/presentation/http';
import * as D from '../application/auth.dto';
import { AuthController } from './auth.controller';
export function buildAuthRoutes(c: AuthController, g: AuthGuards) {
  const r = Router();
  r.post('/register', validate(D.registerDto), c.register);
  r.post('/login', validate(D.loginDto), c.login);
  r.post('/refresh-token', c.refresh);
  r.post('/logout', g.authenticate, c.logout);
  r.post('/forgot-password', validate(D.forgotPasswordDto), c.forgotPassword);
  r.post('/reset-password', validate(D.resetPasswordDto), c.resetPassword);
  r.post('/verify-email', validate(D.verifyEmailDto), c.verifyEmail);
  r.post('/resend-verification', g.authenticate, c.resendVerification);
  r.post('/change-password', g.authenticate, validate(D.changePasswordDto), c.changePassword);
  r.get('/profile', g.authenticate, c.getProfile);
  r.put('/profile', g.authenticate, validate(D.updateProfileDto), c.updateProfile);
  return r;
}
