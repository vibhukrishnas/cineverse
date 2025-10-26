'use client'

import { useEffect, useState } from 'react'
import { getAIRecommendations, trackRecommendationClick } from '@/app/actions/recommendations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, TrendingUp, Users, Film } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Recommendation {
  id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  reason: string
  algorithm_type: string
  confidence_score: number
}

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    setIsLoading(true)
    try {
      const recs = await getAIRecommendations(6)
      setRecommendations(recs)
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = async (recId: string, movieId: number) => {
    await trackRecommendationClick(recId)
  }

  const getAlgorithmIcon = (type: string) => {
    switch (type) {
      case 'collaborative':
        return <Users className="h-3 w-3" />
      case 'content_based':
        return <Film className="h-3 w-3" />
      case 'trending':
        return <TrendingUp className="h-3 w-3" />
      default:
        return <Sparkles className="h-3 w-3" />
    }
  }

  const getAlgorithmLabel = (type: string) => {
    switch (type) {
      case 'collaborative':
        return 'Similar users'
      case 'content_based':
        return 'Based on your taste'
      case 'trending':
        return 'Trending'
      default:
        return 'AI Pick'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Loading personalized recommendations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
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
          <CardDescription>
            Start rating movies and adding favorites to get personalized recommendations!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          AI Recommendations
        </CardTitle>
        <CardDescription>
          Personalized picks based on your taste and activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recommendations.map((rec) => (
            <Link
              key={rec.id}
              href={`/movie/${rec.movie_id}`}
              onClick={() => handleClick(rec.id, rec.movie_id)}
              className="group space-y-2"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                {rec.movie_poster ? (
                  <Image
                    src={rec.movie_poster}
                    alt={rec.movie_title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Film className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Confidence Badge */}
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-black/60 text-white backdrop-blur-sm text-xs"
                  >
                    {Math.round(rec.confidence_score * 100)}%
                  </Badge>
                </div>

                {/* Algorithm Type Badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge 
                    variant="default" 
                    className="bg-primary/80 backdrop-blur-sm text-xs gap-1"
                  >
                    {getAlgorithmIcon(rec.algorithm_type)}
                    {getAlgorithmLabel(rec.algorithm_type)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {rec.movie_title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {rec.reason}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
