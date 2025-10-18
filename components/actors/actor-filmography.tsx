import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActorMovieCredit } from '@/types/actor'
import { Star, Calendar } from 'lucide-react'

interface ActorFilmographyProps {
  credits: ActorMovieCredit[]
  type: 'cast' | 'crew'
  actorName: string
}

export function ActorFilmography({ credits, type, actorName }: ActorFilmographyProps) {
  if (credits.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No {type === 'cast' ? 'acting' : 'crew'} credits available.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group by decade
  const creditsByDecade = credits.reduce((acc, credit) => {
    const year = credit.release_date ? new Date(credit.release_date).getFullYear() : null
    const decade = year ? `${Math.floor(year / 10) * 10}s` : 'Unknown'
    if (!acc[decade]) {
      acc[decade] = []
    }
    acc[decade].push(credit)
    return acc
  }, {} as Record<string, ActorMovieCredit[]>)

  // Sort decades in descending order
  const sortedDecades = Object.keys(creditsByDecade).sort((a, b) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return parseInt(b) - parseInt(a)
  })

  return (
    <div className="space-y-8">
      {sortedDecades.map((decade) => (
        <div key={decade}>
          <h3 className="text-2xl font-bold mb-4">{decade}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {creditsByDecade[decade].map((credit) => (
              <MovieCreditCard
                key={`${credit.id}-${credit.character || credit.job}`}
                credit={credit}
                type={type}
                actorName={actorName}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function MovieCreditCard({
  credit,
  type,
  actorName,
}: {
  credit: ActorMovieCredit
  type: 'cast' | 'crew'
  actorName: string
}) {
  const posterUrl = credit.poster_path
    ? `https://image.tmdb.org/t/p/w342${credit.poster_path}`
    : '/placeholder-movie.png'

  const releaseYear = credit.release_date
    ? new Date(credit.release_date).getFullYear()
    : 'TBA'

  const role = type === 'cast' ? credit.character : credit.job

  return (
    <Link href={`/movie/${credit.id}`}>
      <Card className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden h-full">
        {/* Movie Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <Image
            src={posterUrl}
            alt={credit.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {credit.vote_average && credit.vote_average > 0 && (
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-semibold text-white">
                {credit.vote_average.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Movie Info */}
        <CardContent className="p-3 space-y-2">
          <div>
            <h4 className="font-semibold line-clamp-2 text-sm group-hover:text-primary transition-colors">
              {credit.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              {releaseYear}
            </div>
          </div>

          {role && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {type === 'cast' ? 'as' : 'as'} <span className="font-medium text-foreground">{role}</span>
              </p>
            </div>
          )}

          {type === 'crew' && credit.department && (
            <Badge variant="outline" className="text-xs">
              {credit.department}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
