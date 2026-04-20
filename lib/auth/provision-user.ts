/**
 * provision-user.ts — post-payment user-provisioning voor guest-checkout flow (KI-020).
 *
 * Gebruikt door de Stripe webhook (`handleCheckoutCompleted`) wanneer een
 * checkout voltooid is zonder vooraf ingelogde user. De e-mail is dan bekend
 * via `session.metadata.guest_email` (gezet door `/api/billing/checkout-guest`
 * en `/api/one-time/checkout-guest`).
 *
 * Gedrag:
 * - Lookup op `profiles.email` (lowercase genormaliseerd).
 * - Bestaande user -> gebruik bestaande userId, genereer verse magic link.
 * - Nieuwe user -> `admin.createUser` met `email_confirm: true` en een
 *   cryptografisch sterke random string als wachtwoord (wordt niet gebruikt).
 *   De `on_auth_user_created` trigger vult automatisch `public.profiles`.
 * - Magic link wordt gegenereerd via `auth.admin.generateLink({type: 'magiclink'})`
 *   met een `redirectTo` die via `/auth/callback?next=/dashboard` de klant
 *   ingelogd op het dashboard laat landen.
 *
 * Beveiliging:
 * - Alleen aanroepen vanuit webhook na geverifieerde Stripe-signature.
 * - Bestaand e-mailadres wordt NOOIT overschreven. Aankoop wordt aan bestaand
 *   account gekoppeld; de bestaande user blijft eigenaar.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

export type ProvisionUserResult = {
  userId: string
  magicLink: string
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
 * Provisioneer een user op basis van een e-mailadres en geef een magic link terug.
 * Gooit bij harde fouten (kon niet aanmaken, kon link niet genereren).
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
    // Lang random wachtwoord; wordt niet gedeeld met de klant. Klant logt via magic link.
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

  // 3. Magic link genereren voor 1-klik login vanuit de welkomstmail
  const cleanAppUrl = appUrl.replace(/\/+$/, '')
  const redirectTo = `${cleanAppUrl}/auth/callback?next=/dashboard`

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: { redirectTo },
  })

  const actionLink = linkData?.properties?.action_link
  if (linkError || !actionLink) {
    throw new Error(
      `provisionUserForCheckout: generateLink mislukt voor ${normalizedEmail}: ${linkError?.message ?? 'geen action_link'}`,
    )
  }

  return {
    userId: userId!,
    magicLink: actionLink,
    isNew,
  }
}
