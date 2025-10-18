'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StarRating } from './star-rating'
import { getReviewsByUser } from '@/app/actions/reviews'
import { Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'

interface UserReviewsProps {
  userId: string
}

export function UserReviews({ userId }: UserReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadReviews()
  }, [userId, page])

  const loadReviews = async () => {
    setLoading(true)
    const result = await getReviewsByUser(userId, { page, limit: 10 })

    if (!result.error && result.data) {
      setReviews(result.data)
      setTotalPages(result.totalPages || 1)
    }

    setLoading(false)
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You haven't written any reviews yet
        </p>
        <Button asChild>
          <Link href="/explore">Discover Movies</Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Link
                href={`/movie/${review.movie_id}`}
                className="text-xl font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Movie #{review.movie_id}
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={review.rating} readonly size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {review.rating.toFixed(1)} / 5.0
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              {new Date(review.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Category Ratings */}
          {(review.story_rating || review.acting_rating || review.direction_rating || review.cinematography_rating || review.music_rating) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 text-sm">
              {review.story_rating && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Story:</span>
                  <StarRating rating={review.story_rating} readonly size="sm" />
                </div>
              )}
              {review.acting_rating && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Acting:</span>
                  <StarRating rating={review.acting_rating} readonly size="sm" />
                </div>
              )}
              {review.direction_rating && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Direction:</span>
                  <StarRating rating={review.direction_rating} readonly size="sm" />
                </div>
              )}
              {review.cinematography_rating && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Cinematography:</span>
                  <StarRating rating={review.cinematography_rating} readonly size="sm" />
                </div>
              )}
              {review.music_rating && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Music:</span>
                  <StarRating rating={review.music_rating} readonly size="sm" />
                </div>
              )}
            </div>
          )}

          {/* Content Preview */}
          <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
            {review.content}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <span>❤️ {review.like_count} likes</span>
            <span>👍 {review.helpful_count} helpful</span>
            {review.is_spoiler && (
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                Spoiler
              </span>
            )}
            {review.sentiment && (
              <span className={`px-2 py-1 rounded ${
                review.sentiment === 'positive'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : review.sentiment === 'negative'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}>
                {review.sentiment}
              </span>
            )}
          </div>

          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/movie/${review.movie_id}`}>
                View Full Review
              </Link>
            </Button>
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
