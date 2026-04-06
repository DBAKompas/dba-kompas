import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find an active (purchased or in_progress) one-time entitlement that hasn't been used
    const { data: entitlement, error } = await supabase
      .from('one_time_purchases')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['purchased', 'in_progress'])
      .eq('credit_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !entitlement) {
      return NextResponse.json({ hasEntitlement: false, entitlement: null })
    }

    return NextResponse.json({ hasEntitlement: true, entitlement })
  } catch (error) {
    console.error('Entitlement check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
