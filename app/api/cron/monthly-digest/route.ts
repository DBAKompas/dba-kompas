import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendMonthlyDigest } from '@/lib/email'

/**
 * Vercel Cron Job endpoint — maandelijkse digest.
 * Schedule: elke 1e van de maand om 07:00 UTC (09:00 CET / 09:00 CEST).
 *
 * Vercel stuurt automatisch de Authorization-header met de CRON_SECRET.
 * Zonder geldige secret wordt het verzoek afgewezen.
 */
export async function GET(request: Request) {
  // Verifieer cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Digest is uitgeschakeld totdat DIGEST_ENABLED=true is ingesteld in Vercel
  if (process.env.DIGEST_ENABLED !== 'true') {
    console.log('[cron/monthly-digest] overgeslagen — DIGEST_ENABLED is niet ingesteld op true')
    return NextResponse.json({ skipped: true, reason: 'DIGEST_ENABLED is not true' })
  }

  const startedAt = Date.now()
  let sent = 0
  let failed = 0
  const errors: string[] = []

  try {
    // Haal alle actieve abonnees op via admin client (bypast RLS)
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .in('status', ['active', 'trialing'])

    if (subError) {
      console.error('[cron/monthly-digest] subscriptions query failed:', subError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[cron/monthly-digest] geen actieve abonnees gevonden')
      return NextResponse.json({ sent: 0, failed: 0, durationMs: Date.now() - startedAt })
    }

    // Haal recente nieuwsitems op (gedeeld voor alle gebruikers)
    const { data: newsItems } = await supabaseAdmin
      .from('news_items')
      .select('title, summary, impact, category')
      .order('created_at', { ascending: false })
      .limit(5)

    // Stuur digest naar elke actieve abonnee
    for (const sub of subscriptions) {
      const userId = sub.user_id

      try {
        // Haal gebruikersprofiel op
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single()

        if (!profile?.email) {
          console.warn(`[cron/monthly-digest] geen email voor user ${userId}`)
          failed++
          continue
        }

        // Haal analyse-samenvatting op
        const [totalResult, lowRiskResult] = await Promise.all([
          supabaseAdmin
            .from('dba_assessments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabaseAdmin
            .from('dba_assessments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('overall_risk_label', 'laag'),
        ])

        const processed = totalResult.count ?? 0
        const compliant = lowRiskResult.count ?? 0
        const warnings = processed - compliant

        // Haal ongelezen notificaties op
        const { data: notifications } = await supabaseAdmin
          .from('notifications')
          .select('title, message')
          .eq('user_id', userId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(3)

        await sendMonthlyDigest(profile.email, {
          newsItems: newsItems ?? [],
          documentsSummary: { processed, compliant, warnings },
          notifications: notifications ?? [],
          userProfile: { name: profile.full_name ?? profile.email },
        })

        sent++
      } catch (userError) {
        console.error(`[cron/monthly-digest] fout voor user ${userId}:`, userError)
        errors.push(userId)
        failed++
      }
    }

    const duration = Date.now() - startedAt
    console.log(`[cron/monthly-digest] klaar in ${duration}ms — verstuurd: ${sent}, mislukt: ${failed}`)

    return NextResponse.json({
      sent,
      failed,
      durationMs: duration,
      ...(errors.length > 0 && { failedUserIds: errors }),
    })
  } catch (error) {
    console.error('[cron/monthly-digest] onverwachte fout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
