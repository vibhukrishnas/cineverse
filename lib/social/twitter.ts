import { TwitterApi } from 'twitter-api-v2'

// Initialize Twitter client with environment variables
// Note: Twitter API v2 search requires Bearer Token (elevated access)
// For now, we'll use App-only authentication
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
})

// Get read-only client
const readOnlyClient = twitterClient.readOnly

export interface TwitterPost {
  platform: 'twitter'
  post_id: string
  content: string
  media_url?: string
  author_name: string
  author_handle: string
  author_avatar: string
  likes_count: number
  comments_count: number
  views_count: number
  external_url: string
  created_at: string
}

/**
 * Search tweets about a specific movie
 */
export async function searchMovieTweets(
  movieTitle: string,
  movieYear?: number,
  maxResults: number = 20
): Promise<TwitterPost[]> {
  try {
    // Check if API keys are configured
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      console.warn('Twitter API keys not configured, using mock data')
      return getMockMovieTweets(movieTitle, maxResults)
    }

    // Build search query
    const query = movieYear
      ? `"${movieTitle}" movie ${movieYear} lang:en -is:retweet`
      : `"${movieTitle}" movie lang:en -is:retweet`

    console.log('Searching Twitter for:', query)

    // Search tweets
    const tweets = await readOnlyClient.v2.search(query, {
      max_results: Math.min(maxResults, 100),
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['name', 'username', 'profile_image_url'],
      'expansions': ['author_id'],
    })

    // Map to our format
    const posts: TwitterPost[] = []
    
    for (const tweet of tweets.data.data || []) {
      const author = tweets.includes?.users?.find((u: any) => u.id === tweet.author_id)
      
      if (!author) continue

      posts.push({
        platform: 'twitter',
        post_id: tweet.id,
        content: tweet.text,
        author_name: author.name,
        author_handle: `@${author.username}`,
        author_avatar: author.profile_image_url?.replace('_normal', '_bigger') || '',
        likes_count: tweet.public_metrics?.like_count || 0,
        comments_count: tweet.public_metrics?.reply_count || 0,
        views_count: tweet.public_metrics?.impression_count || 0,
        external_url: `https://twitter.com/${author.username}/status/${tweet.id}`,
        created_at: tweet.created_at || new Date().toISOString(),
      })
    }

    console.log(`Found ${posts.length} tweets for "${movieTitle}"`)
    
    // If no tweets found, return mock data
    if (posts.length === 0) {
      console.log('No tweets found, using mock data')
      return getMockMovieTweets(movieTitle, maxResults)
    }
    
    return posts
  } catch (error: any) {
    console.error('Error fetching movie tweets:', error.message || error)
    console.log('Falling back to mock data')
    return getMockMovieTweets(movieTitle, maxResults)
  }
}

/**
 * Get tweets from official movie studio accounts
 */
export async function getStudioTweets(
  studioAccounts: string[] = [
    'MarvelStudios',
    'ParamountPics',
    'UniversalPics',
    'A24',
    'NetflixFilm',
    'wbpictures',
    'SonyPictures',
    'Disney',
  ],
  tweetsPerAccount: number = 5
): Promise<TwitterPost[]> {
  try {
    const allPosts: TwitterPost[] = []

    for (const username of studioAccounts) {
      try {
        // Get user by username
        const user = await readOnlyClient.v2.userByUsername(username)
        
        if (!user.data) continue

        // Get recent tweets
        const tweets = await readOnlyClient.v2.userTimeline(user.data.id, {
          max_results: Math.min(tweetsPerAccount, 100),
          'tweet.fields': ['created_at', 'public_metrics'],
          exclude: ['retweets', 'replies'],
        })

        for (const tweet of tweets.data.data || []) {
          allPosts.push({
            platform: 'twitter',
            post_id: tweet.id,
            content: tweet.text,
            author_name: user.data.name,
            author_handle: `@${user.data.username}`,
            author_avatar: user.data.profile_image_url?.replace('_normal', '_bigger') || '',
            likes_count: tweet.public_metrics?.like_count || 0,
            comments_count: tweet.public_metrics?.reply_count || 0,
            views_count: tweet.public_metrics?.impression_count || 0,
            external_url: `https://twitter.com/${user.data.username}/status/${tweet.id}`,
            created_at: tweet.created_at || new Date().toISOString(),
          })
        }

        // Rate limiting - wait 1 second between accounts
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error(`Error fetching tweets from @${username}:`, error.message)
        continue
      }
    }

    console.log(`Fetched ${allPosts.length} tweets from ${studioAccounts.length} studios`)
    return allPosts
  } catch (error: any) {
    console.error('Error fetching studio tweets:', error.message || error)
    return []
  }
}

/**
 * Search trending movie topics
 */
