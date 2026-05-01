import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * POST /api/dba/assessments/finalize
 * Rondt de eenmalige check af: zet credit_used = true op de one_time_purchase
 * van de ingelogde gebruiker. Na deze actie zijn geen nieuwe heranalyses meer
 * mogelijk voor deze check.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('one_time_purchases')
    .update({ credit_used: true })
    .eq('user_id', user.id)
    .eq('status', 'purchased')
    .eq('credit_used', false)

  if (error) {
    console.error('[finalize] Fout bij afronden check:', error)
    return NextResponse.json({ error: 'Afronden mislukt' }, { status: 500 })
  }

  return NextResponse.json({ finalized: true })
}
