import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendAlertEmail, type AlertSeverity } from '@/lib/admin/alerts'

/**
 * Vercel Cron Job endpoint: pending-alerts mail-worker (KI-022 fix).
 * Schedule: elke 5 minuten.
 *
 * Reden:
 *   Sommige admin_alerts rijen worden direct via een Postgres-trigger
 *   aangemaakt (bijv. de 'admin_promoted' trigger op profiles). Die
 *   triggers omzeilen lib/admin/alerts.ts :: createAlert() en zetten
 *   daarom nooit een Postmark-mail uit. Deze worker pikt dat op:
 *     - pak admin_alerts met email_sent = false
 *     - alleen severity 'critical' (mail-waardig)
 *     - alleen recent (< 1 uur) om oude ruis te negeren
 *     - cap op 10 per run om mail-spam bij spikes te voorkomen
 *     - na succes: email_sent = true voor idempotentie
 */

const MAX_PER_RUN = 10
const MAX_AGE_HOURS = 1

export async function GET(request: Request) {
  // Cron secret Bearer auth (zelfde patroon als andere crons)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  let processed = 0
  let mailed = 0
  let mailFailed = 0
  const errors: string[] = []

  try {
    const cutoff = new Date(
      Date.now() - MAX_AGE_HOURS * 3600 * 1000,
    ).toISOString()

    const { data: pending, error: queryError } = await supabaseAdmin
      .from('admin_alerts')
      .select('id, type, severity, title, message, metadata, created_at')
      .eq('email_sent', false)
      .eq('resolved', false)
      .eq('severity', 'critical')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(MAX_PER_RUN)

    if (queryError) {
      console.error('[cron/pending-alerts] query failed:', queryError.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({
        processed: 0,
        mailed: 0,
        mailFailed: 0,
        durationMs: Date.now() - startedAt,
      })
    }

    for (const alert of pending) {
      processed++
      try {
        const sent = await sendAlertEmail({
          title: alert.title,
          message: alert.message,
          severity: alert.severity as AlertSeverity,
          type: alert.type,
          metadata: (alert.metadata ?? {}) as Record<string, unknown>,
        })

        if (sent) {
          // Idempotentie: markeer als verstuurd. Bij DB-fout loggen,
          // want het mailtje is al de deur uit; dubbele mail is erger
          // dan hier raisen.
          const { error: updateError } = await supabaseAdmin
            .from('admin_alerts')
            .update({ email_sent: true })
            .eq('id', alert.id)

          if (updateError) {
            console.error(
              `[cron/pending-alerts] email_sent update mislukt voor ${alert.id}:`,
              updateError.message,
            )
            errors.push(alert.id)
          }
          mailed++
        } else {
          mailFailed++
          errors.push(alert.id)
        }
      } catch (itemError) {
        console.error(
          `[cron/pending-alerts] fout voor alert ${alert.id}:`,
          itemError,
        )
        mailFailed++
        errors.push(alert.id)
      }
    }

    return NextResponse.json({
      processed,
      mailed,
      mailFailed,
      durationMs: Date.now() - startedAt,
      ...(errors.length > 0 && { failedAlertIds: errors }),
    })
  } catch (error) {
    console.error('[cron/pending-alerts] onverwachte fout:', error)
    // Let op: geen createAlert hier aanroepen. Dat zou een
    // nieuwe rij schrijven die deze cron zelf weer moet mailen:
    // potentieel een loop. We vertrouwen op Vercel cron-logs
    // en Sentry voor monitoring van deze worker.
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
