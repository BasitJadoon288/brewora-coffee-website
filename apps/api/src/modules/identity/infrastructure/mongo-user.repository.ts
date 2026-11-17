import { fromMongo, guard, oidOrNull } from '../../../shared/infrastructure/mongo';
import { NewUser, User, UserRepository } from '../domain/user';
import { UserModel } from './user.model';

const SECRETS = ['passwordHash', 'refreshTokenHash', 'resetTokenHash', 'resetTokenExpires', 'emailVerifyHash'];
/** Entities never carry credentials, whichever query produced the document. */
const toUser = (d: any): User => { const u = fromMongo<any>(d); for (const k of SECRETS) delete u[k]; return u as User; };
export class MongoUserRepository implements UserRepository {
  async findById(id: string) { const k = oidOrNull(id); return k ? ((d) => (d ? toUser(d) : null))(await UserModel.findById(k).lean()) : null; }
  async existsByEmail(email: string) { return !!(await UserModel.exists({ email })); }
  async create(d: NewUser) { const u = await guard(UserModel.create(d)); return toUser(u.toObject()); }
  async getCredentialsByEmail(email: string) {
    const d: any = await UserModel.findOne({ email }).select('+passwordHash').lean(); if (!d) return null;
    const { passwordHash, ...rest } = d; return { user: toUser(rest), passwordHash };
  }
  async getPasswordHash(id: string) { const k = oidOrNull(id); if (!k) return null; return ((await UserModel.findById(k).select('+passwordHash').lean()) as any)?.passwordHash ?? null; }
  async getRefreshFingerprint(id: string) { const k = oidOrNull(id); if (!k) return null; return ((await UserModel.findById(k).select('+refreshTokenHash').lean()) as any)?.refreshTokenHash ?? null; }
  async setRefreshFingerprint(id: string, fp: string | null) { await UserModel.updateOne({ _id: id }, fp ? { refreshTokenHash: fp } : { $unset: { refreshTokenHash: 1 } }); }
  async setPasswordResetToken(id: string, fp: string, expires: Date) { await UserModel.updateOne({ _id: id }, { resetTokenHash: fp, resetTokenExpires: expires }); }
  async findIdByValidResetToken(fp: string, now: Date) { const d: any = await UserModel.findOne({ resetTokenHash: fp, resetTokenExpires: { $gt: now } }).lean(); return d ? String(d._id) : null; }
  async replacePassword(id: string, passwordHash: string) { await UserModel.updateOne({ _id: id }, { passwordHash, $unset: { resetTokenHash: 1, resetTokenExpires: 1, refreshTokenHash: 1 } }); }
  async setEmailVerifyToken(id: string, fp: string) { await UserModel.updateOne({ _id: id }, { emailVerifyHash: fp }); }
  async verifyEmailByToken(fp: string) { const r = await UserModel.updateOne({ emailVerifyHash: fp }, { isEmailVerified: true, $unset: { emailVerifyHash: 1 } }); return r.modifiedCount > 0; }
  async updateProfile(id: string, patch: { fullName?: string; phoneNumber?: string }) { const k = oidOrNull(id); if (!k) return null; const d = await guard(UserModel.findByIdAndUpdate(k, patch, { new: true, runValidators: true }).lean()); return d ? toUser(d) : null; }
  async setCustomerActive(id: string, active: boolean) {
    const k = oidOrNull(id); if (!k) return null;
    const d = await UserModel.findOneAndUpdate({ _id: k, role: 'Customer' }, active ? { isActive: true } : { isActive: false, $unset: { refreshTokenHash: 1 } }, { new: true }).lean();
    return d ? toUser(d) : null;
  }
}
