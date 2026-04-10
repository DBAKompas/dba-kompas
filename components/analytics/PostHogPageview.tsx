'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    const url = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}

// Suspense-wrapper vereist vanwege useSearchParams
export function PostHogPageview() {
  return (
    <Suspense>
      <PageviewTracker />
    </Suspense>
  )
}
