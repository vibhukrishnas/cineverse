'use server'

import { createClient } from '@/lib/supabase/server'
import type { SocialPost } from '@/types/database.types'

export interface FeedItem {
  id: string
  type: 'review' | 'follow' | 'social_post'
  created_at: string
  user: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  content?: string
  movie?: {
    id: number
    title: string
    poster_path: string | null
  }
  review?: {
    id: string
    rating: number
    title: string
    content: string
    is_spoiler: boolean
    likes_count: number
    helpful_count: number
  }
  social_post?: SocialPost
  target_user?: {
    id: string
    username: string
    full_name: string | null
  }
}

/**
 * Get feed from users that the current user follows
 */
export async function getFollowingFeed(limit: number = 20, offset: number = 0) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to view your feed',
        feed: []
      }
    }

    // Get users that current user follows
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    if (followsError) {
      console.error('Get follows error:', followsError)
      return { success: false, error: 'Failed to fetch following list', feed: [] }
    }

    if (!follows || follows.length === 0) {
      // No follows yet, return discover feed instead
      return getDiscoverFeed(limit, offset)
    }

    const followingIds = follows.map(f => f.following_id)

    // Get reviews from followed users
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        user_id,
        movie_id,
        movie_title,
        movie_poster_path,
        rating,
        title,
        content,
        is_spoiler,
        likes_count,
        helpful_count,
        created_at
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reviewsError) {
      console.error('Get reviews error:', reviewsError)
    }

    // Get user details for reviews
    const userIds = reviews?.map(r => r.user_id) || []
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds)

    if (usersError) {
      console.error('Get users error:', usersError)
    }

    // Create user map
    const userMap = (users || []).reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {} as Record<string, any>)

    // Transform to feed items
    const feedItems: FeedItem[] = (reviews || []).map(r => ({
      id: r.id,
      type: 'review' as const,
      created_at: r.created_at,
      user: userMap[r.user_id] || {
        id: r.user_id,
        username: 'Unknown',
        full_name: null,
        avatar_url: null
      },
      movie: {
        id: r.movie_id,
        title: r.movie_title,
        poster_path: r.movie_poster_path
      },
      review: {
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        is_spoiler: r.is_spoiler,
        likes_count: r.likes_count,
        helpful_count: r.helpful_count
      }
    }))

    return { success: true, feed: feedItems }
  } catch (error) {
    console.error('Get following feed error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      feed: []
    }
  }
}

/**
 * Get discover feed with popular content from all users
 */
export async function getDiscoverFeed(limit: number = 20, offset: number = 0) {
  try {
    const supabase = await createClient()

    // Get popular recent reviews (sorted by likes + helpful)
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        user_id,
        movie_id,
        movie_title,
        movie_poster_path,
        rating,
        title,
        content,
        is_spoiler,
        likes_count,
        helpful_count,
        created_at
      `)
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reviewsError) {
      console.error('Get reviews error:', reviewsError)
      return { success: false, error: 'Failed to fetch reviews', feed: [] }
    }

    // Get user details for reviews
    const userIds = reviews?.map(r => r.user_id) || []
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds)

    if (usersError) {
      console.error('Get users error:', usersError)
    }

    // Create user map
    const userMap = (users || []).reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {} as Record<string, any>)

    // Transform to feed items
    const feedItems: FeedItem[] = (reviews || []).map(r => ({
      id: r.id,
      type: 'review' as const,
      created_at: r.created_at,
      user: userMap[r.user_id] || {
        id: r.user_id,
        username: 'Unknown',
        full_name: null,
        avatar_url: null
      },
      movie: {
        id: r.movie_id,
        title: r.movie_title,
        poster_path: r.movie_poster_path
      },
      review: {
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        is_spoiler: r.is_spoiler,
        likes_count: r.likes_count,
        helpful_count: r.helpful_count
      }
    }))

    return { success: true, feed: feedItems }
  } catch (error) {
    console.error('Get discover feed error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      feed: []
    }
  }
}

/**
 * Get social posts for a specific movie
 */
export async function getSocialPostsForMovie(movieId: number, limit: number = 10) {
  try {
    const supabase = await createClient()

    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('movie_id', movieId)
      .order('fetched_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Get social posts error:', error)
      return { success: false, error: 'Failed to fetch social posts', posts: [] }
    }

    return { success: true, posts: posts || [] }
  } catch (error) {
    console.error('Get social posts error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      posts: []
    }
  }
}

/**
 * Get recent social posts across all platforms
 */
export async function getRecentSocialPosts(
  platform?: 'twitter' | 'youtube' | 'instagram',
  limit: number = 20,
  offset: number = 0
) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Get recent social posts error:', error)
      return { success: false, error: 'Failed to fetch social posts', posts: [] }
    }

    return { success: true, posts: posts || [] }
  } catch (error) {
    console.error('Get recent social posts error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      posts: []
    }
  }
}

/**
 * Fetch and cache social posts from external APIs
 * Note: This is a placeholder. Actual implementation would require:
 * - Twitter API v2 credentials
 * - YouTube Data API v3 credentials
 * - Instagram Graph API credentials
 */
export async function fetchAndCacheSocialPosts(
  platform: 'twitter' | 'youtube' | 'instagram',
  movieTitle: string,
  movieId: number
) {
  try {
    // This is a placeholder for the actual social media API integration
    // In production, you would:
    // 1. Call the respective API (Twitter, YouTube, Instagram)
    // 2. Parse the response
    // 3. Store in social_posts table
    
    console.log(`Fetching ${platform} posts for "${movieTitle}" (ID: ${movieId})`)
    
    // Example structure for what the actual implementation would do:
    // const posts = await fetchFromSocialMediaAPI(platform, movieTitle)
    // const supabase = await createClient()
    // await supabase.from('social_posts').insert(posts.map(post => ({
    //   platform,
    //   post_id: post.id,
    //   movie_id: movieId,
    //   content: post.text,
    //   media_url: post.media,
    //   author_name: post.author.name,
    //   author_handle: post.author.handle,
    //   author_avatar: post.author.avatar,
    //   likes_count: post.likes,
    //   comments_count: post.comments,
    //   views_count: post.views,
    //   external_url: post.url,
    //   created_at: post.timestamp
    // })))

    return { 
      success: false, 
      error: 'Social media integration not yet implemented. Requires API credentials.',
      message: 'To enable this feature, add API credentials in .env.local and implement the API client.'
    }
  } catch (error) {
    console.error('Fetch and cache social posts error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Search social posts by content
 */
export async function searchSocialPosts(
  query: string,
  platform?: 'twitter' | 'youtube' | 'instagram',
  limit: number = 20
) {
  try {
    const supabase = await createClient()

    let dbQuery = supabase
      .from('social_posts')
      .select('*')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (platform) {
      dbQuery = dbQuery.eq('platform', platform)
    }

    const { data: posts, error } = await dbQuery

    if (error) {
      console.error('Search social posts error:', error)
      return { success: false, error: 'Failed to search social posts', posts: [] }
    }

    return { success: true, posts: posts || [] }
  } catch (error) {
    console.error('Search social posts error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      posts: []
    }
  }
}

/**
 * Get trending posts (most engagement in last 24 hours)
 */
export async function getTrendingSocialPosts(limit: number = 10) {
  try {
    const supabase = await createClient()

    // Get posts from last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('likes_count', { ascending: false })
      .order('comments_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Get trending posts error:', error)
      return { success: false, error: 'Failed to fetch trending posts', posts: [] }
    }

    return { success: true, posts: posts || [] }
  } catch (error) {
    console.error('Get trending posts error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      posts: []
    }
  }
}
