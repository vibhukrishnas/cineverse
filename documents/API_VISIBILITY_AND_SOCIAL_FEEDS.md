# 🔍 API Visibility & Social Feeds Analysis

**Date:** October 5, 2025  
**Issues Addressed:**
1. Why API keys aren't visible in action on the website
2. Using X/Twitter API for movie updates from social platforms

---

## 🚨 **ISSUE 1: API Keys Not Visible in Website**

### **You're Absolutely Right!** ✅

The APIs mentioned in documentation are **barely visible** or **not implemented** in the actual UI. Here's why:

---

### **1. YouTube API** 🎥

#### **Status:** Partially Implemented, Not Visible

**Where it SHOULD appear:**
- Movie detail pages - Video trailers section
- Behind-the-scenes content
- Movie reviews from YouTube

**Where it's ACTUALLY used:**
```typescript
// app/movie/[id]/page.tsx - Line 126
{/* YouTube Trailers & Content */}
<TrailerSection 
  movieTitle={movie.title}
  movieId={movieId}
  releaseYear={releaseYear as number}
/>
```

**The Problem:**
- ✅ Code exists (`lib/youtube/client.ts`)
- ✅ Component exists (`TrailerSection`)
- ⚠️ **BUT** API key likely not configured
- ⚠️ Falls back to TMDB videos only
- ⚠️ Users see "YouTube" section but it's TMDB data!

**User Experience:**
```
Movie Page
  ↓
[Official Videos] ← TMDB videos
  ↓
[YouTube Trailers & Content] ← Should be YouTube API but likely shows nothing
```

---

### **2. Gemini AI** 🤖

#### **Status:** Code Exists, **NOT VISIBLE ANYWHERE**

**Where it SHOULD appear:**
- Dashboard - AI-powered recommendations
- Movie detail - "AI Suggests" section
- Review summaries - AI-generated insights

**Where it's ACTUALLY used:**
- ❌ **NOWHERE** in the UI!
- Code exists: `lib/ai/gemini.ts`
- Functions ready: `getAIRecommendations()`, `summarizeReviews()`
- **BUT** no page calls these functions

**Searched entire codebase:**
```bash
grep -r "getAIRecommendations" app/**/*.tsx
# Result: ZERO matches

grep -r "gemini" app/**/*.tsx  
# Result: ZERO matches in pages
```

**Verdict:** 🔴 **Dead code - implemented but never integrated into UI**

---

### **3. Resend Email API** 📧

#### **Status:** Backend Only, No UI Indicator

**What it does:**
- Welcome emails after signup
- Notification emails
- Weekly digest emails

**Where it's visible:**
- ❌ **NOWHERE** - It's a background service
- No "Email sent" confirmation in UI
- No email preferences page
- Users have NO idea emails are being sent (or not)

**The Problem:**
- Code exists: `lib/email/resend.ts`
- ⚠️ But no UI to test/verify
- ⚠️ No admin panel to view email logs
- ⚠️ Users can't see if emails failed

---

### **4. PostHog Analytics** 📊

#### **Status:** Invisible by Design (Analytics)

**What it tracks:**
- Page views
- Button clicks
- User behavior
- Feature usage

**Where it's visible:**
- ❌ **NOWHERE** - It's backend analytics
- Only visible in PostHog dashboard (external)
- No user-facing features

---

### **5. Google Places API** 📍

#### **Status:** NOT IMPLEMENTED

**Where it SHOULD appear:**
- Theater search by location
- Location autocomplete
- "Find theaters near me"

**Where it's ACTUALLY used:**
- ❌ **NOWHERE**
- Code exists: `lib/maps/places.ts`
- **BUT** theater pages don't use it
- Uses hardcoded theater locations instead

---

## 📊 **VISIBILITY SUMMARY**

| API | Code Exists | UI Integration | User Can See It | Verdict |
|-----|-------------|----------------|-----------------|---------|
| **TMDB** | ✅ Yes | ✅ Full | ✅ Everywhere | 🟢 **Working** |
| **YouTube** | ✅ Yes | 🟡 Partial | ⚠️ Maybe | 🟡 **Hidden/Broken** |
| **Gemini AI** | ✅ Yes | ❌ None | ❌ Never | 🔴 **Dead Code** |
| **Resend** | ✅ Yes | ❌ Backend | ❌ No | 🟡 **Background** |
| **PostHog** | ✅ Yes | ❌ Backend | ❌ No | 🟡 **Background** |
| **Places** | ✅ Yes | ❌ None | ❌ Never | 🔴 **Not Used** |
| **OMDB** | ❌ No | ❌ No | ❌ Never | 🔴 **Not Implemented** |
| **Fanart** | ❌ No | ❌ No | ❌ Never | 🔴 **Not Implemented** |

