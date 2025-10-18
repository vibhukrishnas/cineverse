'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getTMDBImageUrl } from '@/lib/tmdb/client'

interface Movie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  overview: string
}

export function MovieUpdatesWidget() {
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const [newReleases, setNewReleases] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'new'>('new')

  useEffect(() => {
    loadMovies()
  }, [])

  const loadMovies = async () => {
    setLoading(true)
    try {
      // Fetch upcoming and recent releases
      const [upcomingRes, nowPlayingRes] = await Promise.all([
        fetch('/api/movies/upcoming'),
        fetch('/api/movies/now-playing')
      ])

      if (upcomingRes.ok) {
        const upcomingData = await upcomingRes.json()
        setUpcomingMovies(upcomingData.results?.slice(0, 5) || [])
      }

      if (nowPlayingRes.ok) {
        const nowPlayingData = await nowPlayingRes.json()
        setNewReleases(nowPlayingData.results?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Error loading movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentMovies = activeTab === 'new' ? newReleases : upcomingMovies

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Movie Updates
        </CardTitle>
        <CardDescription>Latest releases and upcoming premieres</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'new' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('new')}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Now Playing
          </Button>
          <Button
            variant={activeTab === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('upcoming')}
            className="flex-1"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Coming Soon
          </Button>
        </div>

        {/* Movie List */}
        <div className="space-y-3">
          {loading ? (
            // Loading skeletons
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-16 h-24 bg-muted rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))
          ) : currentMovies.length > 0 ? (
            currentMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="flex gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {/* Poster */}
                <div className="relative w-16 h-24 rounded overflow-hidden flex-shrink-0 bg-muted">
                  {movie.poster_path ? (
                    <Image
                      src={getTMDBImageUrl(movie.poster_path, 'w185')}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-1 mb-1">
                    {movie.title}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(movie.release_date)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-yellow-500">★</span>
                      <span className="text-xs font-medium">
                        {movie.vote_average.toFixed(1)}
                      </span>
                    </div>
                    {activeTab === 'upcoming' && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No movies found</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        {currentMovies.length > 0 && (
          <div className="mt-4">
            <Link href={activeTab === 'new' ? '/explore' : '/explore'} className="block">
              <Button variant="outline" className="w-full" size="sm">
                View All Movies
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
