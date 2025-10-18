'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getMovieGenres,
  discoverMovies,
  searchMovies,
} from '@/lib/tmdb/client'
import { TMDBMovie, TMDBGenre } from '@/types/tmdb.types'
import { MovieCard } from '@/components/movies/movie-card'
import { MovieCardSkeleton } from '@/components/movies/loading-skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageCircle, Users, TrendingUp, Search, X } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('trending')
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([])
  const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([])
  const [topRatedMovies, setTopRatedMovies] = useState<TMDBMovie[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<TMDBMovie[]>([])
  const [genreMovies, setGenreMovies] = useState<TMDBMovie[]>([])
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadGenres()
    loadMovies()
  }, [])

  useEffect(() => {
    if (selectedGenres.length > 0) {
      loadGenreMovies()
    } else {
      setGenreMovies([])
    }
  }, [selectedGenres])

  const loadGenres = async () => {
    try {
      const response = await getMovieGenres()
      setGenres(response.genres)
    } catch (error) {
      console.error('Failed to load genres:', error)
    }
  }

  const loadMovies = async () => {
    setIsLoading(true)
    try {
      const [trending, popular, topRated, upcoming] = await Promise.all([
        getTrendingMovies(),
        getPopularMovies(),
        getTopRatedMovies(),
        getUpcomingMovies(),
      ])
      setTrendingMovies(trending.results)
      setPopularMovies(popular.results)
      setTopRatedMovies(topRated.results)
      setUpcomingMovies(upcoming.results)
    } catch (error) {
      console.error('Failed to load movies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGenreMovies = async () => {
    if (selectedGenres.length === 0) return
    setIsLoading(true)
    try {
      const response = await discoverMovies({
        with_genres: selectedGenres.join(','),
        sort_by: 'popularity.desc',
        page: 1,
      })
      setGenreMovies(response.results)
    } catch (error) {
      console.error('Failed to load genre movies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        // Remove genre if already selected
        return prev.filter(id => id !== genreId)
      } else {
        // Add genre
        return [...prev, genreId]
      }
    })
  }

  const clearGenres = () => {
    setSelectedGenres([])
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setIsLoading(true)
    try {
      const response = await searchMovies(query)
      setSearchResults(response.results)
    } catch (error) {
      console.error('Failed to search movies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }

  const getMoviesForTab = () => {
    if (isSearching) {
      return searchResults
    }
    switch (activeTab) {
      case 'trending':
        return trendingMovies
      case 'popular':
        return popularMovies
      case 'top-rated':
        return topRatedMovies
      case 'upcoming':
        return upcomingMovies
      case 'genres':
        return genreMovies
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton fallbackUrl="/" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Explore Movies</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Discover trending, popular, and top-rated movies
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 h-12 text-lg"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isSearching && (
            <div className="mb-4 text-muted-foreground">
              Found {searchResults.length} results for "{searchQuery}"
            </div>
          )}
        </motion.div>

        {/* Quick Links Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Link href="/channels">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Movie Channels</CardTitle>
                <MessageCircle className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Join communities and discuss movies by genre, region, or topic
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/feed">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Social Feed</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See what your friends are watching and reviewing
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/for-you">
            <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">AI Recommendations</CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get personalized movie suggestions powered by AI
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-2">
            <TabsTrigger value="trending" className="text-sm md:text-base">
              🔥 Trending Today
            </TabsTrigger>
            <TabsTrigger value="popular" className="text-sm md:text-base">
              ⭐ Popular
            </TabsTrigger>
            <TabsTrigger value="top-rated" className="text-sm md:text-base">
              🏆 Top Rated
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-sm md:text-base">
              🎬 Upcoming
            </TabsTrigger>
            <TabsTrigger value="genres" className="text-sm md:text-base">
              🎭 By Genre
            </TabsTrigger>
          </TabsList>

          {activeTab === 'genres' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedGenres.length > 0 
                      ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected` 
                      : 'Select one or more genres'}
                  </p>
                  {selectedGenres.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearGenres}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Button
                      key={genre.id}
                      variant={selectedGenres.includes(genre.id) ? 'default' : 'outline'}
                      onClick={() => toggleGenre(genre.id)}
                      className="rounded-full"
                    >
                      {genre.name}
                      {selectedGenres.includes(genre.id) && (
                        <span className="ml-2">✓</span>
                      )}
                    </Button>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          <TabsContent value="trending" className="mt-8">
            <MovieGrid movies={getMoviesForTab()} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="popular" className="mt-8">
            <MovieGrid movies={getMoviesForTab()} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="top-rated" className="mt-8">
            <MovieGrid movies={getMoviesForTab()} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-8">
            <MovieGrid movies={getMoviesForTab()} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="genres" className="mt-8">
            {selectedGenres.length > 0 ? (
              <MovieGrid movies={getMoviesForTab()} isLoading={isLoading} />
            ) : (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">
                  Select one or more genres to explore movies
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface MovieGridProps {
  movies: TMDBMovie[]
  isLoading: boolean
}

function MovieGrid({ movies, isLoading }: MovieGridProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </motion.div>
    )
  }

  if (movies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <p className="text-lg text-muted-foreground">No movies found</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
    >
      {movies.map((movie, index) => (
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <MovieCard movie={movie} />
        </motion.div>
      ))}
    </motion.div>
  )
}
