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
}, { timestamps: true });
export const UserModel = model('User', userSchema);
