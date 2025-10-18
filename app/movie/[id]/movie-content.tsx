'use client'

import { BackButton } from '@/components/ui/back-button'
import { MovieHero } from '@/components/movies/movie-hero'
import { TrailerSection } from '@/components/movies/trailer-section'
import { RegionalWatchProviders } from '@/components/movies/regional-watch-providers'
import { MovieSocialFeed } from '@/components/movies/movie-social-feed'
import { MovieCastCrew } from '@/components/movies/movie-cast-crew'
import { MovieSounds } from '@/components/movies/movie-sounds'
import { MultipleRatings } from '@/components/movies/multiple-ratings'
import { MovieInfoSidebar } from '@/components/movies/movie-info-sidebar'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { MovieCard } from '@/components/movies/movie-card'
import { TMDBMovie, TMDBMovieDetail } from '@/types/tmdb.types'

interface MovieContentProps {
  movie: TMDBMovieDetail
  credits: any
  similar: { results: TMDBMovie[] }
  posterUrl: string
  backdropUrl: string
  runtime: string
  releaseYear: string | number
  isInWatchlist: boolean
  isInFavorites: boolean
  isAuthenticated: boolean
  currentUserId?: string
}

export function MovieContent({
  movie,
  credits,
  similar,
  posterUrl,
  backdropUrl,
  runtime,
  releaseYear,
  isInWatchlist,
  isInFavorites,
  isAuthenticated,
  currentUserId,
}: MovieContentProps) {
  return (
    <>
      {/* Back Button - Positioned over the hero */}
      <div className="container mx-auto px-4 relative z-10 -mt-16">
        <BackButton fallbackUrl="/explore" className="bg-background/80 backdrop-blur-sm hover:bg-background" />
      </div>

      {/* Movie Info Section */}
      <div className="py-8">
        <MovieHero
          movieId={movie.id}
          movieTitle={movie.title}
          tagline={movie.tagline}
          genres={movie.genres}
          voteAverage={movie.vote_average}
          releaseYear={releaseYear}
          runtime={runtime}
          overview={movie.overview}
          posterUrl={posterUrl}
          backdropUrl={backdropUrl}
          isInWatchlist={isInWatchlist}
          isInFavorites={isInFavorites}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 70% */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {movie.overview || 'No overview available.'}
              </p>
            </section>

            {/* Multiple Ratings */}
            <section>
              <MultipleRatings
                tmdbRating={movie.vote_average}
                tmdbVotes={movie.vote_count}
                imdbId={movie.imdb_id || undefined}
                movieTitle={movie.title}
                movieYear={releaseYear as number}
              />
            </section>

            {/* Cast & Crew */}
            {credits.cast.length > 0 && (
              <section>
                <MovieCastCrew cast={credits.cast} crew={credits.crew} />
              </section>
            )}

            {/* Movie Songs/Soundtrack */}
            <section>
              <MovieSounds
                movieTitle={movie.title}
                movieId={movie.id}
              />
            </section>

            {/* YouTube Trailers & Content */}
            <section>
              <TrailerSection 
                movieTitle={movie.title}
                movieId={movie.id}
                releaseYear={releaseYear as number}
              />
            </section>

            {/* Where to Watch */}
            <section>
              <RegionalWatchProviders 
                movieId={movie.id}
                movieTitle={movie.title}
              />
            </section>

            {/* Social Buzz */}
            <section>
              <MovieSocialFeed 
                movieId={movie.id}
                movieTitle={movie.title}
                movieYear={releaseYear as number}
              />
            </section>

            {/* Similar Movies */}
            {similar.results.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-2">Similar Movies</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on genre, themes, and viewer preferences
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {similar.results
                    .filter(m => m.vote_count > 50 && m.vote_average > 6)
                    .slice(0, 8)
                    .map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <section>
              <ReviewsSection movieId={movie.id} currentUserId={currentUserId} />
            </section>
          </div>

          {/* Sidebar - 30% */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <MovieInfoSidebar
                movie={movie}
                posterUrl={posterUrl}
                runtime={runtime}
                releaseYear={releaseYear}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
