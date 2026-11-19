import { Schema, model } from 'mongoose';
const userSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phoneNumber: { type: String, trim: true },
  role: { type: String, enum: ['Admin', 'Customer'], default: 'Customer' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  refreshTokenHash: { type: String, select: false },
  resetTokenHash: { type: String, select: false }, resetTokenExpires: { type: Date, select: false },
  emailVerifyHash: { type: String, select: false },
  emailOtp: { type: new Schema({ hash: String, expires: Date, attempts: { type: Number, default: 0 } }, { _id: false }), select: false },
  resetOtp: { type: new Schema({ hash: String, expires: Date, attempts: { type: Number, default: 0 } }, { _id: false }), select: false },
}, { timestamps: true });
userSchema.index({ role: 1, createdAt: -1 }); // customer list / counts / latest customers
userSchema.index({ resetTokenHash: 1 }, { sparse: true }); // password-reset lookup was a collection scan
userSchema.index({ emailVerifyHash: 1 }, { sparse: true }); // e-mail verification lookup was a collection scan
export const UserModel = model('User', userSchema);
