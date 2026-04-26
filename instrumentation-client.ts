/**
 * Next.js Client Instrumentation
 *
 * Initialiseert Sentry op de client (browser).
 * Wordt automatisch geladen door Next.js voor client-side rendering.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import './sentry.client.config'

export { captureRouterTransitionStart } from '@sentry/nextjs'
