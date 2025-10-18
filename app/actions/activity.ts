'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserActivity {
  id: string
  user_id: string
  activity_type: 'movie_view' | 'review_posted' | 'post_created' | 'comment_posted' | 'channel_joined' | 'watchlist_added'
  entity_id: string
  entity_title: string | null
  metadata: Record<string, any>
  created_at: string
}

/**
 * Log user activity
 */
export async function logActivity(
  activityType: UserActivity['activity_type'],
  entityId: string,
  entityTitle?: string,
  metadata?: Record<string, any>
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Use the database function to prevent duplicates
    const { error } = await supabase.rpc('log_user_activity', {
      p_user_id: user.id,
      p_activity_type: activityType,
      p_entity_id: entityId,
      p_entity_title: entityTitle || null,
      p_metadata: metadata || {}
    })

    if (error) {
      console.error('Error logging activity:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in logActivity:', error)
    return { error: 'Failed to log activity' }
  }
}

/**
 * Get user's recent activity
 */
export async function getRecentActivity(limit: number = 10) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { activities: [] }
    }

    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activity:', error)
      return { activities: [], error: error.message }
    }

    return { activities: data as UserActivity[] }
  } catch (error) {
    console.error('Error in getRecentActivity:', error)
    return { activities: [], error: 'Failed to fetch activity' }
  }
}

/**
 * Log movie page view
 */
export async function logMovieView(movieId: number, movieTitle: string) {
  return logActivity('movie_view', movieId.toString(), movieTitle)
}

/**
 * Log review posted
 */
export async function logReviewPosted(reviewId: string, movieTitle: string) {
  return logActivity('review_posted', reviewId, `Review for ${movieTitle}`)
}

/**
 * Log post created
 */
export async function logPostCreated(postId: string, postTitle: string, channelName: string) {
  return logActivity('post_created', postId, postTitle, { channel: channelName })
}

/**
 * Log channel joined
 */
export async function logChannelJoined(channelId: string, channelName: string) {
  return logActivity('channel_joined', channelId, channelName)
}

/**
 * Log watchlist addition
 */
export async function logWatchlistAdded(movieId: number, movieTitle: string) {
  return logActivity('watchlist_added', movieId.toString(), movieTitle)
}
