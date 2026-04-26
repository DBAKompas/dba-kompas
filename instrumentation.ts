/**
 * Next.js Instrumentation Hook
 *
 * Initialiseert Sentry op server- en edge-runtime.
 * Wordt automatisch geladen door Next.js 15+ zonder extra config.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

/**
 * Vangt request-fouten op in server components en route handlers.
 * Beschikbaar in Next.js 15+.
 */
// onRequestError beschikbaar vanaf Sentry SDK v8+ — skip als niet aanwezig in deze versie
