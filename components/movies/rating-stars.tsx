'use client'

import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number // 0-10 scale
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  interactive?: boolean
  onRate?: (rating: number) => void
}

export function RatingStars({
  rating,
  maxStars = 5,
  size = 'md',
  showNumber = true,
  interactive = false,
  onRate,
}: RatingStarsProps) {
  // Convert 0-10 rating to 0-5 scale
  const normalizedRating = (rating / 10) * maxStars
  const fullStars = Math.floor(normalizedRating)
  const hasHalfStar = normalizedRating % 1 >= 0.5

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const handleClick = (index: number) => {
    if (interactive && onRate) {
      const newRating = ((index + 1) / maxStars) * 10
      onRate(newRating)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, index) => {
          const isFilled = index < fullStars
          const isHalf = index === fullStars && hasHalfStar

          return (
            <button
              key={index}
              className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              onClick={() => handleClick(index)}
              disabled={!interactive}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isHalf
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          )
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}
