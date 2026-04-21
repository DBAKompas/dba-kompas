import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserQuotaPlan } from '@/modules/billing/entitlements'
import { getUsageForUser } from '@/modules/usage/check-quota'

/**
 * GET /api/usage
 *
 * Retourneert de huidige verbruiksstand voor de UsageMeter op
 * het dashboard. Read-only, muteert niets.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = await getUserQuotaPlan(user.id)
  const snapshot = await getUsageForUser(user.id, plan)
  return NextResponse.json(snapshot)
}
