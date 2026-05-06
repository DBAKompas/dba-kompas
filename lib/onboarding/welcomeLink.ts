import { supabaseAdmin } from '@/lib/supabase/admin'
import { redeemWelcomeOnboarding, WelcomeOnboardingResult } from './welcome'

export type WelcomeLinkRedeemFailure = { ok: false; reason: 'not_eligible' }

export type WelcomeLinkRedeemSuccess = {
  ok: true
  userId: string
  email: string
}

export type WelcomeLinkRedeemResult = WelcomeLinkRedeemSuccess | WelcomeLinkRedeemFailure

export async function redeemWelcomeLink(params: {
  token: string
  firstName: string
  lastName: string
  email: string
  password: string
  redeemerIpHash?: string | null
}): Promise<WelcomeLinkRedeemResult> {
  // 1. Pre-validate token (read-only) — enkel om vroeg te falen
  const { data: linkRow } = await supabaseAdmin
    .from('welcome_links')
    .select('referral_code, used_at, expires_at')
    .eq('token', params.token)
    .maybeSingle()

  if (!linkRow) return { ok: false, reason: 'not_eligible' }
  if (linkRow.used_at) return { ok: false, reason: 'not_eligible' }
  if (linkRow.expires_at && new Date(linkRow.expires_at) < new Date()) {
    return { ok: false, reason: 'not_eligible' }
  }

  // 2. Atomic claim: alleen claim als nog niet gebruikt
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('welcome_links')
    .update({ used_at: new Date().toISOString() })
    .eq('token', params.token)
    .is('used_at', null)
    .select('referral_code')
    .maybeSingle()

  if (claimError || !claimed) {
    return { ok: false, reason: 'not_eligible' }
  }

  // 3. Doorgeven aan bestaande welcome flow
  const result: WelcomeOnboardingResult = await redeemWelcomeOnboarding({
    code: claimed.referral_code,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    password: params.password,
    redeemerIpHash: params.redeemerIpHash ?? null,
  })

  if (!result.ok) {
    // Compensatie: rollback claim zodat de token (theoretisch) hergebruikt kan worden.
    // Idempotent: als al ge-rolled-back, geen-op.
    await supabaseAdmin
      .from('welcome_links')
      .update({ used_at: null })
      .eq('token', params.token)
    console.error('[welcomeLink] redeem fail, claim rolled back:', result.reason)
    return { ok: false, reason: 'not_eligible' }
  }

  // Markeer used_by op de link
  await supabaseAdmin
    .from('welcome_links')
    .update({ used_by: result.userId })
    .eq('token', params.token)

  return { ok: true, userId: result.userId, email: result.email }
}
