// TODO follow-up: vervang door Upstash KV bij multi-instance Vercel.
const buckets = new Map<string, number[]>()

/**
 * In-memory token-bucket rate limiter.
 * Returns true if the request is allowed, false if the limit is exceeded.
 *
 * @param key       Unique bucket key (e.g. "welcome-redeem:<ipHash>")
 * @param limit     Maximum number of requests allowed within windowMs
 * @param windowMs  Rolling window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const arr = buckets.get(key) ?? []
  const fresh = arr.filter(t => now - t < windowMs)
  if (fresh.length >= limit) {
    buckets.set(key, fresh)
    return false
  }
  fresh.push(now)
  buckets.set(key, fresh)
  return true
}
