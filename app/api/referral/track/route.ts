import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackReferral } from '@/lib/referral/engine'
import { extractIp, hashIp } from '@/lib/auth/ip-hash'

/**
 * POST /api/referral/track
 * Koppelt een referral code (uit cookie) aan de ingelogde gebruiker.
 * Wordt aangeroepen direct na registratie/login als er een dba_ref cookie is.
 *
 * Body: { referralCode: string }
 *
 * Response statuses:
 *   200 ok                  geslaagd, body bevat redemptionKind
 *   400 bad request         missende of zelf-referral
 *   401 unauthorized        geen ingelogde gebruiker
 *   404 not found           code bestaat niet
 *   409 conflict            code reeds gebruikt of gebruiker al gekoppeld
 *   410 gone                code is verlopen
 *   500 server error        onverwachte fout
 */


export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { referralCode } = await request.json()
    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'referralCode is required' }, { status: 400 })
    }

    const result = await trackReferral({
      referredUserId: user.id,
      referralCode,
      redeemerEmail: user.email ?? null,
      redeemerIpHash: hashIp(extractIp(request)),
    })

    if (result.ok) {
      return NextResponse.json({ ok: true, redemptionKind: result.redemptionKind })
    }

    switch (result.reason) {
      case 'not_found':
        return NextResponse.json({ error: 'referral_code_not_found' }, { status: 404 })
      case 'expired':
        return NextResponse.json({ error: 'referral_code_expired' }, { status: 410 })
      case 'already_used':
        return NextResponse.json({ error: 'referral_code_already_used' }, { status: 409 })
      case 'self_referral':
        return NextResponse.json({ error: 'self_referral_not_allowed' }, { status: 400 })
      case 'already_tracked':
        return NextResponse.json({ error: 'user_already_has_referral' }, { status: 409 })
      case 'insert_failed':
      case 'update_failed':
        return NextResponse.json({ error: result.reason }, { status: 500 })
      default:
        return NextResponse.json({ error: 'unknown' }, { status: 500 })
    }
  } catch (err) {
    console.error('[referral/track] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
