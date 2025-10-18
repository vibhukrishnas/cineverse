'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface FollowStats {
  followersCount: number
  followingCount: number
  isFollowing: boolean
}

export interface UserProfile {
  id: string
  username: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  followers_count?: number
  following_count?: number
  is_following?: boolean
}

/**
 * Follow a user
 */
export async function followUser(followingId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to follow users' 
      }
    }

    // Prevent self-following
    if (user.id === followingId) {
      return { 
        success: false, 
        error: 'You cannot follow yourself' 
      }
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (existing) {
      return { 
        success: false, 
        error: 'You are already following this user' 
      }
    }

    // Create follow relationship
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId
      })

    if (followError) {
      console.error('Follow error:', followError)
      return { 
        success: false, 
        error: 'Failed to follow user' 
      }
    }

    // Revalidate paths
    revalidatePath('/profile')
    revalidatePath(`/profile/${followingId}`)

    return { success: true }
  } catch (error) {
    console.error('Follow user error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to unfollow users' 
      }
    }

    // Delete follow relationship
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (unfollowError) {
      console.error('Unfollow error:', unfollowError)
      return { 
        success: false, 
        error: 'Failed to unfollow user' 
      }
    }

    // Revalidate paths
    revalidatePath('/profile')
    revalidatePath(`/profile/${followingId}`)

    return { success: true }
  } catch (error) {
    console.error('Unfollow user error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}

/**
 * Get followers for a user
 */
export async function getFollowers(userId: string, limit: number = 50, offset: number = 0) {
  try {
    const supabase = await createClient()
    
    // Get current user for is_following status
    const { data: { user } } = await supabase.auth.getUser()

    // Get followers
    const { data: follows, error } = await supabase
      .from('follows')
      .select('follower_id, created_at')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get followers error:', error)
      return { success: false, error: 'Failed to fetch followers', followers: [] }
    }

    if (!follows || follows.length === 0) {
      return { success: true, followers: [] }
    }

    // Get user details for each follower
    const followerIds = follows.map(f => f.follower_id)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, full_name, avatar_url, bio, created_at')
      .in('id', followerIds)

    if (usersError) {
      console.error('Get followers users error:', usersError)
      return { success: false, error: 'Failed to fetch follower details', followers: [] }
    }

    // If logged in, check which users the current user is following
    let followingMap: Record<string, boolean> = {}
    if (user) {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', followerIds)

      followingMap = (followingData || []).reduce((acc, f) => {
        acc[f.following_id] = true
        return acc
      }, {} as Record<string, boolean>)
    }

    // Combine data
    const followers: UserProfile[] = users.map(u => ({
      ...u,
      is_following: followingMap[u.id] || false
    }))

    return { success: true, followers }
  } catch (error) {
    console.error('Get followers error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred', 
      followers: [] 
    }
  }
}

/**
 * Get users that a user is following
 */
export async function getFollowing(userId: string, limit: number = 50, offset: number = 0) {
  try {
    const supabase = await createClient()
    
    // Get current user for is_following status
    const { data: { user } } = await supabase.auth.getUser()

    // Get following
    const { data: follows, error } = await supabase
      .from('follows')
      .select('following_id, created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get following error:', error)
      return { success: false, error: 'Failed to fetch following', following: [] }
    }

    if (!follows || follows.length === 0) {
      return { success: true, following: [] }
    }

    // Get user details for each following
    const followingIds = follows.map(f => f.following_id)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, full_name, avatar_url, bio, created_at')
      .in('id', followingIds)

    if (usersError) {
      console.error('Get following users error:', usersError)
      return { success: false, error: 'Failed to fetch following details', following: [] }
    }

    // If logged in, check which users the current user is following
    let followingMap: Record<string, boolean> = {}
    if (user) {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', followingIds)

      followingMap = (followingData || []).reduce((acc, f) => {
        acc[f.following_id] = true
        return acc
      }, {} as Record<string, boolean>)
    }

    // Combine data
    const following: UserProfile[] = users.map(u => ({
      ...u,
      is_following: followingMap[u.id] || true // They're following these users by definition
    }))

    return { success: true, following }
  } catch (error) {
    console.error('Get following error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred', 
      following: [] 
    }
  }
}

/**
 * Get follow stats for a user
 */
export async function getFollowStats(userId: string): Promise<FollowStats> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get followers count
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    if (followersError) {
      console.error('Get followers count error:', followersError)
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    if (followingError) {
      console.error('Get following count error:', followingError)
    }

    // Check if current user is following this user
    let isFollowing = false
    if (user && user.id !== userId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()

      isFollowing = !!followData
    }

    return {
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isFollowing
    }
  } catch (error) {
    console.error('Get follow stats error:', error)
    return {
      followersCount: 0,
      followingCount: 0,
      isFollowing: false
    }
  }
}

/**
 * Get suggested users to follow
 * Based on users with many followers who the current user isn't following yet
 */
export async function getSuggestedUsers(limit: number = 10) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      // If not logged in, just return popular users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, email, full_name, avatar_url, bio, created_at')
        .limit(limit)

      if (usersError) {
        console.error('Get suggested users error:', usersError)
        return { success: false, error: 'Failed to fetch suggested users', users: [] }
      }

      return { success: true, users: users || [] }
    }

    // Get users the current user is already following
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = following?.map(f => f.following_id) || []
    followingIds.push(user.id) // Exclude self

    // Get users with most reviews who aren't being followed
    const { data: activeUsers, error: activeError } = await supabase
      .from('reviews')
      .select('user_id, users!inner(id, username, email, full_name, avatar_url, bio, created_at)')
      .not('user_id', 'in', `(${followingIds.join(',')})`)
      .limit(limit * 2) // Get more to filter

    if (activeError) {
      console.error('Get active users error:', activeError)
    }

    // Count reviews per user and get unique users
    const userReviewCounts = new Map<string, { user: any; count: number }>()
    activeUsers?.forEach((review: any) => {
      const userId = review.user_id
      if (!userReviewCounts.has(userId)) {
        userReviewCounts.set(userId, { user: review.users, count: 0 })
      }
      userReviewCounts.get(userId)!.count++
    })

    // Sort by review count and take top users
    const suggestedUsers = Array.from(userReviewCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => ({
        ...item.user,
        is_following: false
      }))

    // If we don't have enough suggestions, fill with random users
    if (suggestedUsers.length < limit) {
      const { data: randomUsers } = await supabase
        .from('users')
        .select('id, username, email, full_name, avatar_url, bio, created_at')
        .not('id', 'in', `(${followingIds.join(',')})`)
        .limit(limit - suggestedUsers.length)

      if (randomUsers) {
        suggestedUsers.push(...randomUsers.map(u => ({ ...u, is_following: false })))
      }
    }

    return { success: true, users: suggestedUsers }
  } catch (error) {
    console.error('Get suggested users error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred', 
      users: [] 
    }
  }
}

/**
 * Check if current user is following another user
 */
export async function checkIsFollowing(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: true, isFollowing: false }
    }

    // Self-check
    if (user.id === userId) {
      return { success: true, isFollowing: false }
    }

    // Check follow relationship
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Check is following error:', error)
      return { success: false, error: 'Failed to check follow status', isFollowing: false }
    }

    return { success: true, isFollowing: !!data }
  } catch (error) {
    console.error('Check is following error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred', 
      isFollowing: false 
    }
  }
}
