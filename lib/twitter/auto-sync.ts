// Twitter Auto-Sync for Movie Discussions
// Fetches latest tweets from movie accounts and posts to channels

import { TwitterApi } from 'twitter-api-v2'

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || ''

// Initialize Twitter client
let twitterClient: TwitterApi | null = null
if (TWITTER_BEARER_TOKEN) {
  twitterClient = new TwitterApi(TWITTER_BEARER_TOKEN)
}

export function isTwitterAvailable(): boolean {
  return twitterClient !== null && TWITTER_BEARER_TOKEN.length > 0
}

export interface TweetData {
  id: string
  text: string
  author: {
    username: string
    name: string
    profile_image_url?: string
  }
  created_at: string
  entities?: {
    urls?: Array<{
      url: string
      expanded_url: string
      display_url: string
    }>
    hashtags?: Array<{
      tag: string
    }>
    mentions?: Array<{
      username: string
    }>
  }
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  attachments?: {
    media_keys?: string[]
  }
}

/**
 * Fetch latest tweets from a specific user
 */
export async function fetchUserTweets(
  username: string,
  maxResults: number = 10,
  sinceId?: string
): Promise<TweetData[]> {
  if (!twitterClient) {
    console.warn('⚠️ Twitter client not available - missing bearer token')
    return []
  }

  try {
    console.log(`🐦 Fetching tweets from @${username}`)

    // Get user ID first
    const user = await twitterClient.v2.userByUsername(username)
    if (!user.data) {
      console.error(`❌ User @${username} not found`)
      return []
    }

    // Fetch user's tweets
    const params: any = {
      max_results: Math.min(maxResults, 100),
      'tweet.fields': 'created_at,public_metrics,entities,attachments',
      'user.fields': 'username,name,profile_image_url',
      expansions: 'author_id'
    }

    if (sinceId) {
      params.since_id = sinceId
    }

    const tweets = await twitterClient.v2.userTimeline(user.data.id, params)

    if (!tweets.data || tweets.data.data.length === 0) {
      console.log(`📭 No new tweets from @${username}`)
      return []
    }

    // Transform to our format
    const tweetData: TweetData[] = tweets.data.data.map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      author: {
        username: username,
        name: user.data?.name || username,
        profile_image_url: user.data?.profile_image_url
      },
      created_at: tweet.created_at,
      entities: tweet.entities,
      public_metrics: tweet.public_metrics,
      attachments: tweet.attachments
    }))

    console.log(`✅ Fetched ${tweetData.length} tweets from @${username}`)
    return tweetData
  } catch (error: any) {
    console.error(`❌ Error fetching tweets from @${username}:`, error.message)
    return []
  }
}

/**
 * Fetch tweets from multiple accounts
 */
export async function fetchTweetsFromAccounts(
  accounts: Array<{ username: string; sinceId?: string }>,
  maxPerAccount: number = 5
): Promise<Map<string, TweetData[]>> {
  const results = new Map<string, TweetData[]>()

  for (const account of accounts) {
    const tweets = await fetchUserTweets(
      account.username,
      maxPerAccount,
      account.sinceId
    )
    if (tweets.length > 0) {
      results.set(account.username, tweets)
    }
  }

  return results
}

/**
 * Search tweets by hashtag or keyword
 */
export async function searchTweets(
  query: string,
  maxResults: number = 10
): Promise<TweetData[]> {
  if (!twitterClient) {
    console.warn('⚠️ Twitter client not available')
    return []
  }

  try {
    console.log(`🔍 Searching tweets: ${query}`)

    const tweets = await twitterClient.v2.search(query, {
      max_results: Math.min(maxResults, 100),
      'tweet.fields': 'created_at,public_metrics,entities,attachments',
      'user.fields': 'username,name,profile_image_url',
      expansions: 'author_id'
    })

    if (!tweets.data || tweets.data.data.length === 0) {
      console.log('📭 No tweets found')
      return []
    }

    // Get author details from includes
    const users = tweets.data.includes?.users || []
    const userMap = new Map(users.map((u: any) => [u.id, u]))

    const tweetData: TweetData[] = tweets.data.data.map((tweet: any) => {
      const author = userMap.get(tweet.author_id) || {}
      return {
        id: tweet.id,
        text: tweet.text,
        author: {
          username: author.username || 'unknown',
          name: author.name || 'Unknown',
          profile_image_url: author.profile_image_url
        },
        created_at: tweet.created_at,
        entities: tweet.entities,
        public_metrics: tweet.public_metrics,
        attachments: tweet.attachments
      }
    })

    console.log(`✅ Found ${tweetData.length} tweets`)
    return tweetData
  } catch (error: any) {
    console.error('❌ Error searching tweets:', error.message)
    return []
  }
}

/**
 * Format tweet text for display (expand URLs, format hashtags)
 */
export function formatTweetText(tweet: TweetData): string {
  let text = tweet.text

  // Expand URLs
  if (tweet.entities?.urls) {
    for (const url of tweet.entities.urls) {
      text = text.replace(url.url, url.expanded_url || url.display_url)
    }
  }

  return text
}

/**
 * Convert tweet to channel post format
 */
export function tweetToPostData(tweet: TweetData, channelId: string) {
  const formattedText = formatTweetText(tweet)
  
  // Extract first URL as thumbnail if available
  const firstUrl = tweet.entities?.urls?.[0]?.expanded_url
  
  // Create post title from first line or first 100 chars
  const firstLine = formattedText.split('\n')[0]
  const title = firstLine.length > 100 
    ? firstLine.substring(0, 97) + '...' 
    : firstLine

  return {
    channel_id: channelId,
    title: `🐦 ${title}`,
    content: `${formattedText}

---
📱 **Source:** [@${tweet.author.username}](https://twitter.com/${tweet.author.username}/status/${tweet.id})
❤️ ${tweet.public_metrics?.like_count || 0} likes • 🔄 ${tweet.public_metrics?.retweet_count || 0} retweets`,
    flair: 'News',
    thumbnail_url: firstUrl?.includes('image') ? firstUrl : undefined,
    metadata: {
      source: 'twitter',
      tweet_id: tweet.id,
      author_username: tweet.author.username,
      created_at: tweet.created_at
    }
  }
}
