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
const generateLink = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => from(...(args as [])),
    auth: {
      admin: {
        createUser: (...args: unknown[]) => createUser(...args),
        generateLink: (...args: unknown[]) => generateLink(...args),
      },
    },
  },
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

describe('lib/auth/provision-user — provisionUserForCheckout', () => {
  beforeEach(() => {
    vi.resetModules()
    from.mockClear()
    select.mockClear()
    lookup.maybeSingle.mockReset()
    createUser.mockReset()
    generateLink.mockReset()
  })

  it('gebruikt bestaande user wanneer profile gevonden en maakt GEEN nieuwe user aan', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({
      data: { user_id: 'user-existing-123' },
      error: null,
    })
    generateLink.mockResolvedValueOnce({
      data: { properties: { action_link: 'https://dbakompas.nl/auth/action?code=abc' } },
      error: null,
    })

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    const result = await provisionUserForCheckout({
      email: 'Bestaand@Example.COM',
      appUrl: 'https://dbakompas.nl/',
    })

    expect(createUser).not.toHaveBeenCalled()
    expect(result).toEqual({
      userId: 'user-existing-123',
      magicLink: 'https://dbakompas.nl/auth/action?code=abc',
      isNew: false,
    })
    // Magic link moet gegenereerd zijn op genormaliseerde (lowercase) e-mail
    expect(generateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'bestaand@example.com',
      options: { redirectTo: 'https://dbakompas.nl/auth/callback?next=/dashboard' },
    })
  })

  it('maakt nieuwe user aan wanneer profile niet bestaat en isNew=true', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    createUser.mockResolvedValueOnce({
      data: { user: { id: 'user-new-456' } },
      error: null,
    })
    generateLink.mockResolvedValueOnce({
      data: { properties: { action_link: 'https://dbakompas.nl/auth/action?code=xyz' } },
      error: null,
    })

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
      magicLink: 'https://dbakompas.nl/auth/action?code=xyz',
      isNew: true,
    })
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
    expect(generateLink).not.toHaveBeenCalled()
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
    expect(generateLink).not.toHaveBeenCalled()
  })

  it('gooit een fout wanneer generateLink faalt', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({
      data: { user_id: 'user-abc' },
      error: null,
    })
    generateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'rate limited' },
    })

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    await expect(
      provisionUserForCheckout({ email: 'x@example.com', appUrl: 'https://dbakompas.nl' }),
    ).rejects.toThrow(/generateLink mislukt/)
  })

  it('strip trailing slashes van appUrl bij redirectTo', async () => {
    lookup.maybeSingle.mockResolvedValueOnce({
      data: { user_id: 'user-123' },
      error: null,
    })
    generateLink.mockResolvedValueOnce({
      data: { properties: { action_link: 'https://dbakompas.nl/auth/action' } },
      error: null,
    })

    const { provisionUserForCheckout } = await import('@/lib/auth/provision-user')
    await provisionUserForCheckout({
      email: 'x@example.com',
      appUrl: 'https://dbakompas.nl///',
    })

    expect(generateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { redirectTo: 'https://dbakompas.nl/auth/callback?next=/dashboard' },
      }),
    )
  })
})
