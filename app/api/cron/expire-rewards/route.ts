import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendRewardReminderEmail, sendRewardExpiredEmail, type RewardType } from '@/lib/email/rewards'
import { createAlert } from '@/lib/admin/alerts'

/**
 * Vercel Cron Job - dagelijkse afhandeling van reward verloop.
 *
 * Schedule: dagelijks om 08:00 UTC (10:00 CEST / 09:00 CET).
 *
 * Werking:
 *  1. Reminder: rewards waarvan expires_at <= now + 7 dagen en reminded_at IS NULL
 *     krijgen een reminder-mail. reminded_at wordt gezet.
 *  2. Expiry: rewards waarvan expires_at <= now en expired_at IS NULL
 *     worden verlopen. expired_at wordt gezet. Voor reward_type='free_check'
 *     wordt de bijbehorende one_time_purchases-rij op status='expired' gezet.
 *     De ontvanger krijgt een expiry-mail.
 *
 * Auth via CRON_SECRET (Vercel stuurt dit automatisch mee als Bearer token).
 */

const REMINDER_LEAD_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000

const KNOWN_REWARD_TYPES: ReadonlySet<RewardType> = new Set<RewardType>([
  'free_check',
  'month_discount',
  'two_month_discount',
])

function isKnownRewardType(value: string): value is RewardType {
  return KNOWN_REWARD_TYPES.has(value as RewardType)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  const now = new Date()
  const reminderCutoff = new Date(now.getTime() + REMINDER_LEAD_DAYS * MS_PER_DAY)

  let remindersSent = 0
  let expiriesProcessed = 0
  let mailFailed = 0
  const errors: string[] = []

  try {
    // ── 1. Reminder-batch ────────────────────────────────────────────────────
    const { data: reminderRows, error: reminderErr } = await supabaseAdmin
      .from('referral_rewards')
      .select('id, referrer_id, reward_type, expires_at')
      .is('reminded_at', null)
      .is('expired_at', null)
      .not('expires_at', 'is', null)
      .lte('expires_at', reminderCutoff.toISOString())
      .gt('expires_at', now.toISOString())

    if (reminderErr) {
      errors.push(`reminder query: ${reminderErr.message}`)
    } else if (reminderRows && reminderRows.length > 0) {
      for (const row of reminderRows) {
        try {
          if (!isKnownRewardType(row.reward_type)) {
            // Onbekend type: skip mail, maar markeer wel zodat we niet blijven loopen
            await supabaseAdmin
              .from('referral_rewards')
              .update({ reminded_at: now.toISOString() })
              .eq('id', row.id)
            continue
          }

          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('id', row.referrer_id)
            .single()

          if (!profile?.email) {
            errors.push(`reminder: geen email voor referrer ${row.referrer_id}`)
            // Toch markeren om herhaling te voorkomen
            await supabaseAdmin
              .from('referral_rewards')
              .update({ reminded_at: now.toISOString() })
              .eq('id', row.id)
            continue
          }

          const expiresAt = new Date(row.expires_at as string)
          const daysLeft = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_DAY))

          await sendRewardReminderEmail({
            to: profile.email,
            rewardType: row.reward_type,
            daysLeft,
          })

          await supabaseAdmin
            .from('referral_rewards')
            .update({ reminded_at: now.toISOString() })
            .eq('id', row.id)

          remindersSent++
        } catch (err) {
          mailFailed++
          errors.push(`reminder ${row.id}: ${(err as Error).message}`)
        }
      }
    }

    // ── 2. Expiry-batch ──────────────────────────────────────────────────────
    const { data: expiryRows, error: expiryErr } = await supabaseAdmin
      .from('referral_rewards')
      .select('id, referrer_id, milestone, reward_type, expires_at')
      .is('expired_at', null)
      .not('expires_at', 'is', null)
      .lte('expires_at', now.toISOString())

    if (expiryErr) {
      errors.push(`expiry query: ${expiryErr.message}`)
    } else if (expiryRows && expiryRows.length > 0) {
      for (const row of expiryRows) {
        try {
          // Markeer reward als expired (eerst, ongeacht mail-uitkomst)
          await supabaseAdmin
            .from('referral_rewards')
            .update({ expired_at: now.toISOString() })
            .eq('id', row.id)

          // Voor free_check: bijbehorende one_time_purchases op 'expired' zetten
          if (row.reward_type === 'free_check') {
            const sessionId = `referral_milestone_${row.milestone}_${row.referrer_id}`
            await supabaseAdmin
              .from('one_time_purchases')
              .update({ status: 'expired' })
              .eq('user_id', row.referrer_id)
              .eq('product_type', 'referral_free_check')
              .eq('stripe_checkout_session_id', sessionId)
              .eq('status', 'purchased')
          }

          // Mail
          if (isKnownRewardType(row.reward_type)) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('email')
              .eq('id', row.referrer_id)
              .single()

            if (profile?.email) {
              await sendRewardExpiredEmail({
                to: profile.email,
                rewardType: row.reward_type,
              })
            } else {
              errors.push(`expiry: geen email voor referrer ${row.referrer_id}`)
            }
          }

          expiriesProcessed++
        } catch (err) {
          mailFailed++
          errors.push(`expiry ${row.id}: ${(err as Error).message}`)
        }
      }
    }

    const durationMs = Date.now() - startedAt

    if (errors.length > 0) {
      await createAlert({
        type: 'cron_failed',
        severity: 'warning',
        title: 'Cron expire-rewards: fouten tijdens uitvoer',
        message: `Reminders: ${remindersSent}, expiries: ${expiriesProcessed}, fouten: ${errors.length}.`,
        metadata: { job: 'expire-rewards', errors: errors.slice(0, 20) },
        sendMail: false,
      }).catch((err) => console.error('[cron/expire-rewards] alert mislukt:', err))
    }

    console.log('[cron/expire-rewards] klaar', { remindersSent, expiriesProcessed, mailFailed, durationMs })
    return NextResponse.json({ remindersSent, expiriesProcessed, mailFailed, durationMs, errors })
  } catch (err) {
    console.error('[cron/expire-rewards] fataal:', err)
    await createAlert({
      type: 'cron_failed',
      severity: 'critical',
      title: 'Cron expire-rewards: onverwachte fout',
      message: (err as Error).message,
      metadata: { job: 'expire-rewards' },
      sendMail: true,
    }).catch(() => undefined)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
