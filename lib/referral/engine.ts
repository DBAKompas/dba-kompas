/**
 * Referral engine — DBA Kompas
 *
 * Verantwoordelijkheden:
 * - Referral code aanmaken en ophalen per gebruiker
 * - Referral tracking opslaan (code → referred_user_id)
 * - Referral kwalificeren na succesvolle betaling
 * - Rewards uitschrijven op mijlpalen (1 / 3 / 5)
 * - Anti-fraud guards
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendLoopsEvent } from '@/lib/loops'

// ── Constanten ────────────────────────────────────────────────────────────────

const MILESTONES: Record<number, { reward_type: string; coupon?: string }> = {
  1: { reward_type: 'free_check' },
  3: { reward_type: 'month_discount', coupon: 'REFERRAL_MONTH_DISCOUNT' },
  5: { reward_type: 'month_discount', coupon: 'REFERRAL_MONTH_DISCOUNT' },
}

// ── Code generatie ────────────────────────────────────────────────────────────

/**
 * Genereer een leesbare 8-tekens referral code op basis van userId.
 * Format: 4 letters + 4 cijfers (bijv. DBKX1234)
 */
function generateCode(userId: string): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // geen I, O (verwarring met 0, 1)
  const digits = '23456789'
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  let code = ''
  let seed = hash
  for (let i = 0; i < 4; i++) {
    code += letters[seed % letters.length]
    seed = Math.floor(seed / letters.length) + (seed % 7919)
  }
  for (let i = 0; i < 4; i++) {
    code += digits[seed % digits.length]
    seed = Math.floor(seed / digits.length) + (seed % 6271)
  }
  return code
}

// ── Code ophalen of aanmaken ──────────────────────────────────────────────────

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  // Eerst kijken of er al een code bestaat
  const { data: existing } = await supabaseAdmin
    .from('referral_codes')
    .select('code')
    .eq('user_id', userId)
    .single()

  if (existing?.code) return existing.code

  // Nieuwe code genereren — bij botsing suffix toevoegen
  let code = generateCode(userId)
  let attempt = 0
  while (attempt < 5) {
    const { error } = await supabaseAdmin
      .from('referral_codes')
      .insert({ user_id: userId, code })
    if (!error) return code
    // Bij UNIQUE conflict: suffix met attempt nummer
    code = generateCode(userId + attempt)
    attempt++
  }

  throw new Error('Kon geen unieke referral code aanmaken')
}

// ── Referral tracking opslaan ─────────────────────────────────────────────────

/**
 * Slaat op dat referred_user_id is binnengekomen via referral_code.
 * Wordt aangeroepen bij registratie of eerste login na cookie-landing.
 * Idempotent: als er al een tracking bestaat voor deze user, skip.
 */
export async function trackReferral(params: {
  referredUserId: string
  referralCode: string
}): Promise<void> {
  const { referredUserId, referralCode } = params

  // Zoek de referrer op basis van code
  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes')
    .select('user_id')
    .eq('code', referralCode.toUpperCase())
    .single()

  if (!codeRow) return // onbekende code, skip

  const referrerId = codeRow.user_id

  // Anti-fraud: zelfverwijzing blokkeren
  if (referrerId === referredUserId) return

  // Idempotent: al getrackt?
  const { data: existing } = await supabaseAdmin
    .from('referral_tracking')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .single()

  if (existing) return // al getrackt

  await supabaseAdmin.from('referral_tracking').insert({
    referred_user_id: referredUserId,
    referral_code: referralCode.toUpperCase(),
    referrer_id: referrerId,
    status: 'pending',
  })
}

// ── Referral kwalificeren na betaling ─────────────────────────────────────────

/**
 * Wordt aangeroepen vanuit de Stripe webhook na checkout.session.completed.
 * Kwalificeert de referral en verdeelt rewards op mijlpalen.
 */
export async function qualifyReferral(params: {
  referredUserId: string
  checkoutSessionId: string
  referrerEmail?: string | null
}): Promise<void> {
  const { referredUserId, checkoutSessionId, referrerEmail } = params

  // Zoek openstaande tracking
  const { data: tracking } = await supabaseAdmin
    .from('referral_tracking')
    .select('id, referrer_id, status')
    .eq('referred_user_id', referredUserId)
    .single()

  if (!tracking) return         // geen referral voor deze user
  if (tracking.status !== 'pending') return  // al verwerkt

  const referrerId = tracking.referrer_id

  // Markeer als gekwalificeerd
  await supabaseAdmin
    .from('referral_tracking')
    .update({ status: 'qualified', checkout_session_id: checkoutSessionId })
    .eq('id', tracking.id)

  // Tel hoeveel geldige referrals de referrer nu heeft
  const { count } = await supabaseAdmin
    .from('referral_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('status', 'qualified')

  const totalQualified = count ?? 0

  // Check welke mijlpalen bereikt zijn en nog geen reward hebben
  for (const [milestoneStr, rewardDef] of Object.entries(MILESTONES)) {
    const milestone = parseInt(milestoneStr)
    if (totalQualified < milestone) continue

    // Idempotent: al een reward voor deze mijlpaal?
    const { data: existingReward } = await supabaseAdmin
      .from('referral_rewards')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('milestone', milestone)
      .single()

    if (existingReward) continue // al uitgedeeld

    // Reward schrijven
    await supabaseAdmin.from('referral_rewards').insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      milestone,
      reward_type: rewardDef.reward_type,
      stripe_coupon_id: rewardDef.coupon ?? null,
    })

    // Voor free_check: extra one_time_purchase credit toevoegen
    if (rewardDef.reward_type === 'free_check') {
      await supabaseAdmin.from('one_time_purchases').insert({
        user_id: referrerId,
        product_type: 'referral_free_check',
        status: 'granted',
        stripe_checkout_session_id: `referral_milestone_${milestone}_${referrerId}`,
      })
    }

    // Loops event sturen naar referrer
    if (referrerEmail) {
      await sendLoopsEvent(`referral_milestone_${milestone}` as Parameters<typeof sendLoopsEvent>[0], {
        email: referrerEmail,
        userId: referrerId,
        properties: { milestone, reward_type: rewardDef.reward_type },
        dedupKey: `referral-reward-${referrerId}-${milestone}`,
      }).catch((err) =>
        console.error(`[referral] Loops event referral_milestone_${milestone} mislukt:`, err)
      )
    }

    // Markeer tracking als rewarded
    await supabaseAdmin
      .from('referral_tracking')
      .update({ status: 'rewarded' })
      .eq('id', tracking.id)
  }
}

// ── Statistieken voor widget ──────────────────────────────────────────────────

export interface ReferralStats {
  code: string
  referralUrl: string
  qualifiedCount: number
  rewards: Array<{ milestone: number; reward_type: string; granted_at: string }>
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(userId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbakompas.nl'
  const referralUrl = `${appUrl}/?ref=${code}`

  const { count } = await supabaseAdmin
    .from('referral_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', userId)
    .in('status', ['qualified', 'rewarded'])

  const { data: rewards } = await supabaseAdmin
    .from('referral_rewards')
    .select('milestone, reward_type, granted_at')
    .eq('referrer_id', userId)
    .order('milestone')

  return {
    code,
    referralUrl,
    qualifiedCount: count ?? 0,
    rewards: rewards ?? [],
  }
}
