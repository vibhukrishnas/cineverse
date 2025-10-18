'use client'

import { useState, useEffect } from 'react'
import { ReviewCard } from './review-card'
import { Button } from '@/components/ui/button'
import { getReviewsByMovie, getUserReviewInteractions } from '@/app/actions/reviews'
import { Loader2, Star } from 'lucide-react'

interface ReviewsListProps {
  movieId: number
  currentUserId?: string
  onEditReview?: (review: any) => void
}

type SortOption = 'recent' | 'helpful' | 'highest' | 'lowest'

export function ReviewsList({ movieId, currentUserId, onEditReview }: ReviewsListProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterRating, setFilterRating] = useState<number | undefined>()
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userInteractions, setUserInteractions] = useState<{
    likedReviews: string[]
    helpfulReviews: string[]
  }>({ likedReviews: [], helpfulReviews: [] })

  useEffect(() => {
    loadReviews()
  }, [movieId, sortBy, filterRating, page])

  const loadReviews = async () => {
    setLoading(true)
    setError(null)
    
    console.log('Loading reviews for movie:', movieId)
    
    const result = await getReviewsByMovie(movieId, {
      sortBy,
      filterRating,
      page,
      limit: 12,
    })

    console.log('Reviews result:', result)

    if (result.error) {
      console.error('Error loading reviews:', result.error)
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.data) {
      console.log('Loaded reviews:', result.data.length)
      setReviews(result.data)
      setTotalPages(result.totalPages || 1)

      // Load user interactions
      if (currentUserId && result.data.length > 0) {
        const reviewIds = result.data.map((r: any) => r.id)
        const interactions = await getUserReviewInteractions(currentUserId, reviewIds)
        setUserInteractions(interactions)
      }
    }

    setLoading(false)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setPage(1)
  }

  const handleFilterChange = (rating: number | undefined) => {
    setFilterRating(rating)
    setPage(1)
  }

  const handleReviewDeleted = () => {
    // Reload the reviews after deletion
    loadReviews()
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Error loading reviews: {error}
        </p>
        <Button onClick={loadReviews}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Sort Options */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 self-center mr-2">
            Sort by:
          </span>
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('recent')}
          >
            Recent
          </Button>
          <Button
            variant={sortBy === 'helpful' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('helpful')}
          >
            Most Helpful
          </Button>
          <Button
            variant={sortBy === 'highest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('highest')}
          >
            Highest Rating
          </Button>
          <Button
            variant={sortBy === 'lowest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('lowest')}
          >
            Lowest Rating
          </Button>
        </div>

        {/* Rating Filter */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 self-center mr-2">
            Filter:
          </span>
          <Button
            variant={filterRating === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(undefined)}
          >
            All
          </Button>
          <Button
            variant={filterRating === 5 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(5)}
          >
            <Star className="w-3 h-3 mr-1 fill-current" />5
          </Button>
          <Button
            variant={filterRating === 4 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(4)}
          >
            <Star className="w-3 h-3 mr-1 fill-current" />4+
          </Button>
          <Button
            variant={filterRating === 3 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(3)}
          >
            <Star className="w-3 h-3 mr-1 fill-current" />3+
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No reviews yet. Be the first to review this movie!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              isLiked={userInteractions.likedReviews.includes(review.id)}
              isMarkedHelpful={userInteractions.helpfulReviews.includes(review.id)}
              onEdit={() => onEditReview?.(review)}
              onDeleted={handleReviewDeleted}
              movieId={movieId}
            />
          ))}
        </div>
      )}

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
