/**
 * Referral engine - DBA Kompas
 *
 * Verantwoordelijkheden:
 * - 5 eenmalige referral codes aanmaken per gebruiker
 * - Referral tracking opslaan (code → referred_user_id)
 * - Referral kwalificeren na succesvolle betaling
 * - Rewards uitschrijven op mijlpalen (1 / 3 / 5)
 * - Stripe reward appliceren (coupon op abonnement of refund bij jaarabonnement)
 * - Anti-fraud guards
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'
import { sendEmail } from '@/lib/email'
import { sendLoopsEvent } from '@/lib/loops'
import { createNotification } from '@/lib/notifications'
import { shareCodeExpiry, isExpired } from '@/lib/referral/expiry'
import { recordSuccessfulReferral } from '@/lib/referral/staffel'

// ── Constanten ────────────────────────────────────────────────────────────────

const MAX_CODES_PER_USER = 5

const MILESTONES: Record<number, { reward_type: string; coupon?: string; months?: number }> = {
  1: { reward_type: 'free_check' },
  3: { reward_type: 'month_discount',     coupon: 'REFERRAL_MONTH_DISCOUNT',     months: 1 },
  5: { reward_type: 'two_month_discount', coupon: 'REFERRAL_TWO_MONTH_DISCOUNT', months: 2 },
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

export async function getOrCreateReferralCodes(userId: string): Promise<ReferralCode[]> {
  // Alleen share-codes van deze gebruiker. Welcome-codes (admin uitgegeven) zijn
  // bewust uitgesloten zodat een admin zijn eigen share-set niet vervuilt.
  const { data: existing } = await supabaseAdmin
    .from('referral_codes')
    .select('id, code, is_used, used_at, expires_at')
    .eq('user_id', userId)
    .eq('code_type', 'share')
    .order('created_at', { ascending: true })

  const codes = existing ?? []
  const missing = MAX_CODES_PER_USER - codes.length

  for (let i = 0; i < missing; i++) {
    const seed = `${userId}-${codes.length + i}-${Date.now()}`
    let candidate = generateCode(seed)
    let attempts = 0
    while (attempts < 10) {
      const { data: inserted, error } = await supabaseAdmin
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: candidate,
          code_type: 'share',
          issuer_role: 'user',
          expires_at: shareCodeExpiry().toISOString(),
        })
        .select('id, code, is_used, used_at, expires_at')
        .single()
      if (!error && inserted) { codes.push(inserted); break }
      candidate = generateCode(`${seed}-retry-${attempts}`)
      attempts++
    }
  }

  return codes.slice(0, MAX_CODES_PER_USER).map(c => ({
    id: c.id,
    code: c.code,
    isUsed: c.is_used ?? false,
    usedAt: c.used_at ?? null,
    expiresAt: c.expires_at ?? null,
  }))
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const codes = await getOrCreateReferralCodes(userId)
  const available = codes.find(c => !c.isUsed)
  return available?.code ?? codes[0].code
}

// ── Referral tracking opslaan ─────────────────────────────────────────────────

export type TrackReferralResult =
  | { ok: true; redemptionKind: 'welcome_free_check' | 'share_pending_qualification' }
  | { ok: false; reason: 'not_found' | 'expired' | 'already_used' | 'self_referral' | 'already_tracked' }

function extractEmailDomain(email?: string | null): string | null {
  if (!email) return null
  const at = email.indexOf('@')
  if (at < 0) return null
  return email.slice(at + 1).toLowerCase()
}

export async function trackReferral(params: {
  referredUserId: string
  referralCode: string
  redeemerEmail?: string | null
  redeemerIpHash?: string | null
}): Promise<TrackReferralResult> {
  const { referredUserId, referralCode, redeemerEmail, redeemerIpHash } = params

  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes')
    .select('id, user_id, is_used, expires_at, code_type')
    .eq('code', referralCode.toUpperCase())
    .single()

  if (!codeRow) return { ok: false, reason: 'not_found' }
  if (codeRow.is_used) return { ok: false, reason: 'already_used' }
  if (codeRow.expires_at && isExpired(codeRow.expires_at)) {
    return { ok: false, reason: 'expired' }
  }

  const referrerId = codeRow.user_id
  if (referrerId === referredUserId) return { ok: false, reason: 'self_referral' }

  const { data: existing } = await supabaseAdmin
    .from('referral_tracking')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .single()
  if (existing) return { ok: false, reason: 'already_tracked' }

  const codeType = (codeRow.code_type ?? 'share') as 'welcome' | 'share'
  const redemptionKind: 'welcome_free_check' | 'share_pending_qualification' =
    codeType === 'welcome' ? 'welcome_free_check' : 'share_pending_qualification'

  await supabaseAdmin.from('referral_tracking').insert({
    referred_user_id: referredUserId,
    referral_code: referralCode.toUpperCase(),
    referrer_id: referrerId,
    status: 'pending',
    redemption_kind: redemptionKind,
    redeemer_email_domain: extractEmailDomain(redeemerEmail),
    redeemer_ip_hash: redeemerIpHash ?? null,
  })

  await supabaseAdmin
    .from('referral_codes')
    .update({ is_used: true, used_by: referredUserId, used_at: new Date().toISOString() })
    .eq('id', codeRow.id)

  return { ok: true, redemptionKind }
}

// ── Stripe reward appliceren ──────────────────────────────────────────────────

type RewardMethod =
  | 'monthly_coupon'
  | 'yearly_refund'
  | 'no_subscription_notified'
  | 'skipped'

interface RewardResult {
  method: RewardMethod
  detail?: string
}

/**
 * Past de Stripe-beloning toe voor mijlpaal 3 of 5.
 *
 * - Maandabonnee  → coupon op lopend abonnement (volgende factuur gratis)
 * - Jaarabonnee   → proportionele refund (1 of 2 maanden van jaarbedrag)
 * - Geen abonnement (eenmalig/free) → in-app notificatie + mail met uitleg
 *
 * Gooit nooit — fouten worden gelogd en teruggegeven als detail.
 */
