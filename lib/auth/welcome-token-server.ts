/**
 * welcome-token-server.ts — server-side validatie van welcome tokens.
 *
 * Combineert de stateless HMAC-check (signatuur + expiry) met de
 * stateful DB-check in `public.welcome_tokens` (uitgegeven? al gebruikt?
 * ingetrokken?). Alleen aanroepen vanuit server components of server
 * actions met service-role toegang.
 */

import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  signWelcomeToken,
  verifyWelcomeToken,
  type WelcomeTokenPayload,
  WELCOME_TOKEN_TTL_SECONDS,
} from './welcome-token'

export type WelcomeTokenState =
  | { ok: true; payload: WelcomeTokenPayload }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'not_found' | 'used' | 'revoked' }

/**
 * Valideert een welcome token vol-uit:
 *  1. HMAC + expiry
 *  2. Aanwezigheid in welcome_tokens
 *  3. Niet al gebruikt
 *  4. Niet ingetrokken
 */
export async function validateWelcomeToken(token: string): Promise<WelcomeTokenState> {
  const cryptoCheck = verifyWelcomeToken(token)
  if (!cryptoCheck.ok) return cryptoCheck

  const { data, error } = await supabaseAdmin
    .from('welcome_tokens')
    .select('jti, used_at, revoked_at, expires_at')
    .eq('jti', cryptoCheck.payload.jti)
    .maybeSingle()

  if (error) {
    // DB-fout; defensief afwijzen.
    return { ok: false, reason: 'not_found' }
  }
  if (!data) return { ok: false, reason: 'not_found' }
  if (data.revoked_at) return { ok: false, reason: 'revoked' }
  if (data.used_at) return { ok: false, reason: 'used' }

  return { ok: true, payload: cryptoCheck.payload }
}

/**
 * Markeer een welcome token als gebruikt en trek gelijktijdig alle
 * andere uitstaande tokens voor deze user in. Zo kan een klant die
 * activate klikt niet daarna ook nog de direct-inlog-link gebruiken
 * (en vice versa), en blokkeren we herbruik van een dubbele mail.
 */
export async function markWelcomeTokenUsed(params: {
  jti: string
  userId: string
  purpose: 'activate' | 'magiclink'
  ip?: string | null
}): Promise<void> {
  const usedAt = new Date().toISOString()

  const { error: useErr } = await supabaseAdmin
    .from('welcome_tokens')
    .update({
      used_at: usedAt,
      used_ip: params.ip ?? null,
      used_purpose: params.purpose,
    })
    .eq('jti', params.jti)
    .is('used_at', null)
  if (useErr) {
    throw new Error(`markWelcomeTokenUsed: update faalde: ${useErr.message}`)
  }

  // Revoke resterende openstaande tokens voor deze user
  await supabaseAdmin
    .from('welcome_tokens')
    .update({
      revoked_at: usedAt,
      revoke_reason: `superseded by ${params.purpose}`,
    })
    .eq('user_id', params.userId)
    .is('used_at', null)
    .is('revoked_at', null)
}

/**
 * Geef een nieuw welcome token uit + persisteer naar welcome_tokens.
 * Returnt het ondertekende token zelf.
 */
export async function issueWelcomeToken(params: {
  userId: string
  email: string
  ttlSeconds?: number
}): Promise<string> {
  const ttl = params.ttlSeconds ?? WELCOME_TOKEN_TTL_SECONDS
  const { token, payload } = signWelcomeToken({
    userId: params.userId,
    email: params.email,
    ttlSeconds: ttl,
  })

  const { error } = await supabaseAdmin.from('welcome_tokens').insert({
    jti: payload.jti,
    user_id: payload.userId,
    email: payload.email,
    expires_at: new Date(payload.exp * 1000).toISOString(),
  })

  if (error) {
    throw new Error(`issueWelcomeToken: insert faalde: ${error.message}`)
  }

  return token
}
