/**
 * In-Memory Sliding Window Rate Limiter for U.B.R Beverage Pre-Order
 * Zero external dependencies, runtime-agnostic (Node.js & Edge compatible).
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds to wait
}

interface RateLimitEntry {
  timestamps: number[];
  lastUpdated: number;
}

// Global in-memory storage across module reloads
const rateLimitStore = new Map<string, RateLimitEntry>();

// Safety threshold to avoid unbounded memory growth
const MAX_STORE_SIZE = 50000;

// Periodic cleanup of expired entries (every 3 minutes)
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      // If no activity in the last 10 minutes, delete key
      if (now - entry.lastUpdated > 10 * 60 * 1000) {
        rateLimitStore.delete(key);
      }
    }
  }, 3 * 60 * 1000);

  // Prevent timer from keeping Node process alive if exiting
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check rate limit for a specific key using sliding window algorithm.
 *
 * @param key Unique identifier (e.g. `login:192.168.1.1` or `cart:cus_001`)
 * @param limit Maximum number of requests allowed in window
 * @param windowMs Window duration in milliseconds (e.g. 60000 for 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = rateLimitStore.get(key);

  if (!entry) {
    if (rateLimitStore.size >= MAX_STORE_SIZE) {
      // Evict oldest 10% of entries if store gets too large
      let count = 0;
      for (const k of rateLimitStore.keys()) {
        rateLimitStore.delete(k);
        count++;
        if (count > MAX_STORE_SIZE * 0.1) break;
      }
    }

    entry = { timestamps: [], lastUpdated: now };
    rateLimitStore.set(key, entry);
  }

  entry.lastUpdated = now;

  // Filter out timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= limit) {
    // Rate limit exceeded
    const oldestTimestamp = entry.timestamps[0];
    const resetTimeMs = oldestTimestamp + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
    const resetTime = Math.ceil(resetTimeMs / 1000);

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime,
      retryAfter,
    };
  }

  // Request is allowed
  entry.timestamps.push(now);
  const remaining = Math.max(0, limit - entry.timestamps.length);
  const oldestTimestamp = entry.timestamps[0];
  const resetTime = Math.ceil((oldestTimestamp + windowMs) / 1000);

  return {
    allowed: true,
    limit,
    remaining,
    resetTime,
    retryAfter: 0,
  };
}

/**
 * Extract client IP address from standard and reverse proxy headers.
 */
export function extractClientIp(headers: Headers): string {
  // 1. Standard Reverse Proxy Header (IIS, Cloudflare, Nginx, AWS ALB)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Format: "client, proxy1, proxy2" -> take the first one
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  // 2. Direct proxy headers
  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  const clientIp = headers.get('x-client-ip');
  if (clientIp && clientIp.trim()) return clientIp.trim();

  // 3. Fallback
  return '127.0.0.1';
}

/**
 * Safely extract customer ID from token without cryptographic verification
 * (Verification happens in route handlers; here we only need customerId as partition key).
 */
export function extractCustomerIdFromToken(token?: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr =
      typeof Buffer !== 'undefined'
        ? Buffer.from(base64, 'base64').toString('utf-8')
        : atob(base64);
    const data = JSON.parse(jsonStr);
    return data?.customerId || null;
  } catch {
    return null;
  }
}

/**
 * Clear all rate limit records (useful for testing or administrative resets).
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
