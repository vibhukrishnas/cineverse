'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  fetchUserTweets, 
  fetchTweetsFromAccounts,
  tweetToPostData,
  type TweetData 
} from '@/lib/twitter/auto-sync'
import { revalidatePath } from 'next/cache'

/**
 * Configuration for Twitter sync
 */
interface TwitterSyncConfig {
  username: string
  channelSlug: string
  enabled: boolean
  lastTweetId?: string
}

/**
 * Get Twitter sync configuration from database
 */
export async function getTwitterSyncConfigs(): Promise<TwitterSyncConfig[]> {
  const supabase = await createClient()
  
  // Get from channels that have twitter_handle set
  const { data: channels, error } = await supabase
    .from('channels')
    .select('slug, twitter_handle, twitter_sync_enabled, last_synced_tweet_id')
    .not('twitter_handle', 'is', null)
    .eq('twitter_sync_enabled', true)

  if (error) {
    console.error('❌ Error fetching sync configs:', error)
    return []
  }

  return channels?.map(ch => ({
    username: ch.twitter_handle!,
    channelSlug: ch.slug,
    enabled: ch.twitter_sync_enabled || false,
    lastTweetId: ch.last_synced_tweet_id
  })) || []
}

/**
 * Create a channel post from a tweet
 */
export async function createPostFromTweet(
  tweet: TweetData,
  channelSlug: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // For auto-sync, we need a system user or use the channel creator
    if (!user) {
      // Get channel creator as fallback
      const { data: channel } = await supabase
        .from('channels')
        .select('id, created_by')
        .eq('slug', channelSlug)
        .single()

      if (!channel) {
        return { success: false, error: 'Channel not found' }
      }

      // Check if tweet already posted (prevent duplicates)
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('channel_id', channel.id)
        .contains('metadata', { tweet_id: tweet.id })
        .single()

      if (existing) {
        console.log(`⏭️  Tweet ${tweet.id} already posted`)
        return { success: true, postId: existing.id }
      }

      // Create post as channel creator
      const postData = tweetToPostData(tweet, channel.id)
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          ...postData,
          author_id: channel.created_by,
          metadata: postData.metadata
        })
        .select('id, channel_id')
        .single()

      if (postError) {
        console.error('❌ Error creating post:', postError)
        return { success: false, error: postError.message }
      }

      // Update last synced tweet ID
      await supabase
        .from('channels')
        .update({ last_synced_tweet_id: tweet.id })
        .eq('id', channel.id)

      revalidatePath(`/channel/${channelSlug}`)
      console.log(`✅ Created post ${post.id} from tweet ${tweet.id}`)
      
      return { success: true, postId: post.id }
    }

    // If user is authenticated, create as that user
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('slug', channelSlug)
      .single()

    if (!channel) {
      return { success: false, error: 'Channel not found' }
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('channel_id', channel.id)
      .contains('metadata', { tweet_id: tweet.id })
      .single()

    if (existing) {
      return { success: true, postId: existing.id }
    }

    const postData = tweetToPostData(tweet, channel.id)
    
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        ...postData,
        author_id: user.id,
        metadata: postData.metadata
      })
      .select('id')
      .single()

    if (postError) {
      return { success: false, error: postError.message }
    }

    revalidatePath(`/channel/${channelSlug}`)
    return { success: true, postId: post.id }

  } catch (error: any) {
    console.error('❌ Error in createPostFromTweet:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync tweets for a specific channel
 */
export async function syncChannelTweets(channelSlug: string, maxTweets: number = 5) {
  try {
    const supabase = await createClient()
    
    // Get channel with Twitter config
    const { data: channel, error } = await supabase
      .from('channels')
      .select('twitter_handle, last_synced_tweet_id, twitter_sync_enabled')
      .eq('slug', channelSlug)
      .single()

    if (error || !channel) {
      return { success: false, error: 'Channel not found' }
    }

    if (!channel.twitter_handle) {
      return { success: false, error: 'No Twitter account configured' }
    }

    if (!channel.twitter_sync_enabled) {
      return { success: false, error: 'Twitter sync is disabled for this channel' }
    }

    console.log(`🔄 Syncing tweets for channel: ${channelSlug}`)

    // Fetch latest tweets
    const tweets = await fetchUserTweets(
      channel.twitter_handle,
      maxTweets,
      channel.last_synced_tweet_id || undefined
    )

    if (tweets.length === 0) {
      return { success: true, postsCreated: 0, message: 'No new tweets' }
    }

    // Create posts from tweets (newest first)
    const results = []
    for (const tweet of tweets) {
      const result = await createPostFromTweet(tweet, channelSlug)
      results.push(result)
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const successCount = results.filter(r => r.success).length
    
    return {
      success: true,
      postsCreated: successCount,
      totalTweets: tweets.length,
      message: `Created ${successCount} posts from ${tweets.length} tweets`
    }

  } catch (error: any) {
    console.error('❌ Error syncing channel tweets:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync all configured channels
 */
export async function syncAllChannels(maxTweetsPerChannel: number = 3) {
  try {
    console.log('🔄 Starting Twitter sync for all channels...')

    const configs = await getTwitterSyncConfigs()
    
    if (configs.length === 0) {
      return { 
        success: true, 
        message: 'No channels configured for Twitter sync' 
      }
    }

    console.log(`📋 Found ${configs.length} channels to sync`)

    const results = []
    for (const config of configs) {
      if (!config.enabled) continue

      const result = await syncChannelTweets(config.channelSlug, maxTweetsPerChannel)
      results.push({
        channel: config.channelSlug,
        ...result
      })

      // Delay between channels
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const totalPosts = results.reduce((sum, r) => sum + (r.postsCreated || 0), 0)

    return {
      success: true,
      channelsSynced: results.length,
      totalPosts,
      results
    }

  } catch (error: any) {
    console.error('❌ Error in syncAllChannels:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Manual trigger for admins to sync tweets
 */
export async function manualSyncTweets(channelSlug?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'super_admin', 'moderator'])
    .single()

  if (!userRole) {
    return { success: false, error: 'Unauthorized - admin access required' }
  }

  if (channelSlug) {
    return await syncChannelTweets(channelSlug, 10)
  } else {
    return await syncAllChannels(5)
  }
}

/**
 * Enable/disable Twitter sync for a channel
 */
export async function toggleTwitterSync(
  channelSlug: string,
  enabled: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user is channel moderator or admin
  const { data: channel } = await supabase
    .from('channels')
    .select('id, created_by, moderator_ids')
    .eq('slug', channelSlug)
    .single()

  if (!channel) {
    return { success: false, error: 'Channel not found' }
  }

  const isModerator = 
    channel.created_by === user.id ||
    channel.moderator_ids?.includes(user.id)

  if (!isModerator) {
    return { success: false, error: 'Unauthorized - moderator access required' }
  }

  const { error } = await supabase
    .from('channels')
    .update({ twitter_sync_enabled: enabled })
    .eq('id', channel.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/channel/${channelSlug}`)
  
  return { 
    success: true, 
    message: `Twitter sync ${enabled ? 'enabled' : 'disabled'} for ${channelSlug}` 
  }
}
