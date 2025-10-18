'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPersonalizedRecommendations } from '@/app/actions/ai'
import { MovieCard } from '@/components/movies/movie-card'
import { TMDBMovie } from '@/types/tmdb.types'
import Link from 'next/link'

interface MovieWithAI extends TMDBMovie {
  aiReason?: string
  aiSimilarity?: number
}

export function RecommendationWidget() {
  const [loading, setLoading] = useState(true)
  const [movies, setMovies] = useState<MovieWithAI[]>([])
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const result = await getPersonalizedRecommendations()
      
      if (result.success) {
        setMovies(result.movies || [])
        setMessage(result.message || '')
      } else {
        setError(result.error || 'Failed to load recommendations')
      }
    } catch (err) {
      setError('Failed to load recommendations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Personalized movie suggestions powered by AI</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadRecommendations} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (movies.length === 0 && message) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          <Link href="/explore">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Explore Movies
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          AI Recommendations
        </CardTitle>
        <CardDescription>Movies picked just for you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MovieCard movie={movie} />
              {movie.aiSimilarity && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-primary font-medium">
                  <TrendingUp className="h-3 w-3" />
                  {movie.aiSimilarity}% Match
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        <Button 
          onClick={loadRecommendations} 
          variant="ghost" 
          size="sm" 
          className="w-full mt-4"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Refresh Recommendations
        </Button>
      </CardContent>
    </Card>
  )
}
