import { NextResponse } from 'next/server'
import { redeemWelcomeLink } from '@/lib/onboarding/welcomeLink'
import { extractIp, hashIp } from '@/lib/auth/ip-hash'
import { rateLimit } from '@/lib/auth/rate-limit'
import { verifyTurnstile } from '@/lib/auth/turnstile'

export const dynamic = 'force-dynamic'

/**
 * POST /api/onboarding/welcome-link/redeem
 *
 * Publieke route. Maakt een account aan via een token-gebaseerde welcome-link.
 * Client logt daarna in via signInWithPassword.
 *
 * Body: { token, firstName, lastName, email, password, cfTurnstileToken }
 *
 * Alle responses zijn 200 of 429 om informatieleak te voorkomen.
 */
export async function POST(request: Request) {
  try {
    const ip = extractIp(request)
    const ipHash = hashIp(ip)

    const allowed = rateLimit(`welcome-redeem:${ipHash ?? 'unknown'}`, 5, 60_000)
    if (!allowed) {
      return NextResponse.json({ ok: false, reason: 'not_eligible' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, reason: 'not_eligible' })
    }

    const { token, firstName, lastName, email, password, cfTurnstileToken } = body as {
      token?: unknown
      firstName?: unknown
      lastName?: unknown
      email?: unknown
      password?: unknown
      cfTurnstileToken?: unknown
    }

    if (
      typeof token !== 'string' || !token ||
      typeof firstName !== 'string' || !firstName ||
      typeof lastName !== 'string' || !lastName ||
      typeof email !== 'string' || !email ||
      typeof password !== 'string' || !password
    ) {
      return NextResponse.json({ ok: false, reason: 'not_eligible' })
    }

    const turnstileOk = await verifyTurnstile(
      typeof cfTurnstileToken === 'string' ? cfTurnstileToken : null,
      ip ?? undefined,
    )
    if (!turnstileOk) {
      return NextResponse.json({ ok: false, reason: 'not_eligible' })
    }

    const result = await redeemWelcomeLink({
      token,
      firstName,
      lastName,
      email,
      password,
      redeemerIpHash: ipHash,
    })

    if (result.ok) {
      return NextResponse.json({ ok: true, email: result.email })
    }

    return NextResponse.json({ ok: false, reason: 'not_eligible' })
  } catch (err) {
    console.error('[onboarding/welcome-link/redeem] Fout:', err)
    return NextResponse.json({ ok: false, reason: 'not_eligible' })
  }
}
