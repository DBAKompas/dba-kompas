'use server'

/**
 * Server action voor de /auth/activate/<token>-flow (KI-020-A).
 *
 * Flow:
 *  1. Token uit URL valideren (signature + DB-state).
 *  2. Wachtwoord-policy server-side verifiëren.
 *  3. Wachtwoord zetten via supabaseAdmin.auth.admin.updateUserById.
 *  4. `user_metadata.activated_at` zetten zodat we weten dat deze user
 *     heeft geactiveerd (idempotency + audit).
 *  5. welcome_token markeren als used en resterende openstaande tokens
 *     voor deze user intrekken.
 *  6. Server-side sessie openen via signInWithPassword → cookies gezet.
 *  7. Redirect naar /dashboard.
 */

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { validateWelcomeToken, markWelcomeTokenUsed } from '@/lib/auth/welcome-token-server'

export type ActivateActionState = {
  error?: string
}

export const PASSWORD_MIN_LENGTH = 10
const PASSWORD_REGEX = {
  upper:   /[A-Z]/,
  lower:   /[a-z]/,
  digit:   /[0-9]/,
  special: /[^A-Za-z0-9]/,
}

function validatePassword(password: string, confirm: string): string | null {
  if (password !== confirm) return 'De wachtwoorden komen niet overeen.'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Wachtwoord moet minimaal ${PASSWORD_MIN_LENGTH} tekens bevatten.`
  }
  if (!PASSWORD_REGEX.upper.test(password)) return 'Wachtwoord moet minimaal één hoofdletter bevatten.'
  if (!PASSWORD_REGEX.lower.test(password)) return 'Wachtwoord moet minimaal één kleine letter bevatten.'
  if (!PASSWORD_REGEX.digit.test(password)) return 'Wachtwoord moet minimaal één cijfer bevatten.'
  if (!PASSWORD_REGEX.special.test(password)) return 'Wachtwoord moet minimaal één speciaal teken bevatten.'
  return null
}

export async function activateAccountAction(
  _prev: ActivateActionState,
  formData: FormData,
): Promise<ActivateActionState> {
  const token    = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm  = String(formData.get('confirm') ?? '')

  const pwError = validatePassword(password, confirm)
  if (pwError) return { error: pwError }

  const tokenState = await validateWelcomeToken(token)
  if (!tokenState.ok) {
    // Gebruik een vriendelijke, generieke melding aan client; details in server-log.
    console.error('[auth/activate] token-validatie faalde:', tokenState.reason)
    return {
      error:
        'Deze activatielink is niet (meer) geldig. Vraag een nieuwe inloglink aan via het inlogscherm.',
    }
  }

  const { userId, email } = tokenState.payload

  // Wachtwoord zetten en activated_at markeren in één updateUserById-call.
  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password,
    user_metadata: { activated_at: new Date().toISOString() },
  })
  if (updateErr) {
    console.error('[auth/activate] updateUserById faalde:', updateErr)
    return { error: 'Er ging iets mis bij het opslaan van je wachtwoord. Probeer het opnieuw.' }
  }

  // Token afhandelen (used + overige tokens revoken).
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  try {
    await markWelcomeTokenUsed({
      jti: tokenState.payload.jti,
      userId,
      purpose: 'activate',
      ip,
    })
  } catch (e) {
    // Audit-failure mag de klant niet tegenhouden; log en ga door.
    console.error('[auth/activate] markWelcomeTokenUsed faalde:', e)
  }

  // Sessie openen door in te loggen met het zojuist ingestelde wachtwoord.
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (signInErr) {
    console.error('[auth/activate] signInWithPassword faalde na setPassword:', signInErr)
    return {
      error:
        'Je wachtwoord is opgeslagen, maar automatisch inloggen mislukte. Ga naar het inlogscherm en log in met je e-mailadres en nieuwe wachtwoord.',
    }
  }

  // redirect moet BUITEN try/catch en BUITEN return staan.
  redirect('/dashboard')
}
