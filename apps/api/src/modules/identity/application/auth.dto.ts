import { z } from 'zod';
const password = z.string().min(8).max(72).regex(/[A-Z]/, 'Needs an uppercase letter').regex(/[0-9]/, 'Needs a number');
const phone = z.string().regex(/^(\+92|0)3\d{9}$/, 'Invalid Pakistani mobile number');
export const registerDto = z.object({ fullName: z.string().min(2).max(100), email: z.string().email(), password, phoneNumber: phone.optional() });
export const loginDto = z.object({ email: z.string().email(), password: z.string().min(1) });
export const forgotPasswordDto = z.object({ email: z.string().email() });
const otp = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');
/** Either the e-mailed 6-digit code (with the e-mail address) or the legacy link token. */
const codeOrToken = { token: z.string().min(10).optional(), email: z.string().email().optional(), otp: otp.optional() };
const hasProof = (v: { token?: string; email?: string; otp?: string }) => !!v.token || (!!v.email && !!v.otp);
const proofMsg = { message: 'Provide the 6-digit code with your email, or a valid token' };
export const resetPasswordDto = z.object({ ...codeOrToken, password }).refine(hasProof, proofMsg);
export const verifyEmailDto = z.object(codeOrToken).refine(hasProof, proofMsg);
export const changePasswordDto = z.object({ currentPassword: z.string().min(1), newPassword: password });
export const updateProfileDto = z.object({ fullName: z.string().min(2).max(100).optional(), phoneNumber: phone.optional() });
export type ProofInput = { token?: string; email?: string; otp?: string };
export type RegisterInput = z.infer<typeof registerDto>;
export type UpdateProfileInput = z.infer<typeof updateProfileDto>;