async function applyReferralReward(params: {
  referrerId: string
  referrerEmail: string
  milestone: number
}): Promise<RewardResult> {
  const { referrerId, referrerEmail, milestone } = params
  const def = MILESTONES[milestone]
  if (!def?.coupon || !def.months) return { method: 'skipped' }

  const couponId   = def.coupon
  const months     = def.months
  const monthLabel = months === 1 ? '1 maand' : '2 maanden'

  try {
    // Zoek actief abonnement
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id, plan')
      .eq('user_id', referrerId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // ── Maandabonnee: coupon toepassen ──────────────────────────────────────
    // In Stripe API 2025-03-31.basil is 'coupon' vervangen door 'discounts'.
    if (sub?.stripe_subscription_id && sub.plan === 'monthly') {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        discounts: [{ coupon: couponId }],
      })

      await Promise.allSettled([
        createNotification({
          userId: referrerId,
          title: `Beloning: ${monthLabel} gratis`,
          message: `Je hebt mijlpaal ${milestone} bereikt! Je volgende ${monthLabel === '1 maand' ? 'maand is' : '2 maanden zijn'} gratis. Dit wordt automatisch verwerkt op je volgende factuur.`,
          type: 'success',
        }),
        sendRewardEmail(referrerEmail, milestone, monthLabel, 'monthly'),
      ])

      return { method: 'monthly_coupon', detail: sub.stripe_subscription_id }
    }

    // ── Jaarabonnee: proportionele refund ────────────────────────────────────
    if (sub?.stripe_subscription_id && sub.plan === 'yearly') {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
      const latestInvoiceId = stripeSub.latest_invoice as string | null

      if (!latestInvoiceId) {
        console.error('[referral] jaarabonnee: geen latest_invoice gevonden')
        return { method: 'yearly_refund', detail: 'no_invoice' }
      }

      const invoice = await stripe.invoices.retrieve(latestInvoiceId)
      // charge kan string | Stripe.Charge | null zijn — normaliseer naar string
      const chargeRaw = (invoice as unknown as { charge?: unknown }).charge
      const chargeId = typeof chargeRaw === 'string' ? chargeRaw : null

      if (!chargeId) {
        console.error('[referral] jaarabonnee: geen charge op invoice')
        return { method: 'yearly_refund', detail: 'no_charge' }
      }

      // 1/12 of 2/12 van het betaalde jaarbedrag
      const refundCents = Math.round((invoice.amount_paid / 12) * months)

      if (refundCents <= 0) {
        return { method: 'yearly_refund', detail: 'zero_amount' }
      }

      await stripe.refunds.create({
        charge: chargeId,
        amount: refundCents,
        reason: 'requested_by_customer',
        metadata: {
          reden: `referral_reward_milestone_${milestone}`,
          referrer_id: referrerId,
          maanden: String(months),
        },
      })

      const refundEuro = (refundCents / 100).toFixed(2).replace('.', ',')

      await Promise.allSettled([
        createNotification({
          userId: referrerId,
          title: `Beloning: ${monthLabel} teruggestort`,
          message: `Je hebt mijlpaal ${milestone} bereikt! We storten €${refundEuro} terug op je rekening — dit staat binnen 5-10 werkdagen op je rekening.`,
          type: 'success',
        }),
        sendRewardEmail(referrerEmail, milestone, monthLabel, 'yearly', refundEuro),
      ])

      return { method: 'yearly_refund', detail: `${refundCents} ct` }
    }

    // ── Geen actief abonnement: notificeer voor handmatige upgrade ───────────
    await Promise.allSettled([
      createNotification({
        userId: referrerId,
        title: `Beloning: ${monthLabel} gratis`,
        message: `Je hebt mijlpaal ${milestone} bereikt en verdient ${monthLabel} gratis toegang. Upgrade naar een abonnement — je eerste ${monthLabel === '1 maand' ? 'maand is' : '2 maanden zijn'} gratis met code ${couponId}.`,
        type: 'success',
      }),
      sendRewardEmail(referrerEmail, milestone, monthLabel, 'no_subscription', undefined, couponId),
    ])

    return { method: 'no_subscription_notified', detail: couponId }

  } catch (err) {
    console.error(`[referral] applyReferralReward milestone ${milestone} fout:`, err)
    return { method: 'skipped', detail: err instanceof Error ? err.message : String(err) }
  }
}

