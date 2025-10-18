'use server'

import { createClient } from '@/lib/supabase/server'
import { searchMovieTweets, getStudioTweets } from '@/lib/social/twitter'

/**
 * Fetch Twitter posts for a movie and store in database
 */
export async function fetchAndStoreMovieTweets(
  movieId: number,
  movieTitle: string,
  movieYear?: number
) {
  try {
    console.log(`Fetching tweets for: ${movieTitle} (${movieYear})`)
    
    // Fetch tweets
    const tweets = await searchMovieTweets(movieTitle, movieYear, 20)

    if (tweets.length === 0) {
      return { 
        success: true, 
        message: 'No tweets found',
        count: 0 
      }
    }

    // Store in database
    const supabase = await createClient()
    
    const postsToInsert = tweets.map(tweet => ({
      platform: tweet.platform,
      post_id: tweet.post_id,
      movie_id: movieId,
      content: tweet.content,
      media_url: tweet.media_url || null,
      author_name: tweet.author_name,
      author_handle: tweet.author_handle,
      author_avatar: tweet.author_avatar,
      likes_count: tweet.likes_count,
      comments_count: tweet.comments_count,
      views_count: tweet.views_count,
      external_url: tweet.external_url,
      created_at: tweet.created_at,
      fetched_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('social_posts')
      .upsert(postsToInsert, { 
        onConflict: 'platform,post_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error storing tweets:', error)
      return { 
        success: false, 
        error: 'Failed to store tweets' 
      }
    }

    console.log(`✅ Stored ${tweets.length} tweets for ${movieTitle}`)
    
    return { 
      success: true, 
      message: `Stored ${tweets.length} tweets`,
      count: tweets.length 
    }
  } catch (error: any) {
    console.error('Error fetching and storing tweets:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to fetch tweets' 
    }
  }
}

/**
 * Fetch and store studio tweets (movie announcements)
 */
export async function fetchAndStoreStudioTweets() {
  try {
    console.log('Fetching studio tweets...')
    
    const tweets = await getStudioTweets()

    if (tweets.length === 0) {
      return { 
        success: true, 
        message: 'No studio tweets found',
        count: 0 
      }
    }

    const supabase = await createClient()
    
    const postsToInsert = tweets.map(tweet => ({
      platform: tweet.platform,
      post_id: tweet.post_id,
      movie_id: null, // Studio tweets might not be tied to specific movies
      content: tweet.content,
      media_url: tweet.media_url || null,
      author_name: tweet.author_name,
      author_handle: tweet.author_handle,
      author_avatar: tweet.author_avatar,
      likes_count: tweet.likes_count,
      comments_count: tweet.comments_count,
      views_count: tweet.views_count,
      external_url: tweet.external_url,
      created_at: tweet.created_at,
      fetched_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('social_posts')
      .upsert(postsToInsert, { 
        onConflict: 'platform,post_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error storing studio tweets:', error)
      return { 
        success: false, 
        error: 'Failed to store studio tweets' 
      }
    }

    console.log(`✅ Stored ${tweets.length} studio tweets`)
    
    return { 
      success: true, 
      message: `Stored ${tweets.length} studio tweets`,
      count: tweets.length 
    }
  } catch (error: any) {
    console.error('Error fetching studio tweets:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to fetch studio tweets' 
    }
  }
}

/**
 * Get cached social posts for a movie
 */
export async function getMovieSocialPosts(
  movieId: number,
  platform?: 'twitter' | 'youtube' | 'instagram'
) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('social_posts')
      .select('*')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Error fetching social posts:', error)
      return { success: false, error: 'Failed to fetch posts', posts: [] }
    }

    return { success: true, posts: posts || [] }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'An error occurred', posts: [] }
  }
}

/**
 * Get all recent social posts (studio announcements)
 */
export async function getRecentSocialPosts(limit: number = 20) {
  try {
    const supabase = await createClient()

    const { data: posts, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching social posts:', error)
      return { success: false, error: 'Failed to fetch posts', posts: [] }
    }

    return { success: true, posts: posts || [] }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'An error occurred', posts: [] }
  }
}
