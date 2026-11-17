export type ErrorKind = 'invalid' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'unavailable';
/** Framework-free errors. The presentation layer decides how each kind maps to a transport status. */
export class DomainError extends Error {
  constructor(public readonly kind: ErrorKind, message: string, public readonly details?: unknown) { super(message); this.name = new.target.name; }
}
export class BadRequestError extends DomainError { constructor(m: string, d?: unknown) { super('invalid', m, d); } }
export class UnauthorizedError extends DomainError { constructor(m = 'Authentication required') { super('unauthorized', m); } }
export class ForbiddenError extends DomainError { constructor(m = 'Forbidden') { super('forbidden', m); } }
export class NotFoundError extends DomainError { constructor(m = 'Not found') { super('not_found', m); } }
export class ConflictError extends DomainError { constructor(m: string, d?: unknown) { super('conflict', m, d); } }
export class ServiceUnavailableError extends DomainError { constructor(m: string) { super('unavailable', m); } }
