/**
 * provision-user.ts - post-payment user-provisioning voor guest-checkout flow
 * (KI-020 + KI-020-A).
 *
 * Gebruikt door de Stripe webhook (`handleCheckoutCompleted`) wanneer een
 * checkout voltooid is zonder vooraf ingelogde user. De e-mail is bekend
 * via `session.metadata.guest_email` (gezet door `/api/billing/checkout-guest`
 * en `/api/one-time/checkout-guest`).
 *
 * Gedrag:
 * - Lookup op `profiles.email` (lowercase genormaliseerd).
 * - Bestaande user -> gebruik bestaande userId.
 * - Nieuwe user -> `admin.createUser` met `email_confirm: true` en een
 *   cryptografisch sterke random string als wachtwoord (wordt niet gebruikt).
 *   De `on_auth_user_created` trigger vult automatisch `public.profiles`.
 * - Voor de welkomstmail genereren we een eigen welcome-token en geven
 *   twee URLs terug:
 *     - `activateUrl` -> /auth/activate/<token>  (wachtwoord kiezen)
 *     - `loginUrl`    -> /auth/welcome/<token>   (direct-inloggen via verse magic link)
 *   Het token is HMAC-signed en persistent gelogd in `public.welcome_tokens`
 *   voor auditability en revocation (KI-020-A).
 *
 * Beveiliging:
 * - Alleen aanroepen vanuit webhook na geverifieerde Stripe-signature.
 * - Bestaand e-mailadres wordt NOOIT overschreven. Aankoop wordt aan bestaand
 *   account gekoppeld; de bestaande user blijft eigenaar.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { issueWelcomeToken } from '@/lib/auth/welcome-token-server'

export type ProvisionUserResult = {
  userId: string
  /** URL naar /auth/activate/<token> (wachtwoord kiezen). */
  activateUrl: string
  /** URL naar /auth/welcome/<token> (direct inloggen met verse magic link). */
  loginUrl: string
  isNew: boolean
}

/**
 * Normaliseer een e-mailadres voor lookup (trim + lowercase).
 * Exporteren zodat andere code dezelfde normalisatie kan gebruiken.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Provisioneer een user op basis van een e-mailadres en geef de twee
 * welkomst-URL's terug. Gooit bij harde fouten.
 */
export async function provisionUserForCheckout({
  email,
  appUrl,
}: {
  email: string
  appUrl: string
}): Promise<ProvisionUserResult> {
  const normalizedEmail = normalizeEmail(email)

  // 1. Lookup bestaande profile op e-mail (case-insensitive via lowercase-kolom)
  const { data: existingProfile, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (lookupError && lookupError.code !== 'PGRST116') {
    throw new Error(
      `provisionUserForCheckout: profile lookup mislukt voor ${normalizedEmail}: ${lookupError.message}`,
    )
  }

  let userId = existingProfile?.user_id as string | undefined
  const isNew = !userId

  // 2. Nieuwe user aanmaken indien niet bestaand
  if (!userId) {
    // Lang random wachtwoord; wordt niet gedeeld met de klant. Klant kiest
    // zelf via /auth/activate, of logt in via magic link.
    const randomPassword = `${randomBytes(24).toString('hex')}!Aa1`
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      password: randomPassword,
    })
    if (error || !data?.user) {
      throw new Error(
        `provisionUserForCheckout: admin.createUser mislukt voor ${normalizedEmail}: ${error?.message ?? 'onbekende fout'}`,
      )
    }
    userId = data.user.id
  }

  // 3. Welcome-token uitgeven + beide URL's samenstellen (KI-020-A).
  const cleanAppUrl = appUrl.replace(/\/+$/, '')
  const token = await issueWelcomeToken({
    userId: userId!,
    email: normalizedEmail,
  })
  const encoded = encodeURIComponent(token)

  return {
    userId: userId!,
    activateUrl: `${cleanAppUrl}/auth/activate/${encoded}`,
    loginUrl:    `${cleanAppUrl}/auth/welcome/${encoded}`,
    isNew,
  }
}
