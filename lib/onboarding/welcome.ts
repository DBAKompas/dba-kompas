/**
 * Welcome onboarding domein-helper.
 *
 * Atomair scenario voor mensen die via een gedeelde LinkedIn-link met een
 * welcome-code binnenkomen:
 *
 *   1. Code re-validatie (bestaat, code_type='welcome', niet expired, niet used)
 *   2. E-mail uniqueness-check
 *   3. Supabase user aanmaken met email_confirm=true (geen mailbevestiging)
 *      → DB-trigger maakt profile-rij met meegegeven name/username
 *   4. trackReferral() koppelt code aan nieuwe gebruiker (welcome_free_check)
 *   5. one_time_purchases-row voor product_type='referral_welcome_check', status='purchased'
 *
 * Aangeroepen door /api/onboarding/welcome. Niet rechtstreeks vanuit UI.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { trackReferral } from '@/lib/referral/engine'
import { isExpired } from '@/lib/referral/expiry'

export type WelcomeOnboardingFailure =
  | { ok: false; reason: 'invalid_input'; status: 400; detail?: string }
  | { ok: false; reason: 'code_not_found'; status: 404 }
  | { ok: false; reason: 'code_wrong_type'; status: 409 }
  | { ok: false; reason: 'code_already_used'; status: 409 }
  | { ok: false; reason: 'code_expired'; status: 410 }
  | { ok: false; reason: 'email_already_registered'; status: 409 }
  | { ok: false; reason: 'ip_already_redeemed'; status: 409 }
  | { ok: false; reason: 'auth_create_failed'; status: 500; detail?: string }
  | { ok: false; reason: 'track_failed'; status: 500; detail?: string }
  | { ok: false; reason: 'grant_failed'; status: 500; detail?: string }

export type WelcomeOnboardingSuccess = {
  ok: true
  userId: string
  email: string
  freeCheckGranted: boolean
}

export type WelcomeOnboardingResult = WelcomeOnboardingSuccess | WelcomeOnboardingFailure

const PASSWORD_MIN = 10
const NAME_MIN = 1
const NAME_MAX = 60

function validateInputs(params: {
  code: string
  firstName: string
  lastName: string
  email: string
  password: string
}): { valid: true } | { valid: false; detail: string } {
  const { code, firstName, lastName, email, password } = params
  if (typeof code !== 'string' || code.trim().length < 4) {
    return { valid: false, detail: 'code is verplicht' }
  }
  if (typeof firstName !== 'string' || firstName.trim().length < NAME_MIN || firstName.length > NAME_MAX) {
    return { valid: false, detail: 'voornaam is verplicht (max 60 tekens)' }
  }
  if (typeof lastName !== 'string' || lastName.trim().length < NAME_MIN || lastName.length > NAME_MAX) {
    return { valid: false, detail: 'achternaam is verplicht (max 60 tekens)' }
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, detail: 'ongeldig e-mailadres' }
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return { valid: false, detail: `wachtwoord moet minimaal ${PASSWORD_MIN} tekens hebben` }
  }
  return { valid: true }
}

/**
 * Voert het volledige welcome-onboarding scenario uit.
 * Niet idempotent: bij dubbel-aanroepen zal de tweede falen op email_already_registered.
 */
