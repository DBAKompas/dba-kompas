import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStaffelStatus } from '@/lib/referral/staffel'

/**
 * GET /api/referral/staffel
 * Read-only staffel-status voor de ingelogde gebruiker.
 * Wordt gebruikt door de StaffelTracker-widget op het dashboard.
 *
 * Response 200:
 *   {
 *     startedAt:        string | null   ISO van eerste succesvolle referral
 *     expiresAt:        string | null   ISO einde 60-daagse window
 *     successfulCount:  number          aantal qualified referrals in window
 *     highestMilestone: number          hoogste behaalde mijlpaal (0/1/3/5)
 *     nextMilestone:    number | null   volgende te halen mijlpaal
 *     daysRemaining:    number          dagen tot expiresAt (0 als verlopen)
 *   }
 *
 * Response 401: niet ingelogd
 * Response 500: onverwachte fout
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const status = await getStaffelStatus(user.id)
    return NextResponse.json(status)
  } catch (err) {
    console.error('[referral/staffel] Fout:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
