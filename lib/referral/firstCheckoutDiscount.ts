import type { SupabaseClient } from '@supabase/supabase-js'
import { REFERRAL_FRIEND_COUPON } from './config'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isExpired } from '@/lib/referral/expiry'

/**
 * Bepaalt of de huidige checkout een "eerste checkout van een share-redemption" is.
 * Eligibility: er bestaat een referral_tracking rij voor deze user met status='pending'.
 * Bij die status is er nog geen succesvolle checkout geweest (anders zou status qualified/rewarded zijn).
 *
 * Retourneert het Stripe discounts-array of null.
 */
export async function getShareRedemptionDiscount(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ coupon: string }[] | null> {
  const { data, error } = await supabase
    .from('referral_tracking')
    .select('status')
    .eq('referred_user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  if (data.status !== 'pending') return null

  return [{ coupon: REFERRAL_FRIEND_COUPON }]
}

/**
 * Variant voor guest-checkout: lookup op basis van de dba_ref cookie.
 * Geeft de coupon terug als de code een geldige, niet-verbruikte, niet-verlopen
 * share-code is. Anders null.
 */
export async function getShareRedemptionDiscountByCode(
  code: string | null,
): Promise<{ coupon: string }[] | null> {
  if (!code) return null

  const { data: codeRow, error } = await supabaseAdmin
    .from('referral_codes')
    .select('code_type, is_used, expires_at')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error || !codeRow) return null
  if (codeRow.code_type !== 'share') return null
  if (codeRow.is_used) return null
  if (codeRow.expires_at && isExpired(codeRow.expires_at)) return null

  return [{ coupon: REFERRAL_FRIEND_COUPON }]
}
