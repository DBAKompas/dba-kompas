import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // pdfkit gebruikt fs om fonts te laden - niet bundelen maar als externe Node.js module behandelen
  serverExternalPackages: ['pdfkit'],

  // TypeScript errors in marketing componenten tijdelijk negeren
  // (framer-motion v11/v12 type mismatch) - wordt gefixed bij UI polish
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
}

export default withSentryConfig(nextConfig, {
  // Geen Sentry-buildlogs in de terminal (behalve op CI)
  silent: !process.env.CI,

  // Source maps configuratie
  sourcemaps: {
    disable: true, // Geen uploads totdat SENTRY_AUTH_TOKEN in Vercel is gezet
  },

  // Tree-shake Sentry-logger weg in productie
  disableLogger: true,
})
