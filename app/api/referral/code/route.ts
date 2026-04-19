import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReferralStats } from '@/lib/referral/engine'

/**
 * GET /api/referral/code
 * Haalt de referral code + statistieken op voor de ingelogde gebruiker.
 * Maakt een code aan als die nog niet bestaat.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const stats = await getReferralStats(user.id)
    return NextResponse.json(stats)
  } catch (err) {
    console.error('[referral/code] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
