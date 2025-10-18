'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { awardKarma, updateUserStat } from './gamification'
import { checkAndUpdateAchievements } from './achievements'
import { logReviewPosted } from './activity'
import { KARMA_VALUES } from '@/lib/gamification/constants'

export interface CreateReviewInput {
  movieId: number
  rating: number
  content: string
  storyRating?: number
  actingRating?: number
  directionRating?: number
  cinematographyRating?: number
  musicRating?: number
  isSpoiler?: boolean
}

export interface UpdateReviewInput extends CreateReviewInput {
  reviewId: string
}

// Simple sentiment analysis function
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['great', 'amazing', 'excellent', 'fantastic', 'wonderful', 'brilliant', 'outstanding', 'superb', 'love', 'loved', 'perfect', 'beautiful', 'incredible', 'awesome', 'best', 'masterpiece', 'stunning']
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate', 'hated', 'disappointing', 'boring', 'waste', 'dull', 'mediocre', 'fail', 'failed', 'weak', 'mess']
  
  const lowerText = text.toLowerCase()
  let score = 0
  
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = lowerText.match(regex)
    if (matches) score += matches.length
  })
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = lowerText.match(regex)
    if (matches) score -= matches.length
  })
  
  if (score > 2) return 'positive'
  if (score < -2) return 'negative'
  return 'neutral'
}

export async function createReview(input: CreateReviewInput) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('❌ Auth error:', authError)
    return { error: 'You must be logged in to create a review' }
  }

  console.log('✅ User authenticated:', user.id, 'Creating review for movie:', input.movieId)

  // Analyze sentiment
  const sentiment = analyzeSentiment(input.content)

  // Prepare review data without movie_title (not all schemas have it)
  const reviewData = {
    user_id: user.id,
    movie_id: input.movieId,
    rating: input.rating,
    content: input.content,
    story_rating: input.storyRating || null,
    acting_rating: input.actingRating || null,
    direction_rating: input.directionRating || null,
    cinematography_rating: input.cinematographyRating || null,
    music_rating: input.musicRating || null,
    is_spoiler: input.isSpoiler || false,
    sentiment,
  }

  console.log('📝 Inserting review data:', reviewData)

  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single()

  if (error) {
    console.error('❌ Database error creating review:', error)
    if (error.code === '23505') {
      return { error: 'You have already reviewed this movie' }
    }
    return { error: error.message || 'Failed to submit review. Please try again.' }
  }

  console.log('✅ Review created successfully:', data)

  // Award karma for creating a review
  try {
    await awardKarma(
      user.id,
      KARMA_VALUES.REVIEW_CREATED,
      'review_created',
      data.id,
      'review'
    )

    // Update user stats
    await updateUserStat(user.id, 'reviews_count', 1)

    // Check for achievements
    await checkAndUpdateAchievements(user.id)

    // Log activity
    // Fetch movie title first
    try {
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${input.movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      )
      if (tmdbResponse.ok) {
        const movieData = await tmdbResponse.json()
        await logReviewPosted(data.id, movieData.title)
      }
    } catch (error) {
      console.error('Error logging review activity:', error)
    }
  } catch (error) {
    console.error('Error awarding karma:', error)
  }

  revalidatePath(`/movie/${input.movieId}`)
  return { data }
}

export async function updateReview(input: UpdateReviewInput) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to update a review' }
  }

  // Verify ownership
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', input.reviewId)
    .single()

  if (!existingReview || existingReview.user_id !== user.id) {
    return { error: 'You can only update your own reviews' }
  }

  // Analyze sentiment
  const sentiment = analyzeSentiment(input.content)

  const { data, error } = await supabase
    .from('reviews')
    .update({
      rating: input.rating,
      content: input.content,
      story_rating: input.storyRating || null,
      acting_rating: input.actingRating || null,
      direction_rating: input.directionRating || null,
      cinematography_rating: input.cinematographyRating || null,
      music_rating: input.musicRating || null,
      is_spoiler: input.isSpoiler || false,
      sentiment,
    })
    .eq('id', input.reviewId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/movie/${input.movieId}`)
  return { data }
}

export async function deleteReview(reviewId: string, movieId: number) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to delete a review' }
  }

  // Verify ownership
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single()

  if (!existingReview || existingReview.user_id !== user.id) {
    return { error: 'You can only delete your own reviews' }
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/movie/${movieId}`)
  return { success: true }
}

