/**
 * In-memory sliding window rate limiter for security-sensitive endpoints:
 * - Gift password attempts (at least 10 attempts / 15 minutes)
 * - Registration attempts (5 attempts / 1 hour)
 * - Resend verification attempts (3 attempts / 5 minutes)
 */

interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export const DEFAULT_MAX_ATTEMPTS = 10;
export const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

export function checkRateLimit(
  key: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  if (record.attempts >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.attempts };
}

export function recordFailedAttempt(
  key: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS
): { remainingAttempts: number; isBlocked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { attempts: 1, resetAt: now + windowMs });
    return { remainingAttempts: maxAttempts - 1, isBlocked: false };
  }

  record.attempts += 1;
  if (record.attempts >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { remainingAttempts: 0, isBlocked: true, retryAfterSeconds };
  }

  return { remainingAttempts: maxAttempts - record.attempts, isBlocked: false };
}

export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}
