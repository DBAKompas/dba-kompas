import Stripe from 'stripe'

// Lazy initialisatie zodat de build niet crasht bij ontbrekende env var
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is niet ingesteld')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
      typescript: true,
    })
  }
  return _stripe
}

// Backwards-compatible export voor bestaande imports
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})
