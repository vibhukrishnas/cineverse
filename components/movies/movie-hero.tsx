'use client'

import { Badge } from '@/components/ui/badge'
import { MovieActions } from '@/components/movies/movie-actions'

interface MovieHeroProps {
  movieId: number
  movieTitle: string
  tagline?: string | null
  genres: Array<{ id: number; name: string }>
  voteAverage: number
  releaseYear: string | number
  runtime: string
  overview: string
  posterUrl: string
  backdropUrl: string
  isInWatchlist: boolean
  isInFavorites: boolean
  isAuthenticated: boolean
}

export function MovieHero({
  movieId,
  movieTitle,
  tagline,
  genres,
  voteAverage,
  releaseYear,
  runtime,
  overview,
  posterUrl,
  backdropUrl,
  isInWatchlist,
  isInFavorites,
  isAuthenticated,
}: MovieHeroProps) {
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        {/* Poster */}
        <div className="md:col-span-3">
          <img
            src={posterUrl}
            alt={movieTitle}
            className="w-full rounded-lg shadow-2xl border border-border"
          />
        </div>

        {/* Movie Info */}
        <div className="md:col-span-9 flex flex-col justify-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">{movieTitle}</h1>
          {tagline && (
            <p className="text-lg md:text-xl text-muted-foreground italic">
              {tagline}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 4).map((genre) => (
              <Badge key={genre.id} variant="secondary" className="text-sm">
                {genre.name}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-semibold">{voteAverage.toFixed(1)}</span>
              <span className="text-muted-foreground">/10</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span>{releaseYear}</span>
            <span className="text-muted-foreground">•</span>
            <span>{runtime}</span>
          </div>

          <p className="text-base md:text-lg max-w-3xl">
            {overview}
          </p>

          <MovieActions
            movieId={movieId}
            movieTitle={movieTitle}
            isInWatchlist={isInWatchlist}
            isInFavorites={isInFavorites}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </div>
  )
}
