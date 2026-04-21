/**
 * Quota-logica (KI-021).
 *
 * Deze module is de enige plek waar het quota-beleid wordt
 * afgedwongen. API-routes moeten ALTIJD via reserveUsage()
 * gaan voordat ze een AI-call doen, en bij fouten
 * releaseUsage() aanroepen.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import type { QuotaPlan } from '@/modules/billing/entitlements'
import {
  currentPeriodStart,
  getQuotaForPlan,
  WARN_THRESHOLD_RATIO,
} from './quota-config'

export type QuotaReservationResult =
  | { ok: true;  newCount: number; limit: number; plan: QuotaPlan }
  | { ok: false; reason: 'quota_exceeded' | 'no_plan'; used: number; limit: number; plan: QuotaPlan }

/**
 * Probeert één analyse te reserveren in de usage-teller.
 * Bij succes is checks_used alvast opgehoogd (race-safe).
 * Bij quota-overschrijding is niets gewijzigd in de DB.
 *
 * Belangrijk: de caller MOET releaseUsage() aanroepen als de
 * AI-call na reservatie alsnog faalt, om niet onterecht een
 * credit af te schrijven.
 */
export async function reserveUsage(
  userId: string,
  plan: QuotaPlan,
): Promise<QuotaReservationResult> {
  if (plan === 'free') {
    return { ok: false, reason: 'no_plan', used: 0, limit: 0, plan }
  }

  // One-time: lifetime cap van 1 check, gemeten via bestaande
  // dba_assessments tabel. Geen usage_counters nodig voor dit plan.
  if (plan === 'one_time') {
    const { count, error } = await supabaseAdmin
      .from('dba_assessments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      console.error('[quota] one_time count error:', error)
      // Fail-closed: bij onverwachte DB-fout niet door laten.
      return { ok: false, reason: 'quota_exceeded', used: 0, limit: 1, plan }
    }
    const used = count ?? 0
    if (used >= 1) {
      return { ok: false, reason: 'quota_exceeded', used, limit: 1, plan }
    }
    return { ok: true, newCount: used + 1, limit: 1, plan }
  }

  // monthly/yearly: atomic increment via RPC
  const limit = getQuotaForPlan(plan)
  const periodStart = currentPeriodStart()

  const { data, error } = await supabaseAdmin.rpc(
    'increment_usage_if_under_quota',
    {
      p_user_id: userId,
      p_period_start: periodStart,
      p_quota_limit: limit,
    },
  )

  if (error) {
    console.error('[quota] rpc increment error:', error)
    return { ok: false, reason: 'quota_exceeded', used: limit, limit, plan }
  }

  if (data === null || typeof data !== 'number') {
    // RPC returned NULL = quota bereikt
    const current = await getUsageForUser(userId, plan)
    return { ok: false, reason: 'quota_exceeded', used: current.used, limit, plan }
  }

  return { ok: true, newCount: data, limit, plan }
}

/**
 * Rollback van een eerder gereserveerde credit. Alleen relevant
 * voor monthly/yearly (bij one_time wordt geen usage_counter
 * row geraakt, daar rolt de dba_assessments insert vanzelf terug
 * als die nooit is gebeurd).
 */
export async function releaseUsage(userId: string, plan: QuotaPlan): Promise<void> {
  if (plan !== 'monthly' && plan !== 'yearly') return

  const periodStart = currentPeriodStart()
  const { error } = await supabaseAdmin.rpc('release_usage_reservation', {
    p_user_id: userId,
    p_period_start: periodStart,
  })
  if (error) console.error('[quota] rpc release error:', error)
}

export type UsageSnapshot = {
  plan: QuotaPlan
  used: number
  limit: number
  remaining: number
  percentage: number
  warn: boolean
  atLimit: boolean
}

/**
 * Leesfunctie voor UsageMeter en soft-warning logica.
 * Idempotent, muteert niets.
 */
export async function getUsageForUser(userId: string, plan: QuotaPlan): Promise<UsageSnapshot> {
  const limit = getQuotaForPlan(plan)

  let used = 0

  if (plan === 'one_time') {
    const { count } = await supabaseAdmin
      .from('dba_assessments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    used = count ?? 0
  } else if (plan === 'monthly' || plan === 'yearly') {
    const periodStart = currentPeriodStart()
    const { data } = await supabaseAdmin
      .from('usage_counters')
      .select('checks_used')
      .eq('user_id', userId)
      .eq('period_start', periodStart)
      .maybeSingle()
    used = data?.checks_used ?? 0
  }

  const remaining = Math.max(limit - used, 0)
  const percentage = limit === 0 ? 0 : Math.min((used / limit) * 100, 100)
  const warn = limit > 0 && used / limit >= WARN_THRESHOLD_RATIO && used < limit
  const atLimit = limit > 0 && used >= limit

  return { plan, used, limit, remaining, percentage, warn, atLimit }
}
