// inMemoryDb.ts
export type SetOptions = {
  /** Time-to-live in milliseconds (e.g. 3 hours = 3 * 60 * 60 * 1000). */
  ttlMs?: number;
};

type Entry<T> = {
  value: T;
  /** Epoch millis when the entry expires. If undefined, it never expires. */
  expiresAt?: number;
};

export class InMemoryDb<T> {
  private store = new Map<string, Entry<T>>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * @param cleanupIntervalMs If provided, runs periodic cleanup of expired keys.
   *                          Example: 60_000 (every minute).
   *                          If omitted, expiration is lazy (handled on get/set).
   */
  constructor(private readonly cleanupIntervalMs?: number) {
    if (cleanupIntervalMs != null) {
      this.startCleanupTimer(cleanupIntervalMs);
    }
  }

  /** Get a value. Returns undefined if missing or expired. */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set a value with optional TTL.
   * @param options.ttlMs If <= 0, the key is immediately removed.
   */
  set(key: string, value: T, options?: SetOptions): void {
    const ttlMs = options?.ttlMs;

    if (ttlMs != null) {
      if (!Number.isFinite(ttlMs)) {
        throw new Error(`ttlMs must be a finite number. Received: ${ttlMs}`);
      }
      if (ttlMs <= 0) {
        this.store.delete(key);
        return;
      }
    }

    const expiresAt =
      ttlMs == null ? undefined : Date.now() + Math.floor(ttlMs);

    this.store.set(key, { value, expiresAt });
  }

  /** Remove a key. Returns true if it existed. */
  remove(key: string): boolean {
    return this.store.delete(key);
  }

  /** Clear everything (including expired entries). */
  clearAll(): void {
    this.store.clear();
  }

  /** Optional: number of non-expired items (does a cleanup first). */
  size(): number {
    this.cleanupExpired();
    return this.store.size;
  }

  /** Optional: stop background cleanup if enabled. */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /** Optional: manually purge expired keys. */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt != null && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  private isExpired(entry: Entry<T>): boolean {
    return entry.expiresAt != null && entry.expiresAt <= Date.now();
  }

  private startCleanupTimer(intervalMs: number) {
    this.cleanupTimer = setInterval(() => this.cleanupExpired(), intervalMs);
    // Let Node exit even if the timer is running
    this.cleanupTimer.unref?.();
  }
}
