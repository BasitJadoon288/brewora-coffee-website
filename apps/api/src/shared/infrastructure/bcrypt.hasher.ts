import bcrypt from 'bcryptjs';
import { PasswordHasher } from '../application/ports';
export class BcryptHasher implements PasswordHasher {
  constructor(private rounds = 12) {}
  hash(plain: string) { return bcrypt.hash(plain, this.rounds); }
  compare(plain: string, hash: string) { return bcrypt.compare(plain, hash); }
}
