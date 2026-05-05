/**
 * Staffel-engine: 60-dagen window per gever, mijlpalen 1 / 3 / 5.
 *
 * Houdt referral_staffel in sync met succesvolle referrals en spiegelt
 * de hoogste mijlpaal naar profiles voor cohort-rapportage.
 *
 * Aangeroepen door qualifyReferral in lib/referral/engine.ts (stap 3).
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { staffelExpiry, daysUntil } from './expiry'
import { MILESTONES } from './config'

export interface StaffelStatus {
  startedAt: string | null
  expiresAt: string | null
  successfulCount: number
  highestMilestone: number
  daysRemaining: number
  nextMilestone: number | null
}

/**
 * Bepaalt de hoogste mijlpaal die met een gegeven count is bereikt.
 * "Alles of niks": wie 4 heeft, krijgt hetzelfde als wie 3 heeft.
 */
export function highestMilestoneFor(count: number): number {
  let highest = 0
  for (const m of MILESTONES) {
    if (count >= m) highest = m
  }
  return highest
}

/**
 * Bepaalt de eerstvolgende mijlpaal die nog niet gehaald is.
 * Returns null als alle mijlpalen al gehaald zijn.
 */
export function nextMilestoneFor(count: number): number | null {
  for (const m of MILESTONES) {
    if (count < m) return m
  }
  return null
}

/**
 * Markeer een succesvolle referral op het staffel-record van de gever.
 *
 * Gedrag:
 *   - Geen rij of verlopen window: nieuwe periode (started_at = qualifiedAt,
 *     expires_at = +60d, count = 1).
 *   - Lopende window: increment successful_count.
 *   - highest_milestone wordt afgeleid van successful_count.
 *
 * Idempotency: hoort 1x per qualified referral te worden aangeroepen.
 * Bescherming tegen dubbel-aanroepen ligt in qualifyReferral via de
 * referral_tracking.status transities (pending -> qualified -> rewarded).
 */
export async function recordSuccessfulReferral(params: {
  referrerUserId: string
  qualifiedAt?: Date
}): Promise<StaffelStatus> {
  const { referrerUserId } = params
  const qualifiedAt = params.qualifiedAt ?? new Date()
  const qualifiedAtIso = qualifiedAt.toISOString()

  // 1. Huidige staffel ophalen
  const { data: existing } = await supabaseAdmin
    .from('referral_staffel')
    .select('started_at, expires_at, successful_count, highest_milestone')
    .eq('user_id', referrerUserId)
    .maybeSingle()

  const windowExpired =
    existing?.expires_at &&
    new Date(existing.expires_at).getTime() <= qualifiedAt.getTime()

  let nextStartedAt: string
  let nextExpiresAt: string
  let nextCount: number

  if (!existing || !existing.started_at || windowExpired) {
    // Nieuwe periode starten
    nextStartedAt = qualifiedAtIso
    nextExpiresAt = staffelExpiry(qualifiedAt).toISOString()
    nextCount = 1
  } else {
    nextStartedAt = existing.started_at
    nextExpiresAt = existing.expires_at as string
    nextCount = (existing.successful_count ?? 0) + 1
  }

  const nextHighest = highestMilestoneFor(nextCount)

  // 2. Upsert staffel
  const { error } = await supabaseAdmin
    .from('referral_staffel')
    .upsert(
      {
        user_id: referrerUserId,
        started_at: nextStartedAt,
        expires_at: nextExpiresAt,
        successful_count: nextCount,
        highest_milestone: nextHighest,
        last_evaluated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('[staffel] upsert mislukt:', error)
    throw error
  }

  // 3. Profile-spiegel bijwerken (datapunten 15 en 16)
  await supabaseAdmin
    .from('profiles')
    .update({
      first_successful_referral_at: nextStartedAt,
      highest_milestone_reached: nextHighest,
    })
    .eq('user_id', referrerUserId)

  return {
    startedAt: nextStartedAt,
    expiresAt: nextExpiresAt,
    successfulCount: nextCount,
    highestMilestone: nextHighest,
    daysRemaining: daysUntil(nextExpiresAt),
    nextMilestone: nextMilestoneFor(nextCount),
  }
}

/**
 * Lees-only staffel-status voor UI / API.
 */
export async function getStaffelStatus(userId: string): Promise<StaffelStatus> {
  const { data } = await supabaseAdmin
    .from('referral_staffel')
    .select('started_at, expires_at, successful_count, highest_milestone')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) {
    return {
      startedAt: null,
      expiresAt: null,
      successfulCount: 0,
      highestMilestone: 0,
      daysRemaining: 0,
      nextMilestone: 1,
    }
  }

  return {
    startedAt: data.started_at,
    expiresAt: data.expires_at,
    successfulCount: data.successful_count ?? 0,
    highestMilestone: data.highest_milestone ?? 0,
    daysRemaining: daysUntil(data.expires_at),
    nextMilestone: nextMilestoneFor(data.successful_count ?? 0),
  }
}
