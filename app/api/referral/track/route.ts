import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackReferral } from '@/lib/referral/engine'

/**
 * POST /api/referral/track
 * Koppelt een referral code (uit cookie) aan de ingelogde gebruiker.
 * Wordt aangeroepen direct na registratie/login als er een dba_ref cookie is.
 *
 * Body: { referralCode: string }
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

    await trackReferral({ referredUserId: user.id, referralCode })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[referral/track] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
