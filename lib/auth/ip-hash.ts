import { createHash } from 'node:crypto'

/** Extracts the client IP from request headers. */
export function extractIp(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() ?? null
  return request.headers.get('x-real-ip')
}

/** One-way hashes an IP address with a salt for storage. Returns null if ip is null. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.REFERRAL_IP_HASH_SALT ?? 'dba-kompas-default-salt'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}