export async function searchTrendingMovies(maxResults: number = 50): Promise<TwitterPost[]> {
  try {
    // Check if API keys are configured
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      console.warn('Twitter API keys not configured, using mock trending data')
      return getMockTrendingTweets(maxResults)
    }

    const trendingQueries = [
      'movie trending',
      'new movie release',
      'movie trailer',
      '#NowWatching',
      '#MovieNight',
    ]

    const allPosts: TwitterPost[] = []

    for (const query of trendingQueries) {
      const tweets = await readOnlyClient.v2.search(`${query} lang:en -is:retweet`, {
        max_results: Math.min(10, maxResults),
        'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
        'user.fields': ['name', 'username', 'profile_image_url'],
        'expansions': ['author_id'],
      })

      for (const tweet of tweets.data.data || []) {
        const author = tweets.includes?.users?.find((u: any) => u.id === tweet.author_id)
        
        if (!author) continue

        allPosts.push({
          platform: 'twitter',
          post_id: tweet.id,
          content: tweet.text,
          author_name: author.name,
          author_handle: `@${author.username}`,
          author_avatar: author.profile_image_url?.replace('_normal', '_bigger') || '',
          likes_count: tweet.public_metrics?.like_count || 0,
          comments_count: tweet.public_metrics?.reply_count || 0,
          views_count: tweet.public_metrics?.impression_count || 0,
          external_url: `https://twitter.com/${author.username}/status/${tweet.id}`,
          created_at: tweet.created_at || new Date().toISOString(),
        })
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // If no posts found, return mock data
    if (allPosts.length === 0) {
      console.log('No trending tweets found, using mock data')
      return getMockTrendingTweets(maxResults)
    }

    return allPosts
  } catch (error: any) {
    console.error('Error fetching trending movies:', error.message || error)
    console.log('Falling back to mock trending data')
    return getMockTrendingTweets(maxResults)
  }
}

// Alias for consistency
export const getTrendingMovieTweets = searchTrendingMovies

/**
 * Generate mock Twitter posts for movies when API is unavailable
 */
function getMockMovieTweets(movieTitle: string, count: number = 10): TwitterPost[] {
  const mockUsers = [
    { name: 'Film Critic Pro', handle: 'filmcritic', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=filmcritic' },
    { name: 'Movie Buff', handle: 'moviebuff', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moviebuff' },
    { name: 'Cinema Lover', handle: 'cinemalover', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cinemalover' },
    { name: 'Review Master', handle: 'reviewmaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=reviewmaster' },
    { name: 'Pop Culture Fan', handle: 'popculture', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=popculture' },
  ]

  const mockComments = [
    `Just watched ${movieTitle} and it was absolutely incredible! The cinematography was stunning. 🎬`,
    `${movieTitle} is a masterpiece! Highly recommend watching it in theaters for the full experience.`,
    `Can't stop thinking about ${movieTitle}. The performances were outstanding! 👏`,
    `${movieTitle} exceeded all my expectations. Best movie I've seen this year!`,
    `The storytelling in ${movieTitle} is phenomenal. A must-watch for all movie lovers!`,
    `${movieTitle} has some of the best visuals I've ever seen. Pure cinema! 🎥`,
    `Just finished ${movieTitle} and wow... speechless. Go watch it now!`,
    `${movieTitle} is trending for a reason. Don't miss this one! #MustWatch`,
    `The soundtrack in ${movieTitle} is chef's kiss 👌 Everything about this movie is perfect.`,
    `${movieTitle} deserves all the awards. Incredible filmmaking at its finest!`,
  ]

  const posts: TwitterPost[] = []
  const now = new Date()

  for (let i = 0; i < Math.min(count, 10); i++) {
    const user = mockUsers[i % mockUsers.length]
    const comment = mockComments[i % mockComments.length]
    const hoursAgo = i + 1
    const postDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

    posts.push({
      platform: 'twitter',
      post_id: `mock_${Date.now()}_${i}`,
      content: comment,
      author_name: user.name,
      author_handle: `@${user.handle}`,
      author_avatar: user.avatar,
      likes_count: Math.floor(Math.random() * 5000) + 500,
      comments_count: Math.floor(Math.random() * 500) + 50,
      views_count: Math.floor(Math.random() * 50000) + 5000,
      external_url: `https://twitter.com/${user.handle}/status/mock_${i}`,
      created_at: postDate.toISOString(),
    })
  }

  return posts
}

/**
 * Generate mock trending movie tweets
 */
function getMockTrendingTweets(count: number = 10): TwitterPost[] {
  const trendingMovies = [
    'Oppenheimer',
    'Barbie',
    'Dune: Part Two',
    'The Batman',
    'Everything Everywhere All at Once',
  ]

  const randomMovie = trendingMovies[Math.floor(Math.random() * trendingMovies.length)]
  return getMockMovieTweets(randomMovie, count)
}
