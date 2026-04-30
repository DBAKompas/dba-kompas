import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserQuotaPlan } from '@/modules/billing/entitlements'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const quotaPlan = await getUserQuotaPlan(user.id)
  return NextResponse.json({ quotaPlan })
}
