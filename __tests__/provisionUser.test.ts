import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Supabase admin mock ──────────────────────────────────────────────────────
// We mocken `@/lib/supabase/admin` zodat we `from(...)` en `auth.admin` kunnen
// besturen vanuit de tests. Elke test herconfigureert de relevante mock-chain.

type ProfileLookupResult = {
  data: { user_id: string } | null
  error: { code?: string; message: string } | null
}

const lookup = {
  maybeSingle: vi.fn<() => Promise<ProfileLookupResult>>(),
}
const select = vi.fn(() => ({
  ilike: vi.fn(() => lookup),
}))
const from = vi.fn(() => ({ select }))

const createUser = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => from(...(args as [])),
    auth: {
      admin: {
        createUser: (...args: unknown[]) => createUser(...args),
      },
    },
  },
}))

// ─── Welcome-token server mock (KI-020-A) ─────────────────────────────────────
// `provisionUserForCheckout` roept `issueWelcomeToken` aan i.p.v. Supabase's
// `generateLink` (magic link wordt pas on-click gegenereerd in de server-action
// van /auth/welcome/<token>).

const issueWelcomeToken = vi.fn<
  (args: { userId: string; email: string; ttlSeconds?: number }) => Promise<string>
>()

vi.mock('@/lib/auth/welcome-token-server', () => ({
  issueWelcomeToken: (args: {
    userId: string
    email: string
    ttlSeconds?: number
  }) => issueWelcomeToken(args),
}))

describe('lib/auth/provision-user — normalizeEmail', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('trimt whitespace en zet naar lowercase', async () => {
    const { normalizeEmail } = await import('@/lib/auth/provision-user')
    expect(normalizeEmail('  Foo.BAR@Example.COM  ')).toBe('foo.bar@example.com')
  })

  it('laat reeds-genormaliseerde input ongewijzigd', async () => {
    const { normalizeEmail } = await import('@/lib/auth/provision-user')
    expect(normalizeEmail('test@dbakompas.nl')).toBe('test@dbakompas.nl')
  })
})

describe('lib/auth/provision-user — provisionUserForCheckout (KI-020-A)', () => {
  beforeEach(() => {
    vi.resetModules()
    from.mockClear()
    select.mockClear()
    lookup.maybeSingle.mockReset()
    createUser.mockReset()
    issueWelcomeToken.mockReset()
  })

  it('gebruikt bestaande user wanneer profile gevonden en maakt GEEN nieuwe user aan', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({
      data: { user_id: 'user-existing-123' },
      error: null,
    })
    issueWelcomeToken.mockResolvedValueOnce('signed.token.value')

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    const result = await provisionUserForCheckout({
      email: 'Bestaand@Example.COM',
      appUrl: 'https://dbakompas.nl/',
    })

    expect(createUser).not.toHaveBeenCalled()
    expect(result).toEqual({
      userId: 'user-existing-123',
      activateUrl: 'https://dbakompas.nl/auth/activate/signed.token.value',
      loginUrl: 'https://dbakompas.nl/auth/welcome/signed.token.value',
      isNew: false,
    })
    // Token moet gegenereerd zijn op genormaliseerde (lowercase) e-mail
    expect(issueWelcomeToken).toHaveBeenCalledWith({
      userId: 'user-existing-123',
      email: 'bestaand@example.com',
    })
  })

  it('maakt nieuwe user aan wanneer profile niet bestaat en isNew=true', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    createUser.mockResolvedValueOnce({
      data: { user: { id: 'user-new-456' } },
      error: null,
    })
    issueWelcomeToken.mockResolvedValueOnce('fresh.token.value')

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    const result = await provisionUserForCheckout({
      email: 'nieuw@example.com',
      appUrl: 'https://dbakompas.nl',
    })

    expect(createUser).toHaveBeenCalledOnce()
    const createArgs = createUser.mock.calls[0][0] as {
      email: string
      email_confirm: boolean
      password: string
    }
    expect(createArgs.email).toBe('nieuw@example.com')
    expect(createArgs.email_confirm).toBe(true)
    // Wachtwoord moet een non-triviale lengte hebben (cryptografisch random)
    expect(createArgs.password.length).toBeGreaterThan(20)

    expect(result).toEqual({
      userId: 'user-new-456',
      activateUrl: 'https://dbakompas.nl/auth/activate/fresh.token.value',
      loginUrl: 'https://dbakompas.nl/auth/welcome/fresh.token.value',
      isNew: true,
    })
    expect(issueWelcomeToken).toHaveBeenCalledWith({
      userId: 'user-new-456',
      email: 'nieuw@example.com',
    })
  })

  it('url-encodet de token in de URLs', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({
      data: { user_id: 'user-xyz' },
      error: null,
    })
    // Token met specials die encoded moeten worden
    issueWelcomeToken.mockResolvedValueOnce('abc.def+ghi/jkl=')

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    const result = await provisionUserForCheckout({
      email: 'x@example.com',
      appUrl: 'https://dbakompas.nl',
    })

    expect(result.activateUrl).toBe(
      'https://dbakompas.nl/auth/activate/abc.def%2Bghi%2Fjkl%3D',
    )
    expect(result.loginUrl).toBe(
      'https://dbakompas.nl/auth/welcome/abc.def%2Bghi%2Fjkl%3D',
    )
  })

  it('gooit een fout wanneer profile-lookup een niet-PGRST116 error teruggeeft', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST999', message: 'database down' },
    })

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    await expect(
      provisionUserForCheckout({ email: 'x@example.com', appUrl: 'https://dbakompas.nl' }),
    ).rejects.toThrow(/profile lookup mislukt/)
    expect(createUser).not.toHaveBeenCalled()
    expect(issueWelcomeToken).not.toHaveBeenCalled()
  })

  it('gooit een fout wanneer admin.createUser faalt', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    createUser.mockResolvedValueOnce({
      data: null,
      error: { message: 'email already taken' },
    })

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    await expect(
      provisionUserForCheckout({ email: 'x@example.com', appUrl: 'https://dbakompas.nl' }),
    ).rejects.toThrow(/admin.createUser mislukt/)
    expect(issueWelcomeToken).not.toHaveBeenCalled()
  })

  it('strip trailing slashes van appUrl in beide URLs', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({
      data: { user_id: 'user-123' },
      error: null,
    })
    issueWelcomeToken.mockResolvedValueOnce('tok')

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    const result = await provisionUserForCheckout({
      email: 'x@example.com',
      appUrl: 'https://dbakompas.nl///',
    })

    expect(result.activateUrl).toBe('https://dbakompas.nl/auth/activate/tok')
    expect(result.loginUrl).toBe('https://dbakompas.nl/auth/welcome/tok')
  })
})
