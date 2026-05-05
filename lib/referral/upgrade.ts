/**
 * Upgrade-aanbod (€9,95 korting eerste maand, 14 dagen geldig).
 *
 * Aangeroepen door:
 *   - billing webhook na succesvolle eenmalige check (createUpgradeOffer)
 *   - app/api/billing/upgrade/checkout (getActiveUpgradeOffer)
 *   - billing webhook na upgrade-acceptatie (markUpgradeOfferAccepted)
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { upgradeOfferExpiry, daysUntil, isExpired } from './expiry'
import { UPGRADE_FIRST_MONTH_COUPON } from './config'

export interface UpgradeOffer {
  userId: string
  triggeredAt: string
  expiresAt: string
  couponCode: string
  acceptedAt: string | null
  acceptedSubscriptionId: string | null
  daysRemaining: number
  isActive: boolean
}

/**
 * Maakt of vernieuwt een upgrade-offer voor een gebruiker.
 * Idempotent: actieve, niet-geaccepteerde offer blijft ongewijzigd.
 * Verlopen offer wordt vervangen door een nieuwe periode.
 */
export async function createUpgradeOffer(params: {
  userId: string
  triggeredAt?: Date
}): Promise<UpgradeOffer> {
  const { userId } = params
  const triggeredAt = params.triggeredAt ?? new Date()

  // Check bestaande offer
  const { data: existing } = await supabaseAdmin
    .from('upgrade_offers')
    .select('triggered_at, expires_at, coupon_code, accepted_at, accepted_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing && !existing.accepted_at && !isExpired(existing.expires_at)) {
    // Actieve offer bestaat al, niet overschrijven
    return toUpgradeOffer(userId, existing)
  }

  // Nieuwe offer aanmaken (of verlopen offer vervangen)
  const triggeredAtIso = triggeredAt.toISOString()
  const expiresAtIso = upgradeOfferExpiry(triggeredAt).toISOString()

  const { data: inserted, error } = await supabaseAdmin
    .from('upgrade_offers')
    .upsert(
      {
        user_id: userId,
        triggered_at: triggeredAtIso,
        expires_at: expiresAtIso,
        coupon_code: UPGRADE_FIRST_MONTH_COUPON,
        accepted_at: null,
        accepted_subscription_id: null,
      },
      { onConflict: 'user_id' },
    )
    .select('triggered_at, expires_at, coupon_code, accepted_at, accepted_subscription_id')
    .single()

  if (error || !inserted) {
    console.error('[upgrade] createUpgradeOffer mislukt:', error)
    throw error ?? new Error('upgrade offer insert mislukt')
  }

  // Profile-spiegel: status 'none' -> 'offered' (alleen first-time bump)
  await supabaseAdmin
    .from('profiles')
    .update({ upgrade_status: 'offered' })
    .eq('user_id', userId)
    .eq('upgrade_status', 'none')

  return toUpgradeOffer(userId, inserted)
}

/**
 * Geef de actieve upgrade-offer terug, of null als er geen geldige is.
 */
export async function getActiveUpgradeOffer(userId: string): Promise<UpgradeOffer | null> {
  const { data } = await supabaseAdmin
    .from('upgrade_offers')
    .select('triggered_at, expires_at, coupon_code, accepted_at, accepted_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null
  if (data.accepted_at) return null
  if (isExpired(data.expires_at)) return null

  return toUpgradeOffer(userId, data)
}

/**
 * Markeer een upgrade-offer als geaccepteerd.
 * Aangeroepen door billing webhook bij subscription_started met UPGRADE_FIRST_MONTH_995 coupon.
 */
export async function markUpgradeOfferAccepted(params: {
  userId: string
  subscriptionId: string
  acceptedAt?: Date
}): Promise<void> {
  const { userId, subscriptionId } = params
  const acceptedAt = (params.acceptedAt ?? new Date()).toISOString()

  await supabaseAdmin
    .from('upgrade_offers')
    .update({
      accepted_at: acceptedAt,
      accepted_subscription_id: subscriptionId,
    })
    .eq('user_id', userId)
    .is('accepted_at', null)

  await supabaseAdmin
    .from('profiles')
    .update({ upgrade_status: 'upgraded_month' })
    .eq('user_id', userId)
}

// ── Interne helper ───────────────────────────────────────────────────────────

function toUpgradeOffer(
  userId: string,
  row: {
    triggered_at: string
    expires_at: string
    coupon_code: string
    accepted_at: string | null
    accepted_subscription_id: string | null
  },
): UpgradeOffer {
  return {
    userId,
    triggeredAt: row.triggered_at,
    expiresAt: row.expires_at,
    couponCode: row.coupon_code,
    acceptedAt: row.accepted_at,
    acceptedSubscriptionId: row.accepted_subscription_id,
    daysRemaining: daysUntil(row.expires_at),
    isActive: !row.accepted_at && !isExpired(row.expires_at),
  }
}
