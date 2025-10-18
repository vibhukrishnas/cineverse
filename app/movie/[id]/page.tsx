import { notFound } from 'next/navigation'
import {
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getMovieVideos,
  getTMDBImageUrl,
} from '@/lib/tmdb/client'
import { TrailerHero } from '@/components/movies/trailer-hero'
import { VideoHero } from '@/components/movies/video-hero'
import { MoviePageClient } from './movie-page-client'
import { MovieContent } from './movie-content'
import { createClient } from '@/lib/supabase/server'
import { isInWatchlist, isInFavorites } from '@/app/actions/watchlist'

interface MoviePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: MoviePageProps) {
  try {
    const movie = await getMovieDetails(parseInt(params.id))
    return {
      title: `${movie.title} - CineVerse`,
      description: movie.overview,
    }
  } catch {
    return {
      title: 'Movie Not Found - CineVerse',
    }
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  try {
    const movieId = parseInt(params.id)
    const [movie, credits, similar, videos] = await Promise.all([
      getMovieDetails(movieId),
      getMovieCredits(movieId),
      getSimilarMovies(movieId, 1), // Get more accurate similar movies
      getMovieVideos(movieId),
    ])

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check watchlist and favorites status
    const [inWatchlist, inFavorites] = await Promise.all([
      isInWatchlist(movieId),
      isInFavorites(movieId),
    ])

    const posterUrl = getTMDBImageUrl(movie.poster_path, 'w500')
    const backdropUrl = movie.backdrop_path 
      ? getTMDBImageUrl(movie.backdrop_path, 'original')
      : posterUrl
    const trailer = videos.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A'
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'

    return (
      <MoviePageClient movieId={movieId} movieTitle={movie.title}>
        <div className="min-h-screen bg-background">
          {/* Auto-Playing Trailer Hero with Scroll Effect */}
          <TrailerHero
            trailerKey={trailer?.key}
            movieTitle={movie.title}
            backdropUrl={backdropUrl}
          />

          {/* Video Hero Section (if videos available) */}
          {videos.results.length > 1 && (
            <div className="border-t mt-8">
              <VideoHero videos={videos.results.slice(1)} movieTitle={movie.title} />
            </div>
          )}

          {/* All interactive content wrapped in client boundary */}
          <MovieContent
            movie={movie}
            credits={credits}
            similar={similar}
            posterUrl={posterUrl}
            backdropUrl={backdropUrl}
            runtime={runtime}
            releaseYear={releaseYear}
            isInWatchlist={inWatchlist}
            isInFavorites={inFavorites}
            isAuthenticated={!!user}
            currentUserId={user?.id}
          />
        </div>
      </MoviePageClient>
    )
  } catch (error) {
    console.error('Failed to load movie:', error)
    notFound()
  }
}
