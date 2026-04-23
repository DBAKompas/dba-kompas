/**
 * welcome-token.ts - HMAC-SHA256 signed tokens voor de post-payment
 * account-activatie en magic-link fallback (KI-020-A).
 *
 * Waarom:
 *  - Het Supabase magic-link-token is one-time en wordt door Gmail's
 *    SafeBrowsing-scanner voorgeklikt, waardoor hij `otp_expired` wordt
 *    vóórdat de klant ooit op de knop drukt.
 *  - Daarom stuurt de welkomstmail geen rauwe Supabase URL meer.
 *    De mail wijst naar /auth/activate/<token> of /auth/welcome/<token>
 *    op het eigen domein. Pas bij een daadwerkelijke POST door de klant
 *    wordt er server-side een sessie of verse Supabase-magic-link gemaakt.
 *  - De token-payload is JSON -> base64url; de signatuur is HMAC-SHA256
 *    over `payload_b64`. Formaat: `<payload_b64>.<sig_b64>`.
 *
 * Auditability / revocability:
 *  - Tokens hebben een `jti` (uuid v4). Elke uitgifte wordt vastgelegd in
 *    `public.welcome_tokens` zodat we ze kunnen revoken en het gebruik
 *    kunnen traceren (wie, wanneer, welk IP, welk doel).
 *  - Verificatie beperkt zich hier tot signatuur + expiry. Revocation-/
 *    used-checks gebeuren in de server actions op basis van de DB-state.
 */

import { createHmac, randomUUID, timingSafeEqual } from 'crypto'

export type WelcomeTokenPayload = {
  /** Jti = unique token id, matches welcome_tokens.jti */
  jti: string
  /** Supabase auth.users.id */
  userId: string
  /** Genormaliseerd e-mailadres (lowercase) */
  email: string
  /** Unix timestamp (seconds) waarop de token verloopt. */
  exp: number
}

export type SignedWelcomeToken = {
  token: string
  payload: WelcomeTokenPayload
}

/** 24 uur in seconden. Ruimte voor langzame klikkers, kort genoeg om risico te beperken. */
export const WELCOME_TOKEN_TTL_SECONDS = 24 * 60 * 60

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

function getSecret(): Buffer {
  const raw = process.env.WELCOME_TOKEN_SECRET
  if (!raw || raw.length < 32) {
    throw new Error(
      'WELCOME_TOKEN_SECRET ontbreekt of is korter dan 32 tekens. Zet een veilige random string in je env.',
    )
  }
  return Buffer.from(raw, 'utf8')
}

function sign(payloadB64: string): string {
  const mac = createHmac('sha256', getSecret()).update(payloadB64).digest()
  return base64urlEncode(mac)
}

/**
 * Genereert een signed welcome token voor een user.
 * Noot: de caller is verantwoordelijk voor het opslaan van het jti in
 * de `welcome_tokens` tabel, zodat we ze kunnen traceren en revoken.
 */
export function signWelcomeToken(params: {
  userId: string
  email: string
  ttlSeconds?: number
}): SignedWelcomeToken {
  const payload: WelcomeTokenPayload = {
    jti: randomUUID(),
    userId: params.userId,
    email: params.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + (params.ttlSeconds ?? WELCOME_TOKEN_TTL_SECONDS),
  }
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'))
  const sig = sign(payloadB64)
  return { token: `${payloadB64}.${sig}`, payload }
}

export type VerifyResult =
  | { ok: true; payload: WelcomeTokenPayload }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' }

/**
 * Verifieert een welcome token. Checkt alleen signatuur + expiry.
 * Revocation/used-checks moeten apart gebeuren tegen de DB.
 */
export function verifyWelcomeToken(token: string): VerifyResult {
  if (typeof token !== 'string' || token.length < 10 || !token.includes('.')) {
    return { ok: false, reason: 'malformed' }
  }
  const [payloadB64, sigB64] = token.split('.')
  if (!payloadB64 || !sigB64) return { ok: false, reason: 'malformed' }

  const expectedSig = sign(payloadB64)
  const a = Buffer.from(expectedSig, 'utf8')
  const b = Buffer.from(sigB64, 'utf8')
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' }
  }

  let payload: WelcomeTokenPayload
  try {
    const json = base64urlDecode(payloadB64).toString('utf8')
    payload = JSON.parse(json) as WelcomeTokenPayload
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (!payload.jti || !payload.userId || !payload.email || !payload.exp) {
    return { ok: false, reason: 'malformed' }
  }

  if (payload.exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  return { ok: true, payload }
}
