import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { entitlementId, assessmentId } = await request.json()

    if (!entitlementId) {
      return NextResponse.json({ error: 'entitlementId is required' }, { status: 400 })
    }

    // Verify the entitlement belongs to the user and is active
    const { data: entitlement, error: fetchError } = await supabase
      .from('one_time_purchases')
      .select('*')
      .eq('id', entitlementId)
      .eq('user_id', user.id)
      .in('status', ['purchased', 'in_progress'])
      .eq('credit_used', false)
      .single()

    if (fetchError || !entitlement) {
      return NextResponse.json({ error: 'No valid entitlement found' }, { status: 404 })
    }

    // Finalize the entitlement
    const { error: updateError } = await supabaseAdmin
      .from('one_time_purchases')
      .update({
        status: 'finalized',
        root_assessment_id: assessmentId || null,
        finalized_at: new Date().toISOString(),
        credit_used: true,
        credit_used_at: new Date().toISOString(),
      })
      .eq('id', entitlementId)

    if (updateError) {
      console.error('Failed to finalize entitlement:', updateError)
      return NextResponse.json({ error: 'Failed to finalize entitlement' }, { status: 500 })
    }

    // If an assessment was created, mark it with the one-time source
    if (assessmentId) {
      await supabaseAdmin
        .from('dba_assessments')
        .update({
          access_source: 'one_time',
          one_time_entitlement_id: entitlementId,
        })
        .eq('id', assessmentId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Finalize error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
