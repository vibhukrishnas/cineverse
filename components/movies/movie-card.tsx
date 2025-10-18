'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Heart, Bookmark } from 'lucide-react'
import { getTMDBImageUrl } from '@/lib/tmdb/client'
import { TMDBMovie } from '@/types/tmdb.types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MovieCardProps {
  movie: TMDBMovie
  onAddToWatchlist?: (movieId: number) => void
  onAddToFavorites?: (movieId: number) => void
  isInWatchlist?: boolean
  isInFavorites?: boolean
}

export function MovieCard({
  movie,
  onAddToWatchlist,
  onAddToFavorites,
  isInWatchlist = false,
  isInFavorites = false,
}: MovieCardProps) {
  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w342')
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden h-full group relative">
        <Link href={`/movie/${movie.id}`}>
          <div className="relative aspect-[2/3]">
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                <p className="text-white text-sm line-clamp-3">{movie.overview}</p>
              </div>
            </div>

            {/* Rating Badge */}
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-xs font-bold">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>
          </div>
        </Link>

        <CardContent className="p-4">
          <Link href={`/movie/${movie.id}`}>
            <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
              {movie.title}
            </h3>
            <p className="text-sm text-muted-foreground">{year}</p>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {onAddToWatchlist && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault()
                  onAddToWatchlist(movie.id)
                }}
              >
                <Bookmark
                  className={`h-4 w-4 ${isInWatchlist ? 'fill-primary text-primary' : ''}`}
                />
              </Button>
            )}
            {onAddToFavorites && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault()
                  onAddToFavorites(movie.id)
                }}
              >
                <Heart
                  className={`h-4 w-4 ${isInFavorites ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
