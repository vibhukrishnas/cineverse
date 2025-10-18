'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { MovieCard } from '@/components/movies/movie-card'
import { getAIMovieRecommendations } from '@/app/actions/ai'
import type { TMDBMovie } from '@/types/tmdb.types'

export function AIRecommendationsWidget() {
  const [recommendations, setRecommendations] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    setLoading(true)
    setError(null)
    
    const result = await getAIMovieRecommendations()
    
    if (result.success) {
      setRecommendations(result.recommendations)
    } else {
      setError(result.error || 'Failed to load recommendations')
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Powered by Google Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Powered by Google Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={loadRecommendations} size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Powered by Google Gemini AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Watch more movies and rate them to get personalized AI recommendations!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Powered by Google Gemini AI</CardDescription>
          </div>
          <Button onClick={loadRecommendations} variant="ghost" size="sm">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recommendations.slice(0, 6).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
