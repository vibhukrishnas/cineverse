import Image from 'next/image'
import { Calendar, Clock, Star, DollarSign, Globe, Link2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GenreBadge } from './genre-badge'
import { RatingStars } from './rating-stars'

interface MovieInfoSidebarProps {
  movie: {
    title: string
    tagline?: string | null
    poster_path: string | null
    genres: Array<{ id: number; name: string }>
    release_date: string
    runtime: number | null
    vote_average: number
    vote_count: number
    status: string
    original_language: string
    budget: number
    revenue: number
    homepage?: string | null
  }
  posterUrl: string
  runtime: string
  releaseYear: string | number
}

export function MovieInfoSidebar({ movie, posterUrl, runtime, releaseYear }: MovieInfoSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Poster */}
      <Card className="overflow-hidden">
        <div className="relative aspect-[2/3]">
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover"
          />
        </div>
      </Card>

      {/* Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            Rating
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{movie.vote_average.toFixed(1)}</span>
            <span className="text-muted-foreground">/ 10</span>
          </div>
          <RatingStars rating={movie.vote_average} size="md" />
          <p className="text-sm text-muted-foreground">
            {movie.vote_count.toLocaleString('en-US')} votes
          </p>
        </CardContent>
      </Card>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Release Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(movie.release_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Runtime</p>
                <p className="text-sm text-muted-foreground">{runtime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-sm text-muted-foreground uppercase">
                  {movie.original_language}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Budget</p>
                <p className="text-sm text-muted-foreground">
                  {movie.budget ? `$${movie.budget.toLocaleString('en-US')}` : 'N/A'}
                </p>
              </div>
            </div>

            {movie.revenue > 0 && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Revenue</p>
                  <p className="text-sm text-muted-foreground">
                    ${movie.revenue.toLocaleString('en-US')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Genres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Genres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <GenreBadge key={genre.id} genre={genre.name} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Official Website */}
      {movie.homepage && (
        <Button 
          variant="outline" 
          className="w-full gap-2"
          asChild
        >
          <a href={movie.homepage} target="_blank" rel="noopener noreferrer">
            <Link2 className="h-4 w-4" />
            Official Website
          </a>
        </Button>
      )}

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="secondary">{movie.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
