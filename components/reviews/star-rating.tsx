'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const isFull = displayRating >= value
        const isHalf = displayRating >= value - 0.5 && displayRating < value

        return (
          <div
            key={value}
            className={`relative ${readonly ? '' : 'cursor-pointer'}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background star */}
            <Star
              className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`}
              fill="currentColor"
            />

            {/* Filled star */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: isFull ? '100%' : isHalf ? '50%' : '0%' }}
            >
              <Star
                className={`${sizeClasses[size]} text-yellow-400`}
                fill="currentColor"
              />
            </div>

            {/* Interactive overlay for half-star selection */}
            {!readonly && (
              <>
                <div
                  className="absolute inset-0 w-1/2 left-0"
                  onMouseEnter={() => handleMouseEnter(value - 0.5)}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick(value - 0.5)
                  }}
                />
                <div
                  className="absolute inset-0 w-1/2 right-0"
                  onMouseEnter={() => handleMouseEnter(value)}
                />
              </>
            )}
          </div>
        )
      })}

      {showValue && (
        <span className="ml-2 text-sm font-medium">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
