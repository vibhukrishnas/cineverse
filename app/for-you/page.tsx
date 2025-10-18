'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getAIRecommendationsByGenres } from '@/app/actions/ai'
import Link from 'next/link'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ALL_LANGUAGES, type LanguagePreference } from '@/lib/location/geolocation'

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]

interface Movie {
  id: number
  title: string
  poster_path: string | null
  vote_average: number
  release_date: string
  overview: string
}

export default function ForYouPage() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('cineverse_language_preference')
    if (saved) {
      setSelectedLanguage(saved)
    }
  }, [])

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode)
    localStorage.setItem('cineverse_language_preference', langCode)
    // Clear recommendations when language changes
    if (recommendations.length > 0) {
      clearRecommendations()
    }
  }

  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    )
  }

  const clearRecommendations = () => {
    setRecommendations([])
    setError(null)
  }

  const getRecommendations = async () => {
    if (selectedGenres.length === 0) return

    setLoading(true)
    setError(null)
    try {
      const genreNames = GENRES
        .filter((g) => selectedGenres.includes(g.id))
        .map((g) => g.name)
      
      console.log('🎬 Requesting AI recommendations for genres:', genreNames, 'language:', selectedLanguage)
      const result = await getAIRecommendationsByGenres(genreNames, 12, selectedLanguage)
      
      if (result.length === 0) {
        setError('No recommendations found. Try selecting different genres or changing the language.')
      } else {
        console.log(`✨ Received ${result.length} AI-powered recommendations`)
        setRecommendations(result)
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      setError('Failed to get recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <h1 className="text-4xl font-bold">For You</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Get personalized movie recommendations powered by Google Gemini AI.
        </p>
        
        {/* Language Selector */}
        <div className="mt-6 flex items-center gap-3 bg-card border rounded-lg p-4 max-w-md">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              Preferred Language
            </label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                {ALL_LANGUAGES.filter(l => l.code !== 'en').map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Genre Selection */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Select Your Favorite Genres</h2>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {GENRES.map((genre) => (
                <label
                  key={genre.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                >
                  <Checkbox
                    checked={selectedGenres.includes(genre.id)}
                    onCheckedChange={() => toggleGenre(genre.id)}
                  />
                  <span className="text-sm font-medium">{genre.name}</span>
                </label>
              ))}
            </div>

            <Button
              onClick={getRecommendations}
              disabled={selectedGenres.length === 0 || loading}
              className="w-full mt-6"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get AI Recommendations
                </>
              )}
            </Button>

            {recommendations.length > 0 && !loading && (
              <Button
                onClick={clearRecommendations}
                variant="outline"
                className="w-full mt-3"
              >
                Clear & Try Again
              </Button>
            )}

            {selectedGenres.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Select at least one genre to get started
              </p>
            )}
            
            {selectedGenres.length > 0 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  ✨ Powered by Google Gemini AI
                </p>
                <p className="text-xs text-purple-500 font-medium">
                  {selectedGenres.length} {selectedGenres.length === 1 ? 'genre' : 'genres'} selected
                </p>
                {selectedLanguage !== 'en' && (
                  <p className="text-xs text-blue-500 font-medium mt-1">
                    🌍 {ALL_LANGUAGES.find(l => l.code === selectedLanguage)?.name} cinema focus
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - AI Recommendations */}
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-semibold">AI-Powered Suggestions</h2>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                <p className="text-lg font-medium">Analyzing your preferences...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Gemini AI is finding the perfect movies for you
                </p>
              </div>
            )}

            {!loading && recommendations.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg">
                  Your movie recommendations will appear here.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Select your favorite genres and click "Get AI Recommendations"
                </p>
              </div>
            )}

            {!loading && recommendations.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <p className="text-sm text-muted-foreground">
                    Found {recommendations.length} personalized recommendations
                  </p>
                  <p className="text-xs text-purple-500 font-medium">
                    ✨ AI Generated
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {recommendations.map((movie) => (
                    <Link
                      key={movie.id}
                      href={`/movie/${movie.id}`}
                      className="group"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                        {movie.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-muted-foreground">No Image</span>
                          </div>
                        )}
                        
                        {/* Rating Badge */}
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full">
                          <span className="text-yellow-500 text-xs font-bold">
                            ★ {movie.vote_average.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-semibold line-clamp-2 group-hover:text-purple-500 transition-colors">
                        {movie.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {movie.release_date?.split('-')[0] || 'N/A'}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

