/**
 * Tiny in-process TTL cache with in-flight de-duplication.
 * Concurrent callers that miss the cache share ONE underlying promise (no thundering herd),
 * and failed loads are never cached.
 */
export class TtlCache<T> {
  private value?: { v: T; exp: number };
  private inflight?: Promise<T>;
  constructor(private ttlMs: number) {}
  async get(load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.value && this.value.exp > now) return this.value.v;
    this.inflight ??= load().then(
      v => { this.value = { v, exp: Date.now() + this.ttlMs }; this.inflight = undefined; return v; },
      e => { this.inflight = undefined; throw e; },
    );
    return this.inflight;
  }
  clear() { this.value = undefined; this.inflight = undefined; }
}
