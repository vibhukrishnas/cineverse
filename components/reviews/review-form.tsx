'use client'

import { useState, useTransition } from 'react'
import { StarRating } from './star-rating'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { createReview, updateReview, type CreateReviewInput } from '@/app/actions/reviews'
import { AlertCircle, Loader2, CheckCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ReviewFormProps {
  movieId: number
  existingReview?: {
    id: string
    rating: number
    content: string
    storyRating?: number | null
    actingRating?: number | null
    directionRating?: number | null
    cinematographyRating?: number | null
    musicRating?: number | null
    isSpoiler?: boolean
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({ movieId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Form state
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [content, setContent] = useState(existingReview?.content || '')
  const [isSpoiler, setIsSpoiler] = useState(existingReview?.isSpoiler || false)

  // Category ratings
  const [storyRating, setStoryRating] = useState(existingReview?.storyRating || 0)
  const [actingRating, setActingRating] = useState(existingReview?.actingRating || 0)
  const [directionRating, setDirectionRating] = useState(existingReview?.directionRating || 0)
  const [cinematographyRating, setCinematographyRating] = useState(existingReview?.cinematographyRating || 0)
  const [musicRating, setMusicRating] = useState(existingReview?.musicRating || 0)

  // Text formatting state
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)

  const characterCount = content.length
  const isValid = rating > 0 && content.length >= 50 && content.length <= 5000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    console.log('🎬 Review Form - Submit started')
    console.log('Rating:', rating, 'Content length:', content.length, 'isValid:', isValid)

    if (!isValid) {
      const errorMsg = 'Please provide a rating and at least 50 characters of content'
      console.error('❌ Validation failed:', errorMsg)
      setError(errorMsg)
      return
    }

    const input: CreateReviewInput = {
      movieId,
      rating,
      content,
      isSpoiler,
      storyRating: storyRating > 0 ? storyRating : undefined,
      actingRating: actingRating > 0 ? actingRating : undefined,
      directionRating: directionRating > 0 ? directionRating : undefined,
      cinematographyRating: cinematographyRating > 0 ? cinematographyRating : undefined,
      musicRating: musicRating > 0 ? musicRating : undefined,
    }

    console.log('📝 Review input:', input)

    startTransition(async () => {
      console.log('⏳ Submitting review...')
      let result
      try {
        if (existingReview) {
          result = await updateReview({ ...input, reviewId: existingReview.id })
        } else {
          result = await createReview(input)
        }

        console.log('📤 Review result:', result)

        if (result.error) {
          console.error('❌ Review error:', result.error)
          setError(result.error)
        } else {
          console.log('✅ Review submitted successfully')
          setShowSuccess(true)
          // Wait for animation then call onSuccess
          setTimeout(() => {
            onSuccess?.()
          }, 2000)
        }
      } catch (err) {
        console.error('💥 Exception during review submission:', err)
        setError(err instanceof Error ? err.message : 'Failed to submit review')
      }
    })
  }

  const applyFormatting = (format: 'bold' | 'italic' | 'heading') => {
    const textarea = document.getElementById('review-content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    if (!selectedText) return

    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'heading':
        formattedText = `### ${selectedText}`
        break
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end)
    setContent(newContent)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30"
              >
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Review Submitted! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Thank you for sharing your thoughts
                </p>
              </motion.div>

              {/* Sparkle animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall Rating */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Overall Rating *</Label>
        <div className="flex items-center gap-4">
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          {rating > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {rating.toFixed(1)} / 5.0
            </span>
          )}
        </div>
      </div>

      {/* Category Ratings */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Category Ratings (Optional)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Story</span>
            <StarRating rating={storyRating} onRatingChange={setStoryRating} size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Acting</span>
            <StarRating rating={actingRating} onRatingChange={setActingRating} size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Direction</span>
            <StarRating rating={directionRating} onRatingChange={setDirectionRating} size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Cinematography</span>
            <StarRating rating={cinematographyRating} onRatingChange={setCinematographyRating} size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Music</span>
            <StarRating rating={musicRating} onRatingChange={setMusicRating} size="sm" />
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-2">
        <Label htmlFor="review-content" className="text-base font-semibold">
          Your Review *
        </Label>

        {/* Text Formatting Toolbar */}
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('bold')}
            className={isBold ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <strong>B</strong>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('italic')}
            className={isItalic ? 'bg-gray-200 dark:bg-gray-700' : ''}
          >
            <em>I</em>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyFormatting('heading')}
          >
            H
          </Button>
        </div>

        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts about this movie... (minimum 50 characters)"
          className="w-full min-h-[200px] p-4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          maxLength={5000}
        />

        <div className="flex justify-between items-center text-sm">
          <span className={characterCount < 50 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}>
            {characterCount} / 5000 characters
            {characterCount < 50 && ` (${50 - characterCount} more needed)`}
          </span>
        </div>
      </div>

      {/* Spoiler Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="spoiler"
          checked={isSpoiler}
          onCheckedChange={(checked) => setIsSpoiler(checked === true)}
        />
        <Label htmlFor="spoiler" className="text-sm cursor-pointer">
          This review contains spoilers
        </Label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!isValid || isPending}
          className="flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {existingReview ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            existingReview ? 'Update Review' : 'Submit Review'
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
