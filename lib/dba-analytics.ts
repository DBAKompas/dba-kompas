'use client'

import posthog from 'posthog-js'

/** Landing pagina bekeken */
export function trackLandingPageView(source?: string) {
  posthog.capture('landing_page_view', {
    source: source ?? 'direct',
    utm_source: new URLSearchParams(window.location.search).get('utm_source') ?? undefined,
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium') ?? undefined,
  })
}

/** Prijzenpagina bekeken */
export function trackPricingViewed(fromPage?: string) {
  posthog.capture('pricing_viewed', { from_page: fromPage ?? document.referrer })
}

/** Checkout gestart */
export function trackCheckoutStarted(plan: string, priceEur: number) {
  posthog.capture('checkout_started', { plan, price_eur: priceEur })
}

/** Aankoop voltooid */
export function trackPurchaseCompleted(plan: string, priceEur: number, orderId: string) {
  posthog.capture('purchase_completed', { plan, price_eur: priceEur, order_id: orderId })
}

/** FAQ item geopend */
export function trackFaqOpened(question: string, category?: string) {
  posthog.capture('faq_opened', { question, category })
}

/** Scroll diepte bereikt */
export function trackScrollDepth(page: string, depthPct: 25 | 50 | 75 | 100) {
  posthog.capture('scroll_depth', { page, depth_pct: depthPct })
}

/** Hook voor automatische scroll tracking — voeg toe aan elke marketingpagina */
export function useScrollTracking(pageName: string) {
  if (typeof window === 'undefined') return

  const reached = new Set<number>()
  const checkpoints = [25, 50, 75, 100] as const

  function onScroll() {
    const scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
    for (const pct of checkpoints) {
      if (scrolled >= pct && !reached.has(pct)) {
        reached.add(pct)
        trackScrollDepth(pageName, pct)
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}
