'use server'

/**
 * Server action voor /auth/welcome/<token> (KI-020-A).
 *
 * Dit is de "direct-inloggen-zonder-wachtwoord"-tak van de welkomstmail.
 * Op klik genereren we server-side een verse Supabase-magic-link en
 * redirecten we de klant naar die URL. Omdat de klant net zélf heeft
 * geklikt (POST), is er geen tijd voor Gmail's SafeBrowsing om het
 * Supabase-token voor te klikken. Supabase's verify-endpoint wisselt
 * de magic-link in voor een sessie en redirect naar /auth/callback.
 */

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateWelcomeToken, markWelcomeTokenUsed } from '@/lib/auth/welcome-token-server'

export type WelcomeActionState = {
  error?: string
}

function safeAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '')
}

export async function startMagicLinkAction(
  _prev: WelcomeActionState,
  formData: FormData,
): Promise<WelcomeActionState> {
  const token = String(formData.get('token') ?? '')

  const state = await validateWelcomeToken(token)
  if (!state.ok) {
    console.error('[auth/welcome] token-validatie faalde:', state.reason)
    return {
      error:
        'Deze inloglink is niet (meer) geldig. Vraag een nieuwe inloglink aan via het inlogscherm.',
    }
  }

  const { userId, email } = state.payload

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${safeAppUrl()}/auth/callback?next=/dashboard`,
    },
  })
  const actionLink = data?.properties?.action_link
  if (error || !actionLink) {
    console.error('[auth/welcome] generateLink faalde:', error?.message)
    return {
      error:
        'We konden geen nieuwe inloglink maken. Ga naar /login en vraag een magic link aan.',
    }
  }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  try {
    await markWelcomeTokenUsed({
      jti: state.payload.jti,
      userId,
      purpose: 'magiclink',
      ip,
    })
  } catch (e) {
    // Audit-failure mag de klant niet tegenhouden; log en ga door.
    console.error('[auth/welcome] markWelcomeTokenUsed faalde:', e)
  }

  // redirect moet buiten try/catch. Externe Supabase-URL is toegestaan.
  redirect(actionLink)
}
