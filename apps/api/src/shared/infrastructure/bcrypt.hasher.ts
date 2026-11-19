import bcryptjs from 'bcryptjs';
import { PasswordHasher } from '../application/ports';
/**
 * bcrypt is CPU-heavy (~250 ms at cost 12). The pure-JS `bcryptjs` runs that on the event loop and blocks EVERY other request meanwhile;
 * the native `bcrypt` addon runs it on the libuv thread pool. We use the native module when it is installed (optionalDependency) and
 * fall back to bcryptjs otherwise. Both produce/verify the same $2a/$2b hashes, so existing passwords keep working.
 */
type Impl = { hash(p: string, r: number): Promise<string>; compare(p: string, h: string): Promise<boolean> };
const impl: Impl = (() => { try { return require('bcrypt') as Impl; } catch { return bcryptjs as unknown as Impl; } })();
export class BcryptHasher implements PasswordHasher {
  constructor(private rounds = 12) {}
  hash(plain: string) { return impl.hash(plain, this.rounds); }
  compare(plain: string, hash: string) { return impl.compare(plain, hash); }
}