// ── Reward e-mail ─────────────────────────────────────────────────────────────

async function sendRewardEmail(
  email: string,
  milestone: number,
  monthLabel: string,
  planType: 'monthly' | 'yearly' | 'no_subscription',
  refundEuro?: string,
  couponCode?: string,
): Promise<void> {
  const subjectEmoji = milestone === 3 ? '🎉' : '⭐'
  const subject = `${subjectEmoji} Beloning verdiend: ${monthLabel} gratis DBA Kompas`

  const bodyPerPlan: Record<string, string> = {
    monthly: `
      <p>Je hebt <strong>${milestone} succesvolle doorverwijzingen</strong> gedaan!</p>
      <p>Als beloning is je volgende ${monthLabel === '1 maand' ? 'maand' : '2 maanden'} gratis.
      Dit wordt automatisch verwerkt op je eerstvolgende factuur — je hoeft zelf niets te doen.</p>
    `,
    yearly: `
      <p>Je hebt <strong>${milestone} succesvolle doorverwijzingen</strong> gedaan!</p>
      <p>Als beloning ontvang je een terugbetaling van <strong>€${refundEuro}</strong> (${monthLabel} van je jaarabonnement).
      Dit staat binnen 5–10 werkdagen op je rekening.</p>
    `,
    no_subscription: `
      <p>Je hebt <strong>${milestone} succesvolle doorverwijzingen</strong> gedaan!</p>
      <p>Als beloning krijg je <strong>${monthLabel} gratis toegang</strong> tot DBA Kompas.
      Gebruik de code <strong>${couponCode}</strong> bij het afsluiten van een abonnement
      en je eerste ${monthLabel === '1 maand' ? 'maand is' : '2 maanden zijn'} gratis.</p>
      <p><a href="https://dbakompas.nl/upgrade" style="display:inline-block;background:#1e3a5f;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:600;">Abonnement afsluiten</a></p>
    `,
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a;background:#f5f5f5;margin:0;padding:0;">
<div style="max-width:540px;margin:0 auto;padding:24px;">
  <div style="background:#1e3a5f;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
    <div style="font-size:13px;opacity:0.8;margin-bottom:4px;">DBA Kompas — Referral beloning</div>
    <div style="font-size:20px;font-weight:700;">${subjectEmoji} ${monthLabel} gratis — mijlpaal ${milestone} bereikt!</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    ${bodyPerPlan[planType] ?? bodyPerPlan['no_subscription']}
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0;">
    <p style="font-size:12px;color:#6b7280;">
      Vragen? Stuur een mail naar <a href="mailto:info@dbakompas.nl">info@dbakompas.nl</a>.
    </p>
  </div>
</div>
</body></html>`

  const text = `DBA Kompas — Beloning ontvangen\n\nJe hebt ${milestone} succesvolle doorverwijzingen gedaan.\n${
    planType === 'monthly'
      ? `Je volgende ${monthLabel} is gratis op je abonnement.`
      : planType === 'yearly'
        ? `We storten €${refundEuro} terug op je rekening.`
        : `Gebruik code ${couponCode} bij het afsluiten van een abonnement.`
  }\n\nDBA Kompas — dbakompas.nl`

  await sendEmail({ to: email, subject, html, text })
}

// ── Referral kwalificeren na betaling ─────────────────────────────────────────

export async function qualifyReferral(params: {
  referredUserId: string
  checkoutSessionId: string
  referrerEmail?: string | null
}): Promise<void> {
  const { referredUserId, checkoutSessionId, referrerEmail } = params

  const { data: tracking } = await supabaseAdmin
    .from('referral_tracking')
    .select('id, referrer_id, status')
    .eq('referred_user_id', referredUserId)
    .single()

  if (!tracking) return
  if (tracking.status !== 'pending') return

  const referrerId = tracking.referrer_id

  await supabaseAdmin
    .from('referral_tracking')
    .update({ status: 'qualified', checkout_session_id: checkoutSessionId })
    .eq('id', tracking.id)

  const { count } = await supabaseAdmin
    .from('referral_tracking')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('status', 'qualified')

  const totalQualified = count ?? 0

  // Haal referrer-email op als die niet meegegeven is
  const resolvedEmail = referrerEmail ?? (await (async () => {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('user_id', referrerId)
      .single()
    return data?.email ?? null
  })())

  let highestRewardedMilestone = 0

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

    // ── Reward opslaan ─────────────────────────────────────────────────────
    await supabaseAdmin.from('referral_rewards').insert({
      referrer_id: referrerId,
      referred_id: referredUserId,
      milestone,
      reward_type: rewardDef.reward_type,
      stripe_coupon_id: rewardDef.coupon ?? null,
    })

    // ── Mijlpaal 1: gratis analyse credit ──────────────────────────────────
    if (rewardDef.reward_type === 'free_check') {
      await supabaseAdmin.from('one_time_purchases').insert({
        user_id: referrerId,
        product_type: 'referral_free_check',
        status: 'granted',
        stripe_checkout_session_id: `referral_milestone_${milestone}_${referrerId}`,
      })
      // In-app notificatie
      await createNotification({
        userId: referrerId,
        title: 'Beloning: 1 gratis analyse',
        message: 'Je hebt je eerste succesvolle referral gedaan! Je kunt nu een extra DBA-analyse uitvoeren.',
        type: 'success',
      }).catch(err => console.error('[referral] notificatie milestone 1 mislukt:', err))
    }

    // ── Mijlpaal 3 + 5: Stripe reward ─────────────────────────────────────
    if ((milestone === 3 || milestone === 5) && resolvedEmail) {
      const result = await applyReferralReward({
        referrerId,
        referrerEmail: resolvedEmail,
        milestone,
      })
      console.log(`[referral] milestone ${milestone} reward applied:`, result.method, result.detail ?? '')
    }

    // ── Loops event ────────────────────────────────────────────────────────
    if (resolvedEmail) {
      await sendLoopsEvent(`referral_milestone_${milestone}` as Parameters<typeof sendLoopsEvent>[0], {
        email: resolvedEmail,
        userId: referrerId,
        properties: { milestone, reward_type: rewardDef.reward_type },
        dedupKey: `referral-reward-${referrerId}-${milestone}`,
      }).catch((err) =>
        console.error(`[referral] Loops event referral_milestone_${milestone} mislukt:`, err)
      )
    }

    highestRewardedMilestone = milestone
  }

  // Markeer tracking als 'rewarded' als er een beloning is toegekend
  if (highestRewardedMilestone > 0) {
    await supabaseAdmin
      .from('referral_tracking')
      .update({ status: 'rewarded' })
      .eq('id', tracking.id)
  }

  // ── v2: staffel-window bijwerken (alleen voor share-redemptions) ────────────
  // Welcome-redemptions tellen niet mee voor de staffel, dus we filteren op
  // redemption_kind. Onbekende/oude rijen worden als 'share' behandeld.
  const { data: kindRow } = await supabaseAdmin
    .from('referral_tracking')
    .select('redemption_kind')
    .eq('id', tracking.id)
    .single()

  const isShareRedemption =
    !kindRow?.redemption_kind || kindRow.redemption_kind === 'share_pending_qualification'

  if (isShareRedemption) {
    try {
      await recordSuccessfulReferral({ referrerUserId: referrerId })
    } catch (err) {
      console.error('[referral] recordSuccessfulReferral fout:', err)
    }

    // share_codes_redeemed mirrorveld op profiles bijwerken (best effort)
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('share_codes_redeemed, first_successful_referral_at')
        .eq('user_id', referrerId)
        .single()

      const current = profile?.share_codes_redeemed ?? 0
      const updates: Record<string, unknown> = { share_codes_redeemed: current + 1 }
      if (!profile?.first_successful_referral_at) {
        updates.first_successful_referral_at = new Date().toISOString()
      }

      await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('user_id', referrerId)
    } catch (err) {
      console.error('[referral] profiles share_codes_redeemed update fout:', err)
    }
  }
}

// ── Statistieken voor widget ──────────────────────────────────────────────────

export interface ReferralCode {
  id: string
  code: string
  isUsed: boolean
  usedAt: string | null
  expiresAt: string | null
}

export interface ReferralStats {
  codes: ReferralCode[]
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
