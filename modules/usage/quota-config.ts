/**
 * Quota-configuratie (KI-021).
 *
 * Bron-van-waarheid voor alle quota-waarden. Zowel de API-route
 * (assertQuota) als de UsageMeter gebruiken dit bestand. Waardes
 * wijzigen gaat via een deploy, niet via een migration.
 */

import type { QuotaPlan } from '@/modules/billing/entitlements'

/** Aantal DBA-analyses per kalendermaand per plan. */
export const MONTHLY_QUOTA = 20
export const YEARLY_QUOTA = 25
export const ONE_TIME_QUOTA = 1
export const FREE_QUOTA = 0

/**
 * Drempel waarop de UsageMeter een waarschuwing toont
 * ("je hebt bijna je credits gebruikt").
 */
export const WARN_THRESHOLD_RATIO = 0.8

export function getQuotaForPlan(plan: QuotaPlan): number {
  switch (plan) {
    case 'monthly':  return MONTHLY_QUOTA
    case 'yearly':   return YEARLY_QUOTA
    case 'one_time': return ONE_TIME_QUOTA
    case 'free':     return FREE_QUOTA
  }
}

/** Eerste dag van de huidige kalendermaand in lokale tijd (YYYY-MM-01). */
export function currentPeriodStart(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}
