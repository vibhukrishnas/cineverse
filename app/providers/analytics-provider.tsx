// PostHog Analytics Provider for CineVerse
// Wrap your app with this provider to enable analytics

'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackPageView } from '@/lib/analytics/posthog'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog()
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
