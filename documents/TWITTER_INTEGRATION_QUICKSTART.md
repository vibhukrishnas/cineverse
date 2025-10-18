# 🚀 Quick Start: Twitter/X Integration for Movie Social Feed

This is a ready-to-implement guide for adding Twitter/X integration to fetch real-time movie updates.

---

## 📋 Prerequisites

1. **Twitter Developer Account**: https://developer.twitter.com
2. **Create a Project** and get:
   - API Key
   - API Secret
   - Bearer Token (for v2 API)
   - Access Token & Secret (for v1.1 API)

3. **Install Dependencies**:
```powershell
npm install twitter-api-v2
```

---

## 🔧 Step 1: Environment Variables

Add to `.env.local`:

```env
# Twitter/X API Credentials
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
```

---

## 📁 Step 2: Create Twitter Client

**File:** `lib/social/twitter.ts`

```typescript
import { TwitterApi } from 'twitter-api-v2'

// Initialize Twitter client
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || '')

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
    // Build search query
    const query = movieYear
      ? `"${movieTitle}" movie ${movieYear} lang:en -is:retweet`
      : `"${movieTitle}" movie lang:en -is:retweet`

    // Search tweets
    const tweets = await readOnlyClient.v2.search(query, {
      max_results: maxResults,
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      'user.fields': ['name', 'username', 'profile_image_url'],
      'expansions': ['author_id'],
    })

    // Map to our format
    const posts: TwitterPost[] = []
    
    for (const tweet of tweets.data.data || []) {
      const author = tweets.includes?.users?.find(u => u.id === tweet.author_id)
      
      if (!author) continue

      posts.push({
        platform: 'twitter',
        post_id: tweet.id,
        content: tweet.text,
        author_name: author.name,
        author_handle: `@${author.username}`,
        author_avatar: author.profile_image_url || '',
        likes_count: tweet.public_metrics?.like_count || 0,
        comments_count: tweet.public_metrics?.reply_count || 0,
        views_count: tweet.public_metrics?.impression_count || 0,
        external_url: `https://twitter.com/${author.username}/status/${tweet.id}`,
        created_at: tweet.created_at || new Date().toISOString(),
      })
    }

    return posts
  } catch (error) {
    console.error('Error fetching movie tweets:', error)
    return []
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
  ],
  tweetsPerAccount: number = 5
): Promise<TwitterPost[]> {
  try {
    const allPosts: TwitterPost[] = []

    for (const username of studioAccounts) {
      // Get user by username
      const user = await readOnlyClient.v2.userByUsername(username)
      
      if (!user.data) continue

      // Get recent tweets
      const tweets = await readOnlyClient.v2.userTimeline(user.data.id, {
        max_results: tweetsPerAccount,
        'tweet.fields': ['created_at', 'public_metrics'],
        'user.fields': ['name', 'username', 'profile_image_url'],
      })

      for (const tweet of tweets.data.data || []) {
        allPosts.push({
          platform: 'twitter',
          post_id: tweet.id,
          content: tweet.text,
          author_name: user.data.name,
          author_handle: `@${user.data.username}`,
          author_avatar: user.data.profile_image_url || '',
          likes_count: tweet.public_metrics?.like_count || 0,
          comments_count: tweet.public_metrics?.reply_count || 0,
          views_count: tweet.public_metrics?.impression_count || 0,
          external_url: `https://twitter.com/${user.data.username}/status/${tweet.id}`,
          created_at: tweet.created_at || new Date().toISOString(),
        })
      }

      // Rate limiting - wait 1 second between accounts
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return allPosts
  } catch (error) {
    console.error('Error fetching studio tweets:', error)
    return []
  }
}

/**
 * Get trending movie hashtags
 */
export async function getTrendingMovieHashtags(): Promise<string[]> {
  try {
    // Note: Trends API requires elevated access
    // This is a basic implementation
    const commonMovieHashtags = [
      '#NowWatching',
      '#MovieNight',
      '#Cinema',
      '#FilmTwitter',
      '#Letterboxd',
      '#MovieReview',
      '#NewOnNetflix',
      '#ComingSoon',
    ]

    return commonMovieHashtags
  } catch (error) {
    console.error('Error fetching trending hashtags:', error)
    return []
  }
}

/**
 * Rate limiting helper
 */
export function checkRateLimit(response: any) {
  const remaining = response.rateLimit?.remaining
  const reset = response.rateLimit?.reset
  
  if (remaining !== undefined && remaining < 5) {
    console.warn(`Twitter API rate limit low: ${remaining} requests remaining`)
    console.warn(`Resets at: ${new Date(reset * 1000).toISOString()}`)
  }
}
```

---

## 📁 Step 3: Server Action to Fetch & Store

**File:** `app/actions/social.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { searchMovieTweets } from '@/lib/social/twitter'

/**
 * Fetch Twitter posts for a movie and store in database
 */
export async function fetchAndStoreMovieTweets(
  movieId: number,
  movieTitle: string,
  movieYear?: number
) {
  try {
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
    
    const { data, error } = await supabase
      .from('social_posts')
      .upsert(
        tweets.map(tweet => ({
          platform: tweet.platform,
          post_id: tweet.post_id,
          movie_id: movieId,
          content: tweet.content,
          media_url: tweet.media_url,
          author_name: tweet.author_name,
          author_handle: tweet.author_handle,
          author_avatar: tweet.author_avatar,
          likes_count: tweet.likes_count,
          comments_count: tweet.comments_count,
          views_count: tweet.views_count,
          external_url: tweet.external_url,
          created_at: tweet.created_at,
          fetched_at: new Date().toISOString(),
        })),
        { onConflict: 'platform,post_id' }
      )

    if (error) {
      console.error('Error storing tweets:', error)
      return { 
        success: false, 
        error: 'Failed to store tweets' 
      }
    }

    return { 
      success: true, 
      message: `Stored ${tweets.length} tweets`,
      count: tweets.length 
    }
  } catch (error) {
    console.error('Error fetching and storing tweets:', error)
    return { 
      success: false, 
      error: 'Failed to fetch tweets' 
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
      .limit(20)

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
```

---

## 📁 Step 4: UI Component

**File:** `components/movies/movie-social-feed.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, MessageCircle, Eye, ExternalLink, RefreshCw } from 'lucide-react'
import { getMovieSocialPosts } from '@/app/actions/social'
import { fetchAndStoreMovieTweets } from '@/app/actions/social'

interface SocialPost {
  id: string
  platform: 'twitter' | 'youtube' | 'instagram'
  content: string
  author_name: string
  author_handle: string
  author_avatar: string
  likes_count: number
  comments_count: number
  views_count: number
  external_url: string
  created_at: string
}

export function MovieSocialFeed({ 
  movieId, 
  movieTitle,
  movieYear 
}: { 
  movieId: number
  movieTitle: string
  movieYear?: number 
}) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [movieId])

  async function loadPosts() {
    setLoading(true)
    const result = await getMovieSocialPosts(movieId)
    if (result.success) {
      setPosts(result.posts)
    }
    setLoading(false)
  }

  async function refreshPosts() {
    setRefreshing(true)
    await fetchAndStoreMovieTweets(movieId, movieTitle, movieYear)
    await loadPosts()
    setRefreshing(false)
  }

  if (loading) {
    return <div className="animate-pulse">Loading social feed...</div>
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            No social media posts found for this movie yet.
          </p>
          <Button onClick={refreshPosts} disabled={refreshing}>
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>Fetch Latest Posts</>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Social Buzz 🔥</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshPosts}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="twitter">𝕏 Twitter</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {posts.map(post => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </TabsContent>

        <TabsContent value="twitter" className="space-y-4">
          {posts.filter(p => p.platform === 'twitter').map(post => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </TabsContent>

        <TabsContent value="youtube" className="space-y-4">
          {posts.filter(p => p.platform === 'youtube').map(post => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </TabsContent>

        <TabsContent value="instagram" className="space-y-4">
          {posts.filter(p => p.platform === 'instagram').map(post => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SocialPostCard({ post }: { post: SocialPost }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.author_avatar} alt={post.author_name} />
              <AvatarFallback>{post.author_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.author_name}</p>
              <p className="text-sm text-muted-foreground">
                {post.author_handle}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{post.platform}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{post.likes_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count.toLocaleString()}</span>
          </div>
          {post.views_count > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.views_count.toLocaleString()}</span>
            </div>
          )}
        </div>

        <a
          href={post.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
        >
          View on {post.platform}
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
}
```

---

## 📁 Step 5: Add to Movie Page

**File:** `app/movie/[id]/page.tsx`

```typescript
// Add import
import { MovieSocialFeed } from '@/components/movies/movie-social-feed'

// Add this section after "Where to Watch"
<section>
  <h2 className="text-2xl font-bold mb-4">Social Buzz</h2>
  <MovieSocialFeed 
    movieId={movieId} 
    movieTitle={movie.title}
    movieYear={releaseYear as number}
  />
</section>
```

---

## 🤖 Step 6: Cron Job for Auto-Sync (Optional)

**File:** `app/api/cron/sync-social/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getTrendingMovies } from '@/lib/tmdb/client'
import { fetchAndStoreMovieTweets } from '@/app/actions/social'

// This endpoint should be called by a cron job (e.g., Vercel Cron)
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get top 20 trending movies
    const trending = await getTrendingMovies('day', 1)
    
    let successCount = 0
    let errorCount = 0

    for (const movie of trending.results.slice(0, 20)) {
      try {
        const result = await fetchAndStoreMovieTweets(
          movie.id,
          movie.title,
          new Date(movie.release_date).getFullYear()
        )
        
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }

        // Rate limiting - wait 2 seconds between movies
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Error syncing movie ${movie.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      synced: successCount,
      errors: errorCount
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
```

**Add to `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-social",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## ✅ Testing

1. **Test Twitter Client**:
```powershell
# Create a test page
npm run dev
# Visit http://localhost:3000/test-twitter
```

2. **Manually Trigger Fetch**:
```typescript
// In browser console or test page
await fetch('/api/test/twitter?movie=Dune&year=2021')
```

3. **Check Database**:
```sql
SELECT * FROM social_posts WHERE platform = 'twitter' LIMIT 10;
```

---

## 📊 Rate Limits

**Twitter Free Tier:**
- 50 requests per 15 minutes
- ~200 requests per hour
- Strategy: Cache results, sync every 6 hours

**Twitter Basic ($100/month):**
- 10,000 requests per month
- Better for production

---

## 🎯 Next Steps

1. ✅ Implement Twitter (this guide)
2. 🟡 Add Instagram integration
3. 🟡 Enhance YouTube integration
4. 🟡 Add Google News RSS
5. 🟡 Build unified social feed page

---

## 🚨 Common Issues

**Issue 1: Rate Limit Exceeded**
```
Solution: Implement exponential backoff and caching
```

**Issue 2: No Results**
```
Solution: Check movie title spelling, try variations
```

**Issue 3: Old Tweets**
```
Solution: Increase maxResults parameter (max 100)
```

---

## 📚 Resources

- **Twitter API Docs**: https://developer.twitter.com/en/docs/twitter-api
- **twitter-api-v2 NPM**: https://www.npmjs.com/package/twitter-api-v2
- **Rate Limits**: https://developer.twitter.com/en/docs/twitter-api/rate-limits

---

**Ready to implement! Copy the code and start fetching real-time movie buzz!** 🚀