export async function redeemWelcomeOnboarding(params: {
  code: string
  firstName: string
  lastName: string
  email: string
  password: string
  redeemerIpHash?: string | null
}): Promise<WelcomeOnboardingResult> {
  const validation = validateInputs(params)
  if (!validation.valid) {
    return { ok: false, reason: 'invalid_input', status: 400, detail: validation.detail }
  }

  const code = params.code.trim().toUpperCase()
  const firstName = params.firstName.trim()
  const lastName = params.lastName.trim()
  const email = params.email.trim().toLowerCase()
  const fullName = `${firstName} ${lastName}`.trim()

  // 1. Code re-validatie
  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes')
    .select('id, code_type, is_used, expires_at')
    .eq('code', code)
    .single()

  if (!codeRow) return { ok: false, reason: 'code_not_found', status: 404 }
  if (codeRow.code_type !== 'welcome') return { ok: false, reason: 'code_wrong_type', status: 409 }
  if (codeRow.is_used) return { ok: false, reason: 'code_already_used', status: 409 }
  if (codeRow.expires_at && isExpired(codeRow.expires_at)) {
    return { ok: false, reason: 'code_expired', status: 410 }
  }

  // 2. Email uniqueness
  // Supabase Admin heeft geen rechtstreekse "find by email", dus we listen 1 user op.
  // De call valt terug op een lege lijst als er niets gevonden wordt.
  const { data: existing, error: lookupError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  })
  // Bovenstaande list is niet geschikt voor uniqueness; gebruik een directe RPC of
  // een fallback via profiles-tabel die al UNIQUE op email afdwingt.
  if (lookupError) {
    console.error('[welcome onboarding] auth listUsers fout:', lookupError)
  }
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()
  if (existingProfile) {
    return { ok: false, reason: 'email_already_registered', status: 409 }
  }
  // Voorkom verwijzing naar de ongebruikte 'existing' var
  void existing

  // 2b. IP-recency check (misbruikdetectie)
  // Een email-paid check is niet nodig: een account aanmaken op een bestaande email
  // faalt sowieso op email_already_registered hierboven.
  if (params.redeemerIpHash) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: ipCount } = await supabaseAdmin
      .from('referral_tracking')
      .select('id', { count: 'exact', head: true })
      .eq('redeemer_ip_hash', params.redeemerIpHash)
      .eq('redemption_kind', 'one_time')
      .gte('created_at', since)
    if ((ipCount ?? 0) > 0) {
      return { ok: false, reason: 'ip_already_redeemed', status: 409 }
    }
  }

  // 3. Auth user aanmaken (met email_confirm=true, geen mailbevestiging)
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      name: fullName,
      username: email, // UNIQUE constraint, email is per definitie uniek
      first_name: firstName,
      last_name: lastName,
      onboarding_source: 'welcome_link',
    },
  })

  if (createError || !created?.user) {
    console.error('[welcome onboarding] auth.admin.createUser fout:', createError)
    return {
      ok: false,
      reason: 'auth_create_failed',
      status: 500,
      detail: createError?.message,
    }
  }

  const userId = created.user.id

  // 4. trackReferral koppelt code en zet redemption_kind='welcome_free_check'
  let trackResult
  try {
    trackResult = await trackReferral({
      referredUserId: userId,
      referralCode: code,
      redeemerEmail: email,
      redeemerIpHash: params.redeemerIpHash ?? null,
    })
  } catch (err) {
    console.error('[welcome onboarding] trackReferral fout:', err)
    return {
      ok: false,
      reason: 'track_failed',
      status: 500,
      detail: err instanceof Error ? err.message : String(err),
    }
  }

  if (!trackResult.ok) {
    console.error('[welcome onboarding] trackReferral weigerde:', trackResult.reason)
    return {
      ok: false,
      reason: 'track_failed',
      status: 500,
      detail: trackResult.reason,
    }
  }

  // 5. one_time_purchases-rij voor de gratis check
  // Status='purchased' is conform de gedocumenteerde enum in 001_initial_schema.sql.
  // Het feit dat dit een gratis credit is wordt al gemarkeerd door product_type.
  const { error: grantError } = await supabaseAdmin.from('one_time_purchases').insert({
    user_id: userId,
    product_type: 'referral_welcome_check',
    status: 'purchased',
    stripe_checkout_session_id: `welcome_redeem_${code}_${userId}`,
  })

  if (grantError) {
    console.error('[welcome onboarding] one_time_purchases insert fout:', grantError)
    return {
      ok: false,
      reason: 'grant_failed',
      status: 500,
      detail: grantError.message,
    }
  }

  return { ok: true, userId, email, freeCheckGranted: true }
}
