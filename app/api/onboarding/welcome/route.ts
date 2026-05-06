import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redeemWelcomeOnboarding } from '@/lib/onboarding/welcome'
import { extractIp, hashIp } from '@/lib/auth/ip-hash'

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

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
