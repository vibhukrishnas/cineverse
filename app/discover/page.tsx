'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TMDBMovie } from '@/types/tmdb.types'
import { MovieCard } from '@/components/movies/movie-card'
import { MovieCardSkeleton } from '@/components/movies/loading-skeletons'
import { Film, Sparkles, Globe } from 'lucide-react'
import { getPersonalizedRecommendations } from '@/app/actions/ai'
import Link from 'next/link'

const GENRES = [
  { id: '28', name: 'Action' },
  { id: '12', name: 'Adventure' },
  { id: '16', name: 'Animation' },
  { id: '35', name: 'Comedy' },
  { id: '80', name: 'Crime' },
  { id: '18', name: 'Drama' },
  { id: '14', name: 'Fantasy' },
  { id: '27', name: 'Horror' },
  { id: '9648', name: 'Mystery' },
  { id: '10749', name: 'Romance' },
  { id: '878', name: 'Sci-Fi' },
  { id: '53', name: 'Thriller' },
]

const LANGUAGES = [
  { code: 'en', name: 'English', region: 'US' },
  { code: 'hi', name: 'Hindi', region: 'IN' },
  { code: 'ta', name: 'Tamil', region: 'IN' },
  { code: 'te', name: 'Telugu', region: 'IN' },
  { code: 'ml', name: 'Malayalam', region: 'IN' },
  { code: 'kn', name: 'Kannada', region: 'IN' },
  { code: 'es', name: 'Spanish', region: 'ES' },
  { code: 'fr', name: 'French', region: 'FR' },
  { code: 'ja', name: 'Japanese', region: 'JP' },
  { code: 'ko', name: 'Korean', region: 'KR' },
]

export default function DiscoverPage() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')
  const [genreMovies, setGenreMovies] = useState<TMDBMovie[]>([])
  const [regionalMovies, setRegionalMovies] = useState<TMDBMovie[]>([])
  const [aiMovies, setAIMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('genres')

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
  }

  const loadGenreMovies = async () => {
    if (selectedGenres.length === 0) {
      setGenreMovies([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/movies/discover?genres=${selectedGenres.join(',')}&page=1`)
      const data = await response.json()
      setGenreMovies(data.results?.slice(0, 12) || [])
    } catch (error) {
      console.error('Failed to load genre movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRegionalMovies = async () => {
    try {
      setLoading(true)
      const lang = LANGUAGES.find(l => l.code === selectedLanguage)
      const response = await fetch(
        `/api/movies/discover?language=${selectedLanguage}&region=${lang?.region || 'US'}&page=1`
      )
      const data = await response.json()
      setRegionalMovies(data.results?.slice(0, 12) || [])
    } catch (error) {
      console.error('Failed to load regional movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAIRecommendations = async () => {
    try {
      setLoading(true)
      const result = await getPersonalizedRecommendations(
        selectedGenres.length > 0 
          ? GENRES.filter(g => selectedGenres.includes(g.id)).map(g => g.name)
          : undefined
      )
      setAIMovies(result.movies || [])
    } catch (error) {
      console.error('Failed to load AI recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'genres') {
      loadGenreMovies()
    } else if (activeTab === 'regional') {
      loadRegionalMovies()
    } else if (activeTab === 'ai') {
      loadAIRecommendations()
    }
  }, [selectedGenres, selectedLanguage, activeTab])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Discover Movies</h1>
        <p className="text-muted-foreground">
          Find your next favorite movie by genre, language, or AI recommendations
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="genres" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            By Genre
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Picks
          </TabsTrigger>
        </TabsList>

        {/* Genre Discovery Tab */}
        <TabsContent value="genres" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Genres</CardTitle>
              <CardDescription>Choose one or more genres to discover movies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(genre => (
                  <Badge
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedGenres.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Movies for You</CardTitle>
                  <CardDescription>
                    Based on your selected genres: {GENRES.filter(g => selectedGenres.includes(g.id)).map(g => g.name).join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <MovieCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : genreMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {genreMovies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No movies found</h3>
                      <p className="text-muted-foreground">
                        Try selecting different genres
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Regional Discovery Tab */}
        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Language</CardTitle>
              <CardDescription>Discover movies in different languages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <Badge
                    key={lang.code}
                    variant={selectedLanguage === lang.code ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedLanguage(lang.code)}
                  >
                    {lang.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.name} Movies
                </CardTitle>
                <CardDescription>Popular movies in this language</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <MovieCardSkeleton key={i} />
                    ))}
                  </div>
                ) : regionalMovies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {regionalMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No movies found</h3>
                    <p className="text-muted-foreground">
                      Unable to load movies for this language
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Personalized movie suggestions based on your watch history
                {selectedGenres.length > 0 && ` filtered by: ${GENRES.filter(g => selectedGenres.includes(g.id)).map(g => g.name).join(', ')}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Filter by genres (optional):</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <Badge
                      key={genre.id}
                      variant={selectedGenres.includes(genre.id) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => toggleGenre(genre.id)}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : aiMovies.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {aiMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add movies to your watchlist to get personalized AI recommendations
                  </p>
                  <Link href="/explore">
                    <Button>Explore Movies</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
