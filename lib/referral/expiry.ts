/**
 * Pure helpers voor verloopdatum-berekeningen rond referral en upgrade.
 *
 * Geen DB-calls, geen side effects. Alle functies zijn deterministisch.
 * Gebruik deze waar mogelijk in plaats van inline date math.
 */

import {
  SHARE_CODE_VALID_DAYS,
  STAFFEL_WINDOW_DAYS,
  UPGRADE_OFFER_VALID_DAYS,
  BONUS_CHECK_VALID_DAYS,
  REWARD_MONTH_DISCOUNT_VALID_DAYS,
  REWARD_TWO_MONTH_DISCOUNT_VALID_DAYS,
} from './config'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Voeg n dagen toe aan een datum, retourneert een nieuwe Date */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

/** True als de gegeven datum in het verleden ligt t.o.v. now (of opgegeven referentie) */
export function isExpired(
  expiresAt: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!expiresAt) return false
  const d = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return d.getTime() <= now.getTime()
}

/**
 * Aantal hele dagen tot een datum, gerond naar boven.
 * Geeft 0 als de datum in het verleden ligt of NULL is.
 */
export function daysUntil(
  target: Date | string | null | undefined,
  now: Date = new Date(),
): number {
  if (!target) return 0
  const d = typeof target === 'string' ? new Date(target) : target
  const diffMs = d.getTime() - now.getTime()
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / MS_PER_DAY)
}

// ── Domeinspecifieke helpers ─────────────────────────────────────────────────

/** Verloopdatum voor een nieuw uitgegeven share-code (30 dagen) */
export function shareCodeExpiry(createdAt: Date = new Date()): Date {
  return addDays(createdAt, SHARE_CODE_VALID_DAYS)
}

/** Verloopdatum van het 60-dagen staffel-window */
export function staffelExpiry(startedAt: Date | string): Date {
  const d = typeof startedAt === 'string' ? new Date(startedAt) : startedAt
  return addDays(d, STAFFEL_WINDOW_DAYS)
}

/** Verloopdatum van het 14-dagen upgrade-aanbod */
export function upgradeOfferExpiry(triggeredAt: Date = new Date()): Date {
  return addDays(triggeredAt, UPGRADE_OFFER_VALID_DAYS)
}

/** Verloopdatum van een gratis bonus-check uit mijlpaal 1 (30 dagen) */
export function bonusCheckExpiry(grantedAt: Date = new Date()): Date {
  return addDays(grantedAt, BONUS_CHECK_VALID_DAYS)
}

/**
 * Verloopdatum van een referral_rewards rij, afhankelijk van reward_type.
 * - free_check          → 30 dagen (mijlpaal 1, gratis bonus-check)
 * - month_discount      → 60 dagen (mijlpaal 3, 1 maand gratis abo)
 * - two_month_discount  → 60 dagen (mijlpaal 5, 2 maanden gratis abo)
 * Onbekende types → null (geen verloop, defensief).
 */
export function rewardExpiry(
  rewardType: string,
  grantedAt: Date | string = new Date(),
): Date | null {
  const start = typeof grantedAt === 'string' ? new Date(grantedAt) : grantedAt
  switch (rewardType) {
    case 'free_check':
      return addDays(start, BONUS_CHECK_VALID_DAYS)
    case 'month_discount':
      return addDays(start, REWARD_MONTH_DISCOUNT_VALID_DAYS)
    case 'two_month_discount':
      return addDays(start, REWARD_TWO_MONTH_DISCOUNT_VALID_DAYS)
    default:
      return null
  }
}
