import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Run queries in parallel
    const [newsResult, notificationsResult, assessmentsResult, dbaProofResult] = await Promise.all([
      // Count new news items
      supabase
        .from('news_items')
        .select('id', { count: 'exact', head: true })
        .eq('is_new', true),

      // Count unread notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),

      // Count total assessments
      supabase
        .from('dba_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),

      // Count low-risk assessments (dba proof)
      supabase
        .from('dba_assessments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('overall_risk_label', 'laag'),
    ])

    return NextResponse.json({
      newUpdates: newsResult.count ?? 0,
      unreadNotifications: notificationsResult.count ?? 0,
      totalAssessments: assessmentsResult.count ?? 0,
      dbaProofCount: dbaProofResult.count ?? 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