### **Your Feeling is 100% Correct:**
Most API keys are **just configuration** with **little to no visible impact** on the user experience!

---

## 🚨 **ISSUE 2: Social Feeds for Movie Updates**

### **Current Implementation:**

#### **What EXISTS:**
```sql
-- Database table for social posts
CREATE TABLE social_posts (
  platform TEXT CHECK (platform IN ('twitter', 'youtube', 'instagram')),
  post_id TEXT,
  movie_id INTEGER,
  content TEXT,
  author_name TEXT,
  author_handle TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  external_url TEXT,
  created_at TIMESTAMPTZ
);
```

**Server Actions Prepared:**
- ✅ `getSocialPostsForMovie(movieId)` - Fetch posts about a movie
- ✅ `getRecentSocialPosts(platform)` - Get platform-specific posts
- ✅ `searchSocialPosts(query)` - Search social content
- ✅ `getTrendingSocialPosts()` - Get trending posts

#### **What's MISSING:**
- ❌ **NO API integration** - Placeholder functions only
- ❌ **NO real data** - Database table is empty
- ❌ **NO UI components** - Feed shows internal user reviews only

**Current Feed Shows:**
```typescript
// app/feed/page.tsx
<FeedList /> // Shows:
  ↓
1. User reviews from YOUR platform
2. User follow activity from YOUR platform
3. NO external social media content
```

---

### **Your Suggestion: Use X/Twitter API** ✅ **EXCELLENT IDEA!**

Yes! You can absolutely fetch movie updates from **Twitter/X, Instagram, YouTube, Google News** using their APIs.

---

## 🎯 **RECOMMENDED IMPLEMENTATION**

### **Phase 1: Twitter/X Integration** 🐦

#### **API: Twitter/X API v2**
- **Cost:** Free tier available (50 requests/15min) or Basic ($100/month)
- **Get it:** https://developer.twitter.com

#### **What to Fetch:**
```typescript
// 1. Movie Buzz
Search for tweets about specific movies
"Dune Part 2" + "movie" → Get latest discussions

// 2. Official Updates
Follow official accounts:
- @MarvelStudios
- @ParamountPics  
- @UniversalPics
- @A24
- @Netflix

// 3. Trending Movies
Get trending hashtags:
#Oppenheimer #Barbie #DunePartTwo

// 4. Celebrity/Actor Updates
Follow actors' accounts for behind-the-scenes content
```

#### **Implementation:**

**Step 1: Create Twitter Client**
```typescript
// lib/social/twitter.ts
import { TwitterApi } from 'twitter-api-v2'

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
})

export async function fetchMovieTweets(movieTitle: string, movieYear: number) {
  const query = `"${movieTitle}" movie lang:en -is:retweet`
  
  const tweets = await client.v2.search(query, {
    max_results: 20,
    'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
    'user.fields': ['name', 'username', 'profile_image_url'],
    'expansions': ['author_id']
  })

  return tweets.data.map(tweet => ({
    platform: 'twitter',
    post_id: tweet.id,
    content: tweet.text,
    author_name: tweet.author.name,
    author_handle: `@${tweet.author.username}`,
    author_avatar: tweet.author.profile_image_url,
    likes_count: tweet.public_metrics.like_count,
    comments_count: tweet.public_metrics.reply_count,
    views_count: tweet.public_metrics.impression_count,
    external_url: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`,
    created_at: tweet.created_at
  }))
}

export async function fetchTrendingMovieTweets() {
  // Get trending topics related to movies
  const trends = await client.v1.trendsAvailable()
  return trends.filter(trend => 
    trend.name.includes('movie') || 
    trend.name.includes('film')
  )
}

