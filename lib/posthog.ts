/**
 * Server-side PostHog event capture.
 * Fire-and-forget — nooit blokkerend voor de hoofdflow.
 * Gebruikt de PostHog REST API direct zodat posthog-node niet nodig is.
 */

interface CaptureOptions {
  event: string
  distinct_id: string
  properties?: Record<string, unknown>
}

export function captureServerEvent({ event, distinct_id, properties = {} }: CaptureOptions): void {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com').replace(/\/$/, '')

  if (!apiKey) {
    console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set — event not captured:', event)
    return
  }

  fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      event,
      distinct_id,
      properties: {
        $lib: 'server-fetch',
        ...properties,
      },
      timestamp: new Date().toISOString(),
    }),
  }).catch(err => console.error('[PostHog] capture error:', err))
}
