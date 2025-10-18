'use client'

import { useState } from 'react'
import { ReviewForm } from './review-form'
import { ReviewsList } from './reviews-list'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, Edit, X } from 'lucide-react'

interface ReviewsSectionProps {
  movieId: number
  currentUserId?: string
}

export function ReviewsSection({ movieId, currentUserId }: ReviewsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingReview(null)
    // Trigger refresh of reviews list
    setRefreshKey(prev => prev + 1)
  }

  const handleEditReview = (review: any) => {
    setEditingReview(review)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Reviews
        </h2>

        {currentUserId && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              {editingReview ? (
                <>
                  <Edit className="w-5 h-5" />
                  Edit Your Review
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  Write Your Review
                </>
              )}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ReviewForm
            movieId={movieId}
            existingReview={editingReview}
            onSuccess={handleFormSuccess}
            onCancel={handleCancelEdit}
          />
        </Card>
      )}

      {/* Login Prompt */}
      {!currentUserId && (
        <Card className="p-6 text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <p className="text-lg mb-4">
            Want to share your thoughts about this movie?
          </p>
          <Button asChild>
            <a href="/auth/login">Sign in to write a review</a>
          </Button>
        </Card>
      )}

      {/* Reviews List */}
      <ReviewsList
        key={refreshKey}
        movieId={movieId}
        currentUserId={currentUserId}
        onEditReview={handleEditReview}
      />
    </div>
  )
}
