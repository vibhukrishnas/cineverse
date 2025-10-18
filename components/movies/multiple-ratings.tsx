'use client'

import { useState, useEffect } from 'react'
import { Star, ExternalLink, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface RatingSource {
  name: string
  rating: string
  maxRating: string
  url: string
  logo?: string
  color: string
}

interface MultipleRatingsProps {
  tmdbRating: number
  tmdbVotes: number
  imdbId?: string
  movieTitle: string
  movieYear?: number
}

export function MultipleRatings({
  tmdbRating,
  tmdbVotes,
  imdbId,
  movieTitle,
  movieYear,
}: MultipleRatingsProps) {
  const [loadingRatings, setLoadingRatings] = useState(true)
  const [omdbData, setOmdbData] = useState<any>(null)

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const params = new URLSearchParams()
        if (imdbId) {
          params.append('imdbId', imdbId)
        } else {
          params.append('title', movieTitle)
          if (movieYear) {
            params.append('year', movieYear.toString())
          }
        }

        const response = await fetch(`/api/movies/ratings?${params}`)
        const data = await response.json()
        setOmdbData(data)
      } catch (error) {
        console.error('Failed to fetch ratings:', error)
      } finally {
        setLoadingRatings(false)
      }
    }

    fetchRatings()
  }, [imdbId, movieTitle, movieYear])

  // Generate search URLs for Indian review sites
  const searchQuery = `${movieTitle}${movieYear ? ` ${movieYear}` : ''} movie review`
  
  const ratingSources: RatingSource[] = [
    {
      name: 'TMDb',
      rating: tmdbRating.toFixed(1),
      maxRating: '10',
      url: `https://www.themoviedb.org/search?query=${encodeURIComponent(movieTitle)}`,
      color: 'bg-blue-600',
    },
    {
      name: 'IMDb',
      rating: loadingRatings ? '...' : (omdbData?.imdbRating || 'N/A'),
      maxRating: '10',
      url: imdbId ? `https://www.imdb.com/title/${imdbId}/` : `https://www.imdb.com/find?q=${encodeURIComponent(movieTitle)}`,
      color: 'bg-yellow-600',
    },
    {
      name: 'Rotten Tomatoes',
      rating: loadingRatings ? '...' : (omdbData?.rottenTomatoes || 'N/A'),
      maxRating: '100%',
      url: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(movieTitle)}`,
      color: 'bg-red-600',
    },
    {
      name: 'Metacritic',
      rating: loadingRatings ? '...' : (omdbData?.metacritic || 'N/A'),
      maxRating: '100',
      url: `https://www.metacritic.com/search/${encodeURIComponent(movieTitle)}/`,
      color: 'bg-green-600',
    },
    {
      name: 'Times of India',
      rating: 'N/A',
      maxRating: '5',
      url: `https://timesofindia.indiatimes.com/search?q=${encodeURIComponent(searchQuery)}`,
      color: 'bg-orange-600',
    },
    {
      name: 'Hindustan Times',
      rating: 'N/A',
      maxRating: '5',
      url: `https://www.hindustantimes.com/search?q=${encodeURIComponent(searchQuery)}`,
      color: 'bg-blue-700',
    },
    {
      name: 'GreatAndhra',
      rating: 'N/A',
      maxRating: '5',
      url: `https://www.greatandhra.com/search?q=${encodeURIComponent(movieTitle)}`,
      color: 'bg-purple-600',
    },
    {
      name: 'NDTV',
      rating: 'N/A',
      maxRating: '5',
      url: `https://www.ndtv.com/search?q=${encodeURIComponent(searchQuery)}`,
      color: 'bg-red-700',
    },
    {
      name: 'Bollywood Hungama',
      rating: 'N/A',
      maxRating: '5',
      url: `https://www.bollywoodhungama.com/search/?q=${encodeURIComponent(movieTitle)}`,
      color: 'bg-pink-600',
    },
    {
      name: 'Film Companion',
      rating: 'N/A',
      maxRating: '5',
      url: `https://www.filmcompanion.in/?s=${encodeURIComponent(movieTitle)}`,
      color: 'bg-indigo-600',
    },
  ]

  const getRatingColor = (rating: string, max: string) => {
    if (rating === 'N/A' || rating === '?.?') return 'text-muted-foreground'
    
    const numRating = parseFloat(rating)
    const numMax = parseFloat(max)
    const percentage = (numRating / numMax) * 100
    
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-yellow-500'
    if (percentage >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Ratings from Multiple Sources
        </CardTitle>
        <CardDescription>
          Check reviews from various platforms and critics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {ratingSources.map((source) => (
            <Link
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-full py-2 px-3 rounded-md ${source.color} text-white text-xs font-semibold`}>
                    {source.name}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className={`text-2xl font-bold ${getRatingColor(source.rating, source.maxRating)}`}>
                      {source.rating}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      / {source.maxRating}
                    </div>
                  </div>

                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">TMDb Community Rating:</span>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-bold text-lg">{tmdbRating.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 10</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Based on {tmdbVotes.toLocaleString()} votes
          </p>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          <ExternalLink className="inline h-3 w-3 mr-1" />
          Click on any rating source to view full reviews and details
        </p>
      </CardContent>
    </Card>
  )
}
