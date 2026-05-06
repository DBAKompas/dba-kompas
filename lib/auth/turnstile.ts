/**
 * Cloudflare Turnstile server-side verification.
 *
 * Roept https://challenges.cloudflare.com/turnstile/v0/siteverify aan met de
 * secret-key uit env. Fail-closed: bij ontbrekende env, ongeldige input,
 * netwerk- of timeoutfouten retourneert deze functie false.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const REQUEST_TIMEOUT_MS = 5000

export async function verifyTurnstile(
  token: string | undefined | null,
  ip: string | undefined,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    return false
  }
  if (!token || typeof token !== 'string') {
    return false
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const body = new URLSearchParams()
    body.set('secret', secret)
    body.set('response', token)
    if (ip) body.set('remoteip', ip)

    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) return false
    const json = (await res.json()) as { success?: boolean }
    return Boolean(json?.success)
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
