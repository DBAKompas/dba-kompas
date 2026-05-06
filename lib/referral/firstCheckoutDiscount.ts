import type { SupabaseClient } from '@supabase/supabase-js'
import { REFERRAL_FRIEND_COUPON } from './config'

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
