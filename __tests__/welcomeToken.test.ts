import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Zet een deterministisch secret voor alle test-imports.
const TEST_SECRET = 'x'.repeat(48) // minstens 32 tekens, ruim

describe('lib/auth/welcome-token — sign/verify', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.WELCOME_TOKEN_SECRET = TEST_SECRET
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('signt een token met de gevraagde velden en payload-structuur', async () => {
    const { signWelcomeToken } = await import('@/lib/auth/welcome-token')
    const { token, payload } = signWelcomeToken({
      userId: 'user-1',
      email: 'Foo.Bar@Example.COM',
    })

    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    expect(payload.userId).toBe('user-1')
    expect(payload.email).toBe('foo.bar@example.com') // genormaliseerd
    expect(payload.jti).toMatch(/^[0-9a-f-]{36}$/i) // uuid v4-achtig
    // exp moet in de toekomst liggen, ~24u vooruit
    const nowSec = Math.floor(Date.now() / 1000)
    expect(payload.exp).toBeGreaterThan(nowSec)
    expect(payload.exp - nowSec).toBeGreaterThan(60 * 60 * 23) // > 23u
  })

  it('verify accepteert zojuist-gegenereerde token (roundtrip)', async () => {
    const { signWelcomeToken, verifyWelcomeToken } = await import(
      '@/lib/auth/welcome-token'
    )
    const { token, payload } = signWelcomeToken({
      userId: 'user-42',
      email: 'user@dbakompas.nl',
    })

    const result = verifyWelcomeToken(token)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.jti).toBe(payload.jti)
      expect(result.payload.userId).toBe('user-42')
      expect(result.payload.email).toBe('user@dbakompas.nl')
      expect(result.payload.exp).toBe(payload.exp)
    }
  })

  it('genereert unieke jti-waarden bij elke sign-call', async () => {
    const { signWelcomeToken } = await import('@/lib/auth/welcome-token')
    const a = signWelcomeToken({ userId: 'u', email: 'a@x.nl' })
    const b = signWelcomeToken({ userId: 'u', email: 'a@x.nl' })
    expect(a.payload.jti).not.toBe(b.payload.jti)
    expect(a.token).not.toBe(b.token)
  })

  it('returnt "expired" als exp in het verleden ligt', async () => {
    const { signWelcomeToken, verifyWelcomeToken } = await import(
      '@/lib/auth/welcome-token'
    )
    // Token met TTL van 1 seconde, en we spoelen de tijd vooruit.
    const { token } = signWelcomeToken({
      userId: 'u',
      email: 'a@x.nl',
      ttlSeconds: 1,
    })

    // Spoel naar > 1s later
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.now() + 5_000))

    const result = verifyWelcomeToken(token)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
  })

  it('returnt "bad_signature" bij gemanipuleerde payload', async () => {
    const { signWelcomeToken, verifyWelcomeToken } = await import(
      '@/lib/auth/welcome-token'
    )
    const { token } = signWelcomeToken({ userId: 'u', email: 'a@x.nl' })
    const [payloadB64, sig] = token.split('.')

    // Manipuleer de payload: flip een letter, signatuur blijft dezelfde.
    const tampered = `${payloadB64.slice(0, -1)}A.${sig}`
    const result = verifyWelcomeToken(tampered)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('bad_signature')
  })

  it('returnt "bad_signature" bij gemanipuleerde signatuur', async () => {
    const { signWelcomeToken, verifyWelcomeToken } = await import(
      '@/lib/auth/welcome-token'
    )
    const { token } = signWelcomeToken({ userId: 'u', email: 'a@x.nl' })
    const [payloadB64, sig] = token.split('.')
    const tamperedSig = sig.slice(0, -2) + 'AA'
    const result = verifyWelcomeToken(`${payloadB64}.${tamperedSig}`)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('bad_signature')
  })

  it('returnt "malformed" voor lege of te korte input', async () => {
    const { verifyWelcomeToken } = await import('@/lib/auth/welcome-token')
    for (const bad of ['', 'x', 'abc', 'no-dot-inside']) {
      const r = verifyWelcomeToken(bad)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.reason).toBe('malformed')
    }
  })

  it('returnt "malformed" als payload geen geldige JSON is', async () => {
    const { verifyWelcomeToken } = await import('@/lib/auth/welcome-token')
    // "niet-json" base64url-gecodeerd is nog steeds geen JSON na decode.
    // We bouwen zelf een string met geldige HMAC over junk-payload:
    const { createHmac } = await import('crypto')
    const junkPayload = Buffer.from('dit-is-geen-json', 'utf8')
      .toString('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const sig = createHmac('sha256', TEST_SECRET)
      .update(junkPayload)
      .digest('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const tok = `${junkPayload}.${sig}`

    const result = verifyWelcomeToken(tok)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('gooit een error als WELCOME_TOKEN_SECRET ontbreekt', async () => {
    delete process.env.WELCOME_TOKEN_SECRET
    const { signWelcomeToken } = await import('@/lib/auth/welcome-token')
    expect(() =>
      signWelcomeToken({ userId: 'u', email: 'a@x.nl' }),
    ).toThrow(/WELCOME_TOKEN_SECRET/)
  })

  it('gooit een error als WELCOME_TOKEN_SECRET te kort is', async () => {
    process.env.WELCOME_TOKEN_SECRET = 'kort'
    const { signWelcomeToken } = await import('@/lib/auth/welcome-token')
    expect(() =>
      signWelcomeToken({ userId: 'u', email: 'a@x.nl' }),
    ).toThrow(/32 tekens/)
  })

  it('respecteert een custom ttlSeconds', async () => {
    const { signWelcomeToken } = await import('@/lib/auth/welcome-token')
    const { payload } = signWelcomeToken({
      userId: 'u',
      email: 'a@x.nl',
      ttlSeconds: 60,
    })
    const nowSec = Math.floor(Date.now() / 1000)
    expect(payload.exp - nowSec).toBeGreaterThanOrEqual(59)
    expect(payload.exp - nowSec).toBeLessThanOrEqual(61)
  })
})
