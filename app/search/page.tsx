'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MovieCard } from '@/components/movies/movie-card'
import { MovieCardSkeleton } from '@/components/movies/loading-skeletons'
import { searchMovies, getMovieGenres, discoverMovies } from '@/lib/tmdb/client'
import { TMDBMovie, TMDBGenre } from '@/types/tmdb.types'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { analytics } from '@/lib/analytics/posthog'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')

  const { ref, inView } = useInView()

  // Fetch genres on mount
  useEffect(() => {
    async function fetchGenres() {
      try {
        const data = await getMovieGenres()
        setGenres(data.genres)
      } catch (error) {
        console.error('Failed to fetch genres:', error)
      }
    }
    fetchGenres()
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(1, true)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  // Filter change handler
  useEffect(() => {
    if (selectedGenres.length > 0 || selectedYear || selectedRating) {
      performSearch(1, true)
    }
  }, [selectedGenres, selectedYear, selectedRating, sortBy])

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      performSearch(page + 1, false)
    }
  }, [inView])

  async function performSearch(pageNum: number, reset: boolean) {
    setLoading(true)
    try {
      let data

      if (query) {
        data = await searchMovies(query, pageNum)
        // Track search
        if (reset) {
          analytics.searchPerformed(query, data.total_results || 0)
        }
      } else {
        data = await discoverMovies({
          page: pageNum,
          genre: selectedGenres.join(','),
          year: selectedYear,
          voteAverage: selectedRating,
          sortBy,
        })
      }

      if (reset) {
        setMovies(data.results)
        setPage(1)
      } else {
        setMovies((prev) => [...prev, ...data.results])
        setPage(pageNum)
      }

      setHasMore(pageNum < data.total_pages)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    )
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedYear('')
    setSelectedRating('')
    setSortBy('popularity.desc')
  }

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 50 }, (_, i) => currentYear - i)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Search Movies</h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for movies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="sticky top-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Filters</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Sort By */}
                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-2 rounded-md border bg-background"
                      >
                        <option value="popularity.desc">Popularity ↓</option>
                        <option value="popularity.asc">Popularity ↑</option>
                        <option value="vote_average.desc">Rating ↓</option>
                        <option value="vote_average.asc">Rating ↑</option>
                        <option value="release_date.desc">Release Date ↓</option>
                        <option value="release_date.asc">Release Date ↑</option>
                      </select>
                    </div>

                    {/* Genres */}
                    <div className="space-y-2">
                      <Label>Genres</Label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {genres.map((genre) => (
                          <div key={genre.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`genre-${genre.id}`}
                              checked={selectedGenres.includes(genre.id)}
                              onCheckedChange={() => handleGenreToggle(genre.id)}
                            />
                            <Label
                              htmlFor={`genre-${genre.id}`}
                              className="cursor-pointer font-normal"
                            >
                              {genre.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full p-2 rounded-md border bg-background"
                      >
                        <option value="">All Years</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                      <Label>Minimum Rating</Label>
                      <select
                        value={selectedRating}
                        onChange={(e) => setSelectedRating(e.target.value)}
                        className="w-full p-2 rounded-md border bg-background"
                      >
                        <option value="">Any Rating</option>
                        <option value="7">7+ ⭐</option>
                        <option value="8">8+ ⭐⭐</option>
                        <option value="9">9+ ⭐⭐⭐</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Movies Grid */}
          <div className="flex-1">
            {movies.length === 0 && !loading ? (
              <div className="text-center py-20">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No movies found</h2>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {movies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                  {loading &&
                    Array.from({ length: 10 }).map((_, i) => (
                      <MovieCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasMore && <div ref={ref} className="h-10" />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
