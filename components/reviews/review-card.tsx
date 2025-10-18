'use client'

import { useState, useTransition } from 'react'
import { StarRating } from './star-rating'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toggleReviewLike, toggleReviewHelpful, deleteReview } from '@/app/actions/reviews'
import { Heart, ThumbsUp, Edit, Trash2, Flag, Eye, EyeOff, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ReviewCardProps {
  review: {
    id: string
    user_id: string
    rating: number
    content: string
    story_rating?: number | null
    acting_rating?: number | null
    direction_rating?: number | null
    cinematography_rating?: number | null
    music_rating?: number | null
    is_spoiler: boolean
    sentiment?: string | null
    helpful_count: number
    like_count: number
    created_at: string
    updated_at: string
    users?: {
      username: string | null
      avatar_url: string | null
    }
  }
  currentUserId?: string
  isLiked?: boolean
  isMarkedHelpful?: boolean
  onEdit?: () => void
  onDeleted?: () => void
  movieId: number
}

export function ReviewCard({
  review,
  currentUserId,
  isLiked: initialIsLiked = false,
  isMarkedHelpful: initialIsMarkedHelpful = false,
  onEdit,
  onDeleted,
  movieId,
}: ReviewCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isMarkedHelpful, setIsMarkedHelpful] = useState(initialIsMarkedHelpful)
  const [likeCount, setLikeCount] = useState(review.like_count)
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count)
  const [showFullContent, setShowFullContent] = useState(false)
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isAuthor = currentUserId === review.user_id
  const contentLength = review.content.length
  const shouldTruncate = contentLength > 500

  const handleLike = () => {
    if (!currentUserId) return

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    startTransition(async () => {
      const result = await toggleReviewLike(review.id)
      if (result.error) {
        // Revert on error
        setIsLiked(isLiked)
        setLikeCount(likeCount)
      }
    })
  }

  const handleHelpful = () => {
    if (!currentUserId) return

    // Optimistic update
    setIsMarkedHelpful(!isMarkedHelpful)
    setHelpfulCount(isMarkedHelpful ? helpfulCount - 1 : helpfulCount + 1)

    startTransition(async () => {
      const result = await toggleReviewHelpful(review.id)
      if (result.error) {
        // Revert on error
        setIsMarkedHelpful(isMarkedHelpful)
        setHelpfulCount(helpfulCount)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteReview(review.id, movieId)
      if (!result.error) {
        onDeleted?.()
      }
    })
  }

  const renderContent = () => {
    let displayContent = review.content
    if (shouldTruncate && !showFullContent) {
      displayContent = review.content.substring(0, 500) + '...'
    }

    // Simple markdown rendering
    displayContent = displayContent
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')

    return <div dangerouslySetInnerHTML={{ __html: displayContent }} className="prose dark:prose-invert max-w-none" />
  }

  const getSentimentBadge = () => {
    if (!review.sentiment) return null

    const colors = {
      positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[review.sentiment as keyof typeof colors]}`}>
        {review.sentiment}
      </span>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {review.users?.username?.[0]?.toUpperCase() || 'U'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{review.users?.username || 'Anonymous'}</h4>
              {getSentimentBadge()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              {review.updated_at !== review.created_at && ' (edited)'}
            </p>
          </div>
        </div>

        {/* Actions for author */}
        {isAuthor && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-4">
        <StarRating rating={review.rating} readonly size="md" showValue />
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

      {/* Spoiler Warning */}
      {review.is_spoiler && !spoilerRevealed ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                This review contains spoilers
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSpoilerRevealed(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Reveal
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Content */}
          <div className="mb-4 text-gray-700 dark:text-gray-300">
            {renderContent()}
          </div>

          {/* Read More Button */}
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullContent(!showFullContent)}
              className="mb-4"
            >
              {showFullContent ? 'Show Less' : 'Read More'}
            </Button>
          )}
        </>
      )}

      {/* Interactions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={!currentUserId || isPending}
          className={isLiked ? 'text-red-500' : ''}
        >
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
          {likeCount}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpful}
          disabled={!currentUserId || isPending}
          className={isMarkedHelpful ? 'text-blue-500' : ''}
        >
          <ThumbsUp className={`w-4 h-4 mr-1 ${isMarkedHelpful ? 'fill-current' : ''}`} />
          Helpful ({helpfulCount})
        </Button>

        {!isAuthor && currentUserId && (
          <Button variant="ghost" size="sm">
            <Flag className="w-4 h-4 mr-1" />
            Report
          </Button>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            Are you sure you want to delete this review? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