export async function fetchOfficialMovieAccounts() {
  // Follow official studio accounts
  const accounts = [
    'MarvelStudios',
    'ParamountPics',
    'UniversalPics',
    'A24',
    'NetflixFilm'
  ]
  
  const timelines = await Promise.all(
    accounts.map(username => 
      client.v2.userTimeline(username, { max_results: 5 })
    )
  )
  
  return timelines.flat()
}
```

**Step 2: Background Job to Fetch & Cache**
```typescript
// app/api/cron/fetch-social-posts/route.ts
export async function GET() {
  // Fetch trending movies from TMDB
  const trendingMovies = await getTrendingMovies()
  
  // For each movie, fetch social posts
  for (const movie of trendingMovies.results.slice(0, 20)) {
    // Twitter
    const tweets = await fetchMovieTweets(movie.title, movie.release_date)
    
    // Store in database
    await supabase.from('social_posts').upsert(
      tweets.map(tweet => ({
        ...tweet,
        movie_id: movie.id
      }))
    )
    
    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return Response.json({ success: true })
}
```

**Step 3: Display in UI**
```typescript
// components/movies/social-feed.tsx
export function MovieSocialFeed({ movieId }: { movieId: number }) {
  const [posts, setPosts] = useState([])
  
  useEffect(() => {
    async function loadPosts() {
      const result = await getSocialPostsForMovie(movieId, 10)
      setPosts(result.posts)
    }
    loadPosts()
  }, [movieId])

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">What People Are Saying</h3>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="twitter">𝕏 Twitter</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
        </TabsList>

        {posts.map(post => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={post.author_avatar} />
                </Avatar>
                <div>
                  <p className="font-medium">{post.author_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {post.author_handle}
                  </p>
                </div>
                <Badge>{post.platform}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p>{post.content}</p>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <span>❤️ {post.likes_count}</span>
                <span>💬 {post.comments_count}</span>
                <span>👁️ {post.views_count}</span>
              </div>
              <a 
                href={post.external_url} 
                target="_blank"
                className="text-primary hover:underline mt-2 block"
              >
                View on {post.platform} →
              </a>
            </CardContent>
          </Card>
        ))}
      </Tabs>
    </div>
  )
}
```

---

### **Phase 2: Instagram Integration** 📷

#### **API: Instagram Graph API**
- **Cost:** FREE (with Facebook Business account)
- **Get it:** https://developers.facebook.com

#### **What to Fetch:**
```typescript
// 1. Hashtag searches
#MovieName #ComingSoon #BehindTheScenes

// 2. Official movie accounts
@paramountpictures @netflix @disneyplus

// 3. Actor/Director posts
Behind-the-scenes content from cast
```

**Implementation:**
```typescript
// lib/social/instagram.ts
export async function fetchInstagramPosts(hashtag: string) {
  const response = await fetch(
    `https://graph.instagram.com/ig_hashtag_search?user_id=${USER_ID}&q=${hashtag}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`
      }
    }
  )
  
  const data = await response.json()
  
  // Get recent media for hashtag
  const mediaResponse = await fetch(
    `https://graph.instagram.com/${data.data[0].id}/recent_media?user_id=${USER_ID}&fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`
      }
    }
  )
  
  return mediaResponse.json()
}
```

---

### **Phase 3: YouTube Integration** 🎥

#### **You Already Have the Code!** ✅

**Existing:**
- `lib/youtube/client.ts` - YouTube Data API client
- Functions: `getMovieTrailers()`, `getMovieReviews()`

**Enhance It:**
```typescript
// Add to lib/youtube/client.ts

// Search for movie-related videos
export async function searchMovieContent(movieTitle: string) {
  const query = `${movieTitle} movie official trailer review`
  
  const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
  
  const response = await fetch(searchUrl)
  return response.json()
}

// Get channel uploads (studio channels)
export async function getStudioChannelVideos(channelId: string) {
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&key=${YOUTUBE_API_KEY}`
  
  const response = await fetch(url)
  return response.json()
}
```

**Studio Channels to Follow:**
```typescript
const STUDIO_CHANNELS = {
  marvel: 'UCvC4D8onUfXzvjTOM-dBfEA',
  paramount: 'UCF8tL66lsS6jDCZpSJlyEmA',
  universal: 'UCq6SR2gY-xC1CBEyhGLdJew',
  a24: 'UCuPivVjnfNo4mb3Oog_frZg',
  netflix: 'UCWOA1ZGywLbqmigxE4Qlvuw'
}
```

---

### **Phase 4: Google News Integration** 📰

#### **API: Google News RSS / News API**
- **Option 1:** Google News RSS (FREE, no API key)
- **Option 2:** NewsAPI.org (FREE tier: 100 req/day)

**Implementation:**
```typescript
// lib/social/news.ts
export async function fetchMovieNews(movieTitle: string) {
  // Option 1: Google News RSS
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(movieTitle + ' movie')}&hl=en-US&gl=US&ceid=US:en`
  
  const response = await fetch(rssUrl)
  const xml = await response.text()
  
  // Parse RSS XML
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = doc.querySelectorAll('item')
  
  return Array.from(items).map(item => ({
    title: item.querySelector('title')?.textContent,
    link: item.querySelector('link')?.textContent,
    pubDate: item.querySelector('pubDate')?.textContent,
    source: item.querySelector('source')?.textContent
  }))
}

