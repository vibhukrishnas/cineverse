'use client'

import { useEffect } from 'react'
import { analytics } from '@/lib/analytics/posthog'
import { logMovieView } from '@/app/actions/activity'

interface MoviePageClientProps {
  movieId: number
  movieTitle: string
  children: React.ReactNode
}

export function MoviePageClient({ movieId, movieTitle, children }: MoviePageClientProps) {
  useEffect(() => {
    // Track movie page view
    analytics.movieViewed(movieId, movieTitle)
    
    // Log activity for recent activity feed
    logMovieView(movieId, movieTitle).catch(error => {
      console.error('Failed to log movie view:', error)
    })
  }, [movieId, movieTitle])

  return <>{children}</>
}
