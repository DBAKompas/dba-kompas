/**
 * Referral engine - DBA Kompas
 *
 * Verantwoordelijkheden:
 * - 5 eenmalige referral codes aanmaken per gebruiker
 * - Referral tracking opslaan (code → referred_user_id)
 * - Referral kwalificeren na succesvolle betaling
 * - Rewards uitschrijven op mijlpalen (1 / 3 / 5)
 * - Anti-fraud guards
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendLoopsEvent } from '@/lib/loops'

// ── Constanten ────────────────────────────────────────────────────────────────

const MAX_CODES_PER_USER = 5

const MILESTONES: Record<number, { reward_type: string; coupon?: string }> = {
  1: { reward_type: 'free_check' },
  3: { reward_type: 'month_discount',     coupon: 'REFERRAL_MONTH_DISCOUNT' },
  5: { reward_type: 'two_month_discount', coupon: 'REFERRAL_TWO_MONTH_DISCOUNT' },
}

// Mijlpaal-statusberichten zoals getoond in de widget
export const MILESTONE_MESSAGES: Record<number, string> = {
  0: 'Deel je codes met andere zzp\'ers en verdien gratis toegang.',
  1: 'Je hebt een gratis check door jouw succesvolle referral.',
  2: 'Je hebt nu 2 succesvolle referrals. Bij de volgende krijg jij 1 maand gratis toegang tot DBA Kompas.',
  3: 'Je hebt 1 maand gratis toegang tot DBA Kompas, doordat jij 3 succesvolle referrals hebt.',
  4: 'Nog 1 referral en jij krijgt 2 maanden gratis toegang tot DBA Kompas.',
  5: 'Eindbaas. Jij hebt voor 5 succesvolle referrals gezorgd. Daardoor krijg jij 2 maanden gratis toegang tot DBA Kompas.',
}

// ── Code generatie ────────────────────────────────────────────────────────────

/**
 * Genereer een leesbare 8-tekens referral code op basis van een seed-string.
 * Format: 4 letters + 4 cijfers (bijv. DBKX1234)
 * Geen verwarring-tekens (I, O, 0, 1).
 */
function generateCode(seed: string): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits  = '23456789'
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  let code = ''
  let s = hash
  for (let i = 0; i < 4; i++) {
    code += letters[s % letters.length]
    s = Math.floor(s / letters.length) + (s % 7919)
  }
  for (let i = 0; i < 4; i++) {
    code += digits[s % digits.length]
    s = Math.floor(s / digits.length) + (s % 6271)
  }
  return code
}

// ── 5 codes ophalen of aanmaken ───────────────────────────────────────────────

/**
 * Haalt de 5 referral codes op van de gebruiker.
 * Maakt ontbrekende codes aan als er nog geen 5 zijn.
 * Retourneert altijd exact MAX_CODES_PER_USER codes.
 */
