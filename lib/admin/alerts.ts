import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? 'marvinzoetemelk@gmail.com'

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertType =
  | 'payment_failed'
  | 'cron_failed'
  | 'analysis_error'
  | 'webhook_error'
  | 'referral_error'
  | 'general'

interface CreateAlertParams {
  type: AlertType
  severity?: AlertSeverity
  title: string
  message: string
  metadata?: Record<string, unknown>
  sendMail?: boolean
}

/**
 * Slaat een alert op in de database en stuurt optioneel een e-mail.
 * Gooit nooit een fout terug - logging via console.error als fallback.
 */
export async function createAlert(params: CreateAlertParams): Promise<void> {
  const {
    type,
    severity = 'warning',
    title,
    message,
    metadata = {},
    sendMail = severity === 'critical',
  } = params

  try {
    const { data: alert, error } = await supabaseAdmin
      .from('admin_alerts')
      .insert({
        type,
        severity,
        title,
        message,
        metadata,
        email_sent: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[alerts] opslaan mislukt:', error.message)
      return
    }

    if (sendMail) {
      const sent = await sendAlertEmail({ title, message, severity, type, metadata })
      if (sent && alert?.id) {
        await supabaseAdmin
          .from('admin_alerts')
          .update({ email_sent: true })
          .eq('id', alert.id)
      }
    }
  } catch (err) {
    console.error('[alerts] onverwachte fout:', err)
  }
}

/**
 * Stuurt een plain-text alert-mail naar het admin-adres via Postmark.
 */
export async function sendAlertEmail(params: {
  title: string
  message: string
  severity: AlertSeverity
  type: string
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  const { title, message, severity, type, metadata } = params

  const severityLabel =
    severity === 'critical' ? 'KRITIEK' : severity === 'warning' ? 'Waarschuwing' : 'Info'

  const metaText =
    metadata && Object.keys(metadata).length > 0
      ? '\n\nDetails:\n' +
        Object.entries(metadata)
          .map(([k, v]) => `  ${k}: ${String(v)}`)
          .join('\n')
      : ''

  const text = `DBA Kompas - ${severityLabel}

Type: ${type}
Ernst: ${severityLabel}
Tijdstip: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}

${title}

${message}${metaText}

Bekijk en verwerk deze alert via de Control Tower:
https://dbakompas.nl/admin
`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a;margin:0;padding:0;background:#f5f5f5;">
<div style="max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:${severity === 'critical' ? '#b91c1c' : severity === 'warning' ? '#b45309' : '#1d4ed8'};color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
    <div style="font-size:13px;opacity:0.85;margin-bottom:4px;">DBA Kompas - Systeemmelding</div>
    <div style="font-size:20px;font-weight:700;">${severityLabel}: ${title}</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    <p style="margin:0 0 16px;">${message}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#4b5563;">
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;width:120px;font-weight:600;">Type</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${type}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;font-weight:600;">Ernst</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${severityLabel}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-weight:600;">Tijdstip</td>
        <td style="padding:6px 0;">${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</td>
      </tr>
      ${metadata && Object.keys(metadata).length > 0
        ? Object.entries(metadata)
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;font-weight:600;">${k}</td><td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${String(v)}</td></tr>`
            )
            .join('')
        : ''
      }
    </table>
    <div style="margin-top:24px;">
      <a href="https://dbakompas.nl/admin" style="display:inline-block;background:#1e3a5f;color:#fff;padding:11px 22px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Open Control Tower</a>
    </div>
  </div>
</div>
</body>
</html>`

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[DBA Kompas] ${severityLabel}: ${title}`,
    text,
    html,
  })
}

/**
 * Markeert een alert als opgelost.
 */
export async function resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('admin_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      ...(resolvedBy ? { resolved_by: resolvedBy } : {}),
    })
    .eq('id', alertId)

  if (error) {
    console.error('[alerts] oplossen mislukt:', error.message)
    return false
  }
  return true
}

// ============================================================
// INFRA-002 vervolg: event-logging + threshold-alerts
// ============================================================

const QUOTA_ABUSE_THRESHOLD = 10          // aantal 429's per user
const QUOTA_ABUSE_WINDOW_HOURS = 24       // binnen 24 uur
const ANALYSIS_ERROR_THRESHOLD = 3        // opeenvolgende fouten per user
const ANALYSIS_ERROR_WINDOW_HOURS = 1     // binnen 1 uur
const ALERT_MAIL_THROTTLE_HOURS = 24      // per (type + user_id) max 1 mail per 24u

/**
 * Check of er recent een niet-opgeloste alert van hetzelfde type
 * voor dezelfde user bestaat. Gebruikt om mail-spam te voorkomen
 * zonder detectie zelf te onderdrukken.
 */