export async function getReviewsByMovie(
  movieId: number,
  options: {
    sortBy?: 'recent' | 'helpful' | 'highest' | 'lowest'
    filterRating?: number
    page?: number
    limit?: number
  } = {}
) {
  const supabase = await createClient()
  const { sortBy = 'recent', filterRating, page = 1, limit = 12 } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('movie_id', movieId)

  // Apply rating filter
  if (filterRating) {
    if (filterRating === 5) {
      query = query.eq('rating', 5)
    } else {
      query = query.gte('rating', filterRating)
    }
  }

  // Apply sorting
  switch (sortBy) {
    case 'helpful':
      query = query.order('helpful_count', { ascending: false })
      break
    case 'highest':
      query = query.order('rating', { ascending: false })
      break
    case 'lowest':
      query = query.order('rating', { ascending: true })
      break
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply pagination
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching reviews:', error)
    return { error: error.message }
  }

  // Fetch user data separately for each review
  const reviewsWithUsers = await Promise.all(
    (data || []).map(async (review) => {
      const { data: userData } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', review.user_id)
        .single()

      return {
        ...review,
        users: userData || { username: 'Anonymous', avatar_url: null }
      }
    })
  )

  return {
    data: reviewsWithUsers,
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getReviewsByUser(
  userId: string,
  options: {
    page?: number
    limit?: number
  } = {}
) {
  const supabase = await createClient()
  const { page = 1, limit = 12 } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    return { error: error.message }
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getUserReviewStats(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('user_id', userId)

  if (error) {
    return { error: error.message }
  }

  const totalReviews = data.length
  const averageRating = totalReviews > 0
    ? data.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
  }
}

export async function toggleReviewLike(reviewId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to like a review' }
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('review_likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) {
      return { error: error.message }
    }

    return { liked: false }
  } else {
    // Like
    const { error, data: likeData } = await supabase
      .from('review_likes')
      .insert({
        review_id: reviewId,
        user_id: user.id,
      })
      .select('review_id')
      .single()

    if (error) {
      return { error: error.message }
    }

    // Get the review author to award them karma
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single()

    if (review && review.user_id !== user.id) {
      // Award karma to review author
      try {
        await awardKarma(
          review.user_id,
          KARMA_VALUES.REVIEW_LIKED,
          'review_liked',
          reviewId,
          'review'
        )
        await updateUserStat(review.user_id, 'review_likes_received', 1)
      } catch (error) {
        console.error('Error awarding karma for like:', error)
      }
    }

    return { liked: true }
  }
}

export async function toggleReviewHelpful(reviewId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to mark a review as helpful' }
  }

  // Check if already marked as helpful
  const { data: existingHelpful } = await supabase
    .from('review_helpful')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .single()

  if (existingHelpful) {
    // Unmark
    const { error } = await supabase
      .from('review_helpful')
      .delete()
      .eq('id', existingHelpful.id)

    if (error) {
      return { error: error.message }
    }

    return { helpful: false }
  } else {
    // Mark as helpful
    const { error, data: helpfulData } = await supabase
      .from('review_helpful')
      .insert({
        review_id: reviewId,
        user_id: user.id,
      })
      .select('review_id')
      .single()

    if (error) {
      return { error: error.message }
    }

    // Get the review author to award them karma
    const { data: review } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single()

    if (review && review.user_id !== user.id) {
      // Award karma to review author
      try {
        await awardKarma(
          review.user_id,
          KARMA_VALUES.HELPFUL_VOTE,
          'helpful_vote',
          reviewId,
          'review'
        )
        await updateUserStat(review.user_id, 'helpful_votes_received', 1)
        await checkAndUpdateAchievements(review.user_id)
      } catch (error) {
        console.error('Error awarding karma for helpful vote:', error)
      }
    }

    return { helpful: true }
  }
}

export async function getUserReviewInteractions(userId: string, reviewIds: string[]) {
  const supabase = await createClient()

  const { data: likes } = await supabase
    .from('review_likes')
    .select('review_id')
    .eq('user_id', userId)
    .in('review_id', reviewIds)

  const { data: helpful } = await supabase
    .from('review_helpful')
    .select('review_id')
    .eq('user_id', userId)
    .in('review_id', reviewIds)

  return {
    likedReviews: likes?.map(l => l.review_id) || [],
    helpfulReviews: helpful?.map(h => h.review_id) || [],
  }
}
