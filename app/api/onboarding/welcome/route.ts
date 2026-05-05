import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { redeemWelcomeOnboarding } from '@/lib/onboarding/welcome'

export const dynamic = 'force-dynamic'

/**
 * POST /api/onboarding/welcome
 *
 * Welcome-flow vanuit gedeelde LinkedIn-link. Maakt account aan, koppelt code,
 * en grant 1 gratis check in 1 transactioneel scenario. Geen e-mailbevestiging
 * tussendoor: client logt direct na success-response in via signInWithPassword.
 *
 * Body: { code, firstName, lastName, email, password }
 *
 * Response 200: { ok: true, email, freeCheckGranted }
 * Response 400: ongeldige input
 * Response 404: code niet gevonden
 * Response 409: code reeds gebruikt, e-mail al in gebruik, of code niet welcome-type
 * Response 410: code verlopen
 * Response 500: aanmaak of grant gefaald
 */

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  const salt = process.env.REFERRAL_IP_HASH_SALT ?? 'dba-kompas-default-salt'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

function extractIp(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() ?? null
  return request.headers.get('x-real-ip')
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
    }

    const { code, firstName, lastName, email, password } = body as {
      code?: string
      firstName?: string
      lastName?: string
      email?: string
      password?: string
    }

    if (!code || !firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 })
    }

    const result = await redeemWelcomeOnboarding({
      code,
      firstName,
      lastName,
      email,
      password,
      redeemerIpHash: hashIp(extractIp(request)),
    })

    if (result.ok) {
      return NextResponse.json({
        ok: true,
        email: result.email,
        freeCheckGranted: result.freeCheckGranted,
      })
    }

    const detail = 'detail' in result ? result.detail : undefined
    return NextResponse.json({ error: result.reason, detail }, { status: result.status })
  } catch (err) {
    console.error('[onboarding/welcome] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
