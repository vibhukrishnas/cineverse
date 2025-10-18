import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActorSearchResult } from '@/types/actor'
import { Star, Film } from 'lucide-react'

interface ActorCardProps {
  actor: ActorSearchResult
}

export function ActorCard({ actor }: ActorCardProps) {
  const profileImageUrl = actor.profile_path
    ? `https://image.tmdb.org/t/p/w342${actor.profile_path}`
    : '/placeholder-actor.png'

  const topMovies = actor.known_for?.slice(0, 3) || []

  return (
    <Link href={`/actor/${actor.id}`}>
      <Card className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden h-full">
        {/* Actor Profile Image */}
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <Image
            src={profileImageUrl}
            alt={actor.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>

        {/* Actor Info */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {actor.name}
            </h3>
            <Badge variant="secondary" className="text-xs mt-1">
              {actor.known_for_department}
            </Badge>
          </div>

          {/* Known For Movies */}
          {topMovies.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Film className="h-3 w-3" />
                Known for:
              </p>
              <div className="space-y-1">
                {topMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="line-clamp-1 flex-1">{movie.title}</span>
                    {movie.vote_average && movie.vote_average > 0 && (
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popularity */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Popularity: <span className="font-medium text-foreground">{actor.popularity.toFixed(1)}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Compact version for horizontal lists
export function ActorCardCompact({ actor }: ActorCardProps) {
  const profileImageUrl = actor.profile_path
    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
    : '/placeholder-actor.png'

  return (
    <Link href={`/actor/${actor.id}`}>
      <Card className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
        <div className="flex gap-3 p-3">
          {/* Profile Image */}
          <div className="relative w-16 h-24 rounded overflow-hidden flex-shrink-0 bg-muted">
            <Image
              src={profileImageUrl}
              alt={actor.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          {/* Actor Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {actor.name}
            </h4>
            <Badge variant="secondary" className="text-xs">
              {actor.known_for_department}
            </Badge>
            {actor.known_for && actor.known_for.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {actor.known_for.map((m) => m.title).join(', ')}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