// Option 2: NewsAPI.org
export async function fetchMovieNewsAPI(movieTitle: string) {
  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${movieTitle}+movie&apiKey=${process.env.NEWS_API_KEY}&sortBy=publishedAt&language=en`
  )
  
  return response.json()
}
```

---

## 🎯 **RECOMMENDED ARCHITECTURE**

### **1. Centralized Social Feed Manager**

```typescript
// lib/social/feed-manager.ts
export class SocialFeedManager {
  async fetchAllSources(movieId: number, movieTitle: string) {
    const [tweets, instagram, youtube, news] = await Promise.all([
      fetchMovieTweets(movieTitle),
      fetchInstagramPosts(movieTitle),
      searchMovieContent(movieTitle),
      fetchMovieNews(movieTitle)
    ])

    // Normalize all sources to common format
    const allPosts = [
      ...this.normalizeTweets(tweets),
      ...this.normalizeInstagram(instagram),
      ...this.normalizeYouTube(youtube),
      ...this.normalizeNews(news)
    ]

    // Sort by recency
    allPosts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Store in database
    await supabase.from('social_posts').upsert(
      allPosts.map(post => ({ ...post, movie_id: movieId }))
    )

    return allPosts
  }
}
```

### **2. Cron Job for Background Fetching**

```typescript
// app/api/cron/sync-social-feeds/route.ts
// Run every hour via Vercel Cron or similar

export async function GET() {
  const manager = new SocialFeedManager()
  
  // Get top 50 trending movies
  const trending = await getTrendingMovies()
  
  for (const movie of trending.results.slice(0, 50)) {
    await manager.fetchAllSources(movie.id, movie.title)
    
    // Rate limiting
    await sleep(2000) // 2 seconds between movies
  }
  
  return Response.json({ success: true })
}
```

### **3. Real-time UI Components**

```typescript
// app/movie/[id]/page.tsx - Add this section

<section>
  <h2 className="text-2xl font-bold mb-4">Social Buzz 📱</h2>
  <MovieSocialFeed movieId={movieId} movieTitle={movie.title} />
</section>
```

---

## 💰 **COST ANALYSIS**

| API | Free Tier | Paid Tier | Recommendation |
|-----|-----------|-----------|----------------|
| **Twitter/X** | 50 req/15min | $100/month (1M tweets) | 🟢 Start with Free |
| **Instagram** | FREE | - | 🟢 Use Free |
| **YouTube** | 10K/day | $0/request | 🟢 Already have |
| **Google News RSS** | FREE | - | 🟢 Use Free |
| **NewsAPI.org** | 100 req/day | $449/month | 🟡 Use free tier |

**Total Monthly Cost:** 
- **Free Tier:** $0 (with limitations)
- **Paid (X Premium):** $100/month

---

## ✅ **ACTION PLAN**

### **Week 1: Twitter Integration**
1. ✅ Sign up for Twitter Developer account
2. ✅ Get API keys (Free tier to start)
3. ✅ Implement `lib/social/twitter.ts`
4. ✅ Create cron job to fetch tweets
5. ✅ Build `MovieSocialFeed` component
6. ✅ Add to movie detail pages

### **Week 2: Instagram & YouTube**
1. ✅ Setup Instagram Graph API
2. ✅ Enhance existing YouTube client
3. ✅ Add tabbed interface (Twitter/Instagram/YouTube)
4. ✅ Implement engagement metrics display

### **Week 3: News & Polish**
1. ✅ Add Google News RSS integration
2. ✅ Build unified social feed page (`/social`)
3. ✅ Add "Trending Movies on Social Media" widget
4. ✅ Implement real-time updates

---

## 🎯 **CONCLUSION**

### **Your Observations are 100% Correct:**

1. ✅ **API keys are barely visible** - Most are background services or dead code
2. ✅ **Using X/Twitter API is a GREAT idea** - Essential for real-time movie buzz
3. ✅ **Social feeds need external data** - Current feed only shows internal user activity

### **Next Steps:**
1. **Implement Twitter integration first** (highest value)
2. **Add Instagram for visual content** (behind-the-scenes photos)
3. **Enhance YouTube integration** (you already have the code!)
4. **Add Google News** for articles and press releases

**This will transform CineVerse from a closed platform into a real-time movie discussion hub!** 🚀