export async function getOrCreateReferralCodes(userId: string): Promise<ReferralCode[]> {
  const { data: existing } = await supabaseAdmin
    .from('referral_codes')
    .select('id, code, is_used, used_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  const codes = existing ?? []

  // Maak ontbrekende codes aan
  const missing = MAX_CODES_PER_USER - codes.length
  for (let i = 0; i < missing; i++) {
    const seed = `${userId}-${codes.length + i}-${Date.now()}`
    let candidate = generateCode(seed)
    let attempts = 0

    while (attempts < 10) {
      const { data: inserted, error } = await supabaseAdmin
        .from('referral_codes')
        .insert({ user_id: userId, code: candidate })
        .select('id, code, is_used, used_at')
        .single()

      if (!error && inserted) {
        codes.push(inserted)
        break
      }
      // Collision: varieer de seed
      candidate = generateCode(`${seed}-retry-${attempts}`)
      attempts++
    }
  }

  return codes.slice(0, MAX_CODES_PER_USER).map(c => ({
    id: c.id,
    code: c.code,
    isUsed: c.is_used ?? false,
    usedAt: c.used_at ?? null,
  }))
}

/**
 * Backward-compat: geeft de eerste beschikbare (niet-gebruikte) code terug.
 * Voor gebruik in bestaande webhook-logica.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const codes = await getOrCreateReferralCodes(userId)
  const available = codes.find(c => !c.isUsed)
  return available?.code ?? codes[0].code
}

// ── Referral tracking opslaan ─────────────────────────────────────────────────

/**
 * Slaat op dat referred_user_id is binnengekomen via referral_code.
 * Markeert de code als gebruikt.
 * Idempotent: als er al een tracking bestaat voor deze user, skip.
 */
export async function trackReferral(params: {
  referredUserId: string
  referralCode: string
}): Promise<void> {
  const { referredUserId, referralCode } = params

  // Zoek de code-rij op (moet niet-gebruikt zijn)
  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes')
    .select('id, user_id, is_used')
    .eq('code', referralCode.toUpperCase())
    .single()

  if (!codeRow) return                    // onbekende code
  if (codeRow.is_used) return             // al verzilverd

  const referrerId = codeRow.user_id

  // Anti-fraud: zelfverwijzing blokkeren
  if (referrerId === referredUserId) return

  // Idempotent: al getrackt?
  const { data: existing } = await supabaseAdmin
    .from('referral_tracking')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .single()

  if (existing) return

  // Tracking aanmaken
  await supabaseAdmin.from('referral_tracking').insert({
    referred_user_id: referredUserId,
    referral_code: referralCode.toUpperCase(),
    referrer_id: referrerId,
    status: 'pending',
  })

  // Code markeren als gebruikt
  await supabaseAdmin
    .from('referral_codes')
    .update({ is_used: true, used_by: referredUserId, used_at: new Date().toISOString() })
    .eq('id', codeRow.id)
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

  if (!tracking) return
  if (tracking.status !== 'pending') return

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

    const { data: existingReward } = await supabaseAdmin
      .from('referral_rewards')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('milestone', milestone)
      .single()

    if (existingReward) continue

    // Reward schrijven
    await supabaseAdmin.from('referral_rewards').insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      milestone,
      reward_type: rewardDef.reward_type,
      stripe_coupon_id: rewardDef.coupon ?? null,
    })

    // Milestone 1: gratis check als one_time_purchase credit
    if (rewardDef.reward_type === 'free_check') {
      await supabaseAdmin.from('one_time_purchases').insert({
        user_id: referrerId,
        product_type: 'referral_free_check',
        status: 'granted',
        stripe_checkout_session_id: `referral_milestone_${milestone}_${referrerId}`,
      })
    }

    // Loops event naar referrer
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

    // Markeer tracking als rewarded bij de hoogst bereikbare mijlpaal
    if (milestone === Math.max(...Object.keys(MILESTONES).map(Number).filter(m => totalQualified >= m))) {
      await supabaseAdmin
        .from('referral_tracking')
        .update({ status: 'rewarded' })
        .eq('id', tracking.id)
    }
  }
}

// ── Statistieken voor widget ──────────────────────────────────────────────────

export interface ReferralCode {
  id: string
  code: string
  isUsed: boolean
  usedAt: string | null
}

export interface ReferralStats {
  codes: ReferralCode[]
  /** @deprecated gebruik codes[0].code - alleen voor backward compat */
  code: string
  referralBaseUrl: string
  qualifiedCount: number
  statusMessage: string
  rewards: Array<{ milestone: number; reward_type: string; granted_at: string }>
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const codes = await getOrCreateReferralCodes(userId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbakompas.nl'

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

  const qualifiedCount = count ?? 0
  // Pak het meest relevante bericht: exacte match of 0
  const cappedCount = Math.min(qualifiedCount, 5)
  const statusMessage = MILESTONE_MESSAGES[cappedCount] ?? MILESTONE_MESSAGES[5]

  return {
    codes,
    code: codes[0]?.code ?? '',
    referralBaseUrl: `${appUrl}/?ref=`,
    qualifiedCount,
    statusMessage,
    rewards: rewards ?? [],
  }
}