async function hasRecentOpenAlert(type: AlertType, userId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - ALERT_MAIL_THROTTLE_HOURS * 3600 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('admin_alerts')
    .select('id')
    .eq('type', type)
    .eq('resolved', false)
    .contains('metadata', { user_id: userId })
    .gte('created_at', cutoff)
    .limit(1)

  if (error) {
    console.error('[alerts] throttle-check mislukt:', error.message)
    return false
  }
  return (data?.length ?? 0) > 0
}

/**
 * Registreert een quota-weigering (429) als event en triggert een
 * alert zodra de threshold overschreden wordt.
 * Nooit throwing - silent fallback bij DB-fouten.
 */
export async function recordQuotaDenial(params: {
  userId: string
  plan: string
  used: number
  limit: number
}): Promise<void> {
  const { userId, plan, used, limit } = params
  try {
    const { error: insertError } = await supabaseAdmin
      .from('alert_events')
      .insert({
        event_type: 'quota_denied',
        user_id: userId,
        metadata: { plan, used, limit },
      })
    if (insertError) {
      console.error('[alerts] quota_denied event insert mislukt:', insertError.message)
      return
    }

    // Threshold-check
    const windowCutoff = new Date(
      Date.now() - QUOTA_ABUSE_WINDOW_HOURS * 3600 * 1000,
    ).toISOString()
    const { count, error: countError } = await supabaseAdmin
      .from('alert_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'quota_denied')
      .eq('user_id', userId)
      .gte('occurred_at', windowCutoff)

    if (countError) {
      console.error('[alerts] quota_denied count mislukt:', countError.message)
      return
    }

    const denials = count ?? 0
    if (denials < QUOTA_ABUSE_THRESHOLD) return

    if (await hasRecentOpenAlert('general', userId)) return

    await createAlert({
      type: 'general',
      severity: 'warning',
      title: 'Verdacht quota-gedrag',
      message:
        `Gebruiker ${userId} ontving ${denials} quota-weigeringen in de laatste ${QUOTA_ABUSE_WINDOW_HOURS} uur. ` +
        `Mogelijk misbruik of een gedeeld account. Controleer via de Control Tower.`,
      metadata: {
        user_id: userId,
        plan,
        denials_last_24h: denials,
        threshold: QUOTA_ABUSE_THRESHOLD,
      },
      sendMail: true,
    })
  } catch (err) {
    console.error('[alerts] recordQuotaDenial onverwachte fout:', err)
  }
}

/**
 * Registreert een AI-analyse-fout als event en triggert een alert
 * zodra er N opeenvolgende fouten per user zijn binnen het venster.
 */
export async function recordAnalysisError(params: {
  userId: string
  stage: 'ai_call' | 'db_insert' | 'unexpected'
  errorMessage: string
}): Promise<void> {
  const { userId, stage, errorMessage } = params
  try {
    const { error: insertError } = await supabaseAdmin
      .from('alert_events')
      .insert({
        event_type: 'analysis_error',
        user_id: userId,
        metadata: {
          stage,
          // voorkom PII en te grote payloads: max 500 chars van errormelding
          error: errorMessage.slice(0, 500),
        },
      })
    if (insertError) {
      console.error('[alerts] analysis_error event insert mislukt:', insertError.message)
      return
    }

    const windowCutoff = new Date(
      Date.now() - ANALYSIS_ERROR_WINDOW_HOURS * 3600 * 1000,
    ).toISOString()
    const { count, error: countError } = await supabaseAdmin
      .from('alert_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'analysis_error')
      .eq('user_id', userId)
      .gte('occurred_at', windowCutoff)

    if (countError) {
      console.error('[alerts] analysis_error count mislukt:', countError.message)
      return
    }

    const errors = count ?? 0
    if (errors < ANALYSIS_ERROR_THRESHOLD) return

    if (await hasRecentOpenAlert('analysis_error', userId)) return

    await createAlert({
      type: 'analysis_error',
      severity: 'critical',
      title: 'Herhaalde AI-analyse fouten',
      message:
        `Gebruiker ${userId} kreeg ${errors} analyse-fouten binnen ${ANALYSIS_ERROR_WINDOW_HOURS} uur. ` +
        `Laatste stage: ${stage}. Onderzoek model-uitval, input-problemen of prompt-regressie.`,
      metadata: {
        user_id: userId,
        stage,
        errors_last_hour: errors,
        threshold: ANALYSIS_ERROR_THRESHOLD,
      },
      sendMail: true,
    })
  } catch (err) {
    console.error('[alerts] recordAnalysisError onverwachte fout:', err)
  }
}
