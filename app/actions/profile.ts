'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(data: {
  username?: string
  bio?: string
  avatar_url?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({
        username: data.username,
        bio: data.bio,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/profile')
    revalidatePath('/settings')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUserStats(userId: string) {
  const supabase = await createClient()

  try {
    // Get reviews count
    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get watchlist count
    const { count: watchlistCount } = await supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get average rating
    const { data: avgRating } = await supabase
      .from('reviews')
      .select('rating')
      .eq('user_id', userId)

    const averageRating = avgRating && avgRating.length > 0
      ? avgRating.reduce((sum, r) => sum + r.rating, 0) / avgRating.length
      : 0

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    return {
      success: true,
      stats: {
        reviewsCount: reviewsCount || 0,
        watchlistCount: watchlistCount || 0,
        averageRating: Number(averageRating.toFixed(1)),
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      }
    }
  } catch (error: any) {
    console.error('Error fetching user stats:', error)
    return {
      success: false,
      error: error.message,
      stats: {
        reviewsCount: 0,
        watchlistCount: 0,
        averageRating: 0,
        followersCount: 0,
        followingCount: 0,
      }
    }
  }
}
