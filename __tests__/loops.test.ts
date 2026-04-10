import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Globals ──────────────────────────────────────────────────────────────────
// fetch wordt per suite gemocked via stubGlobal; modules worden gereset zodat
// de module-level LOOPS_API_KEY constant opnieuw wordt geëvalueerd.

describe('lib/loops — updateLoopsContact', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.LOOPS_API_KEY
  })

  it('slaat aanroep over wanneer LOOPS_API_KEY niet geconfigureerd is', async () => {
    delete process.env.LOOPS_API_KEY
    const { updateLoopsContact } = await import('@/lib/loops')

    await updateLoopsContact('test@example.com', { analysis_completed: true })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('stuurt PUT request naar contacts endpoint met juiste headers en body', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { updateLoopsContact } = await import('@/lib/loops')

    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await updateLoopsContact('test@example.com', {
      analysis_completed: true,
      analysis_count: 5,
    })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://app.loops.so/api/v1/contacts/update')
    expect(options.method).toBe('PUT')
    expect(options.headers['Authorization']).toBe('Bearer test-key')
    expect(options.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body)
    expect(body).toEqual({
      email: 'test@example.com',
      analysis_completed: true,
      analysis_count: 5,
    })
  })

  it('slaat duplicate dedup key over en stuurt slechts één request', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { updateLoopsContact } = await import('@/lib/loops')

    mockFetch.mockResolvedValue({ ok: true, text: async () => '' })

    await updateLoopsContact('test@example.com', { analysis_completed: true }, 'dedup-1')
    await updateLoopsContact('test@example.com', { analysis_completed: true }, 'dedup-1')

    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('stuurt wél opnieuw bij verschillende dedup keys', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { updateLoopsContact } = await import('@/lib/loops')

    mockFetch.mockResolvedValue({ ok: true, text: async () => '' })

    await updateLoopsContact('test@example.com', { analysis_completed: true }, 'dedup-a')
    await updateLoopsContact('test@example.com', { analysis_count: 3 }, 'dedup-b')

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('logt fout bij HTTP error en gooit geen exception', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { updateLoopsContact } = await import('@/lib/loops')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    })

    await expect(
      updateLoopsContact('test@example.com', { analysis_completed: true })
    ).resolves.not.toThrow()
  })

  it('logt fout bij netwerkfout en gooit geen exception', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { updateLoopsContact } = await import('@/lib/loops')

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      updateLoopsContact('test@example.com', { analysis_completed: true })
    ).resolves.not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('lib/loops — sendLoopsEvent', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.LOOPS_API_KEY
  })

  it('slaat aanroep over wanneer LOOPS_API_KEY niet geconfigureerd is', async () => {
    delete process.env.LOOPS_API_KEY
    const { sendLoopsEvent } = await import('@/lib/loops')

    await sendLoopsEvent('test_event', { email: 'test@example.com' })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('stuurt POST request naar events endpoint met eventName en email', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await sendLoopsEvent('quick_scan_completed', { email: 'test@example.com' })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://app.loops.so/api/v1/events')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.eventName).toBe('quick_scan_completed')
    expect(body.email).toBe('test@example.com')
  })

  it('voegt userId als string toe wanneer meegegeven', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await sendLoopsEvent('test_event', {
      email: 'test@example.com',
      userId: 'user-abc',
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.userId).toBe('user-abc')
  })

  it('voegt properties toe aan body wanneer aanwezig', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await sendLoopsEvent('quick_scan_completed', {
      email: 'test@example.com',
      properties: { score: 75, risk_level: 'hoog' },
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.properties).toEqual({ score: 75, risk_level: 'hoog' })
  })

  it('laat properties weg uit body wanneer leeg object', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await sendLoopsEvent('test_event', {
      email: 'test@example.com',
      properties: {},
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.properties).toBeUndefined()
  })

  it('slaat duplicate dedup key over voor hetzelfde event', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockResolvedValue({ ok: true, text: async () => '' })

    await sendLoopsEvent('test_event', { email: 'test@example.com', dedupKey: 'key-1' })
    await sendLoopsEvent('test_event', { email: 'test@example.com', dedupKey: 'key-1' })

    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('stuurt wél opnieuw voor dezelfde dedup key bij ander event', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockResolvedValue({ ok: true, text: async () => '' })

    await sendLoopsEvent('event_a', { email: 'test@example.com', dedupKey: 'shared-key' })
    await sendLoopsEvent('event_b', { email: 'test@example.com', dedupKey: 'shared-key' })

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('logt fout bij HTTP error en gooit geen exception', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => 'Unprocessable Entity',
    })

    await expect(
      sendLoopsEvent('test_event', { email: 'test@example.com' })
    ).resolves.not.toThrow()
  })

  it('logt fout bij netwerkfout en gooit geen exception', async () => {
    process.env.LOOPS_API_KEY = 'test-key'
    const { sendLoopsEvent } = await import('@/lib/loops')

    mockFetch.mockRejectedValueOnce(new Error('Timeout'))

    await expect(
      sendLoopsEvent('test_event', { email: 'test@example.com' })
    ).resolves.not.toThrow()
  })
})
