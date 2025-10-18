# 🚀 CineVerse API Quick Reference

Quick copy-paste examples for all API integrations.

---

## 🤖 Gemini AI - Movie Recommendations

```typescript
import { getAIRecommendations } from '@/lib/ai/gemini'

// Get personalized recommendations
const recommendations = await getAIRecommendations([
  { movieId: 550, title: 'Fight Club', rating: 5 },
  { movieId: 13, title: 'Forrest Gump', rating: 4 }
])

// Result: [{ title, reason, similarity }]
```

---

## 🤖 Gemini AI - Review Summaries

```typescript
import { summarizeReviews } from '@/lib/ai/gemini'

const summary = await summarizeReviews([
  { content: 'Amazing movie!', rating: 5, helpful: 10 },
  { content: 'Not bad but slow', rating: 3, helpful: 5 }
])

// Result: { summary, sentiment, keyPoints[], averageRating }
```

---

## 🤖 Gemini AI - Smart Search

```typescript
import { searchMoviesWithAI } from '@/lib/ai/gemini'

const movieTitles = await searchMoviesWithAI('funny but smart comedies')

// Result: ['The Grand Budapest Hotel', 'Knives Out', ...]
```

---

## 🤖 Gemini AI - Content Moderation

```typescript
import { moderateContent } from '@/lib/ai/gemini'

const result = await moderateContent(reviewText, 'review')

// Result: { isAppropriate, hasSpoilers, isSpam, reason? }
```

---

## 🤖 Gemini AI - Chatbot

```typescript
import { chatWithAI } from '@/lib/ai/gemini'

const response = await chatWithAI('What should I watch tonight?')

// Result: AI-generated text response
```

---

## 🎥 YouTube - Get Trailers

```typescript
import { getMovieTrailers } from '@/lib/youtube/client'

const trailers = await getMovieTrailers('Inception', 2010)

// Result: [{ videoId, title, thumbnail, views, likes, duration }]
```

---

## 🎥 YouTube - Get Video Reviews

```typescript
import { getMovieReviews } from '@/lib/youtube/client'

const reviews = await getMovieReviews('Inception', 2010)

// Same structure as trailers
```

---

## 🎥 YouTube - Behind the Scenes

```typescript
import { getBehindTheScenes } from '@/lib/youtube/client'

const videos = await getBehindTheScenes('Inception', 2010)
```

---

## 🎥 YouTube - Trending Videos

```typescript
import { getTrendingMovieVideos } from '@/lib/youtube/client'

const trending = await getTrendingMovieVideos()
```

---

## 📧 Email - Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/email/resend'

await sendWelcomeEmail('user@example.com', 'JohnDoe')
```

---

## 📧 Email - Notification

```typescript
import { sendNotificationEmail } from '@/lib/email/resend'

await sendNotificationEmail(
  'user@example.com',
  'New comment on your review',
  'comment', // or 'follow', 'like', 'mention'
  {
    actorName: 'Alice',
    itemTitle: 'Your review of Inception',
    itemLink: 'https://cineverse.app/review/123'
  }
)
```

---

## 📧 Email - Weekly Digest

```typescript
import { sendWeeklyDigest } from '@/lib/email/resend'

await sendWeeklyDigest('user@example.com', 'JohnDoe', {
  trendingMovies: [
    { title: 'Dune', poster: '...', link: '...' }
  ],
  topReviews: [
    { author: 'Alice', movie: 'Inception', excerpt: '...', link: '...' }
  ],
  channelActivity: [
    { channel: 'Movies', postCount: 42, link: '...' }
  ]
})
```

---

## 📊 Analytics - Initialize

```typescript
'use client'
import { initPostHog } from '@/lib/analytics/posthog'

// In root component or provider
useEffect(() => {
  initPostHog()
}, [])
```

---

## 📊 Analytics - Track Events

```typescript
import { analytics } from '@/lib/analytics/posthog'

// Movie events
analytics.movieViewed(550, 'Fight Club')
analytics.movieRated(550, 5)
analytics.movieAddedToWatchlist(550)

// Review events
analytics.reviewCreated('review_123', 550, 5)
analytics.reviewLiked('review_123')

// Social events
analytics.userFollowed('user_456')
analytics.channelJoined('ch_movies', 'Movies')

// AI events
analytics.aiRecommendationRequested()
analytics.aiRecommendationAccepted(550)

// Video events
analytics.trailerPlayed(550, 'youtube_video_id')

// Search events
analytics.searchPerformed('sci-fi', 42)
```

---

## 📊 Analytics - Identify User

```typescript
import { identifyUser } from '@/lib/analytics/posthog'

// After login
identifyUser(userId, {
  email: 'user@example.com',
  username: 'JohnDoe',
  created_at: '2024-01-01'
})
```

---

## 📊 Analytics - Feature Flags

```typescript
import { isFeatureEnabled } from '@/lib/analytics/posthog'

if (isFeatureEnabled('new_ui_design')) {
  // Show new UI
} else {
  // Show old UI
}
```

---

## 📍 Places - Find Nearby Cinemas

```typescript
import { findNearbyCinemas } from '@/lib/maps/places'

const cinemas = await findNearbyCinemas(40.7128, -74.0060, 5000)

// Result: [{ name, address, rating, location, photos }]
```

---

## 📍 Places - Search Cinemas

```typescript
import { searchCinemas } from '@/lib/maps/places'

const cinemas = await searchCinemas('AMC Theatres', 40.7128, -74.0060)
```

---

## 📍 Places - Get Cinema Details

```typescript
import { getCinemaDetails } from '@/lib/maps/places'

const details = await getCinemaDetails('ChIJN1t_tDeuEmsRUsoyG83frY4')

// Result: { ...cinema, openingHours[], reviews[] }
```

---

## 📍 Places - Get User Location

```typescript
import { getUserLocation } from '@/lib/maps/places'

const location = await getUserLocation()

if (location) {
  console.log(location.lat, location.lng)
}
```

---

## 🔄 Common Patterns

### Pattern: Movie Detail Page with AI + YouTube

```typescript
// In movie detail page
import { getMovieTrailers } from '@/lib/youtube/client'
import { analytics } from '@/lib/analytics/posthog'

export default async function MoviePage({ params }: { params: { id: string } }) {
  const movie = await getMovieDetails(params.id)
  const trailers = await getMovieTrailers(movie.title, movie.releaseYear)
  
  // Track page view
  analytics.movieViewed(movie.id, movie.title)
  
  return (
    <div>
      <h1>{movie.title}</h1>
      <TrailerSection trailers={trailers} />
    </div>
  )
}
```

---

### Pattern: AI-Powered Dashboard

```typescript
// In user dashboard
import { getAIRecommendations } from '@/lib/ai/gemini'

export default async function Dashboard() {
  const userHistory = await getUserWatchHistory()
  const recommendations = await getAIRecommendations(userHistory)
  
  return (
    <div>
      <h2>Recommended for You</h2>
      {recommendations.map(rec => (
        <MovieCard key={rec.title} movie={rec} reason={rec.reason} />
      ))}
    </div>
  )
}
```

---

### Pattern: Signup with Welcome Email

```typescript
// In signup action
import { sendWelcomeEmail } from '@/lib/email/resend'
import { identifyUser, analytics } from '@/lib/analytics/posthog'

export async function signupAction(email: string, username: string) {
  const user = await createUser(email, username)
  
  // Send welcome email
  await sendWelcomeEmail(email, username)
  
  // Track signup
  analytics.signupCompleted('email')
  identifyUser(user.id, { email, username })
  
  return user
}
```

---

### Pattern: Review with AI Moderation

```typescript
// In create review action
import { moderateContent } from '@/lib/ai/gemini'
import { analytics } from '@/lib/analytics/posthog'

export async function createReview(content: string, movieId: number, rating: number) {
  // Auto-moderate content
  const moderation = await moderateContent(content, 'review')
  
  if (!moderation.isAppropriate) {
    throw new Error('Content violates community guidelines')
  }
  
  const review = await saveReview({
    content,
    movieId,
    rating,
    hasSpoilers: moderation.hasSpoilers
  })
  
  // Track creation
  analytics.reviewCreated(review.id, movieId, rating)
  
  return review
}
```

---

## 🧪 Testing

Visit: **http://localhost:3000/test-api-integrations**

Or test individually:
```bash
# Test Gemini AI
curl http://localhost:3000/api/test/gemini

# Test YouTube
curl http://localhost:3000/api/test/youtube

# Test Resend
curl http://localhost:3000/api/test/resend

# Test Google Places
curl http://localhost:3000/api/test/places
```

---

## 🔑 Environment Variables

Required in `.env.local`:

```env
# Gemini AI
GEMINI_API_KEY=AIzaSyDoj_ThgaPj5TGK_TXKzks9aF1aFhMslBA

# YouTube
YOUTUBE_API_KEY=AIzaSyDTrzX4J3k8jUGJD0GQIU4dTttT5aEXU9I

# Resend
RESEND_API_KEY=re_JKdhd83f_ExeBchexKwMvBTffDxB1M35b

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phx_RTQl58Ff0dHZOCWLJUWxJW9M3lxg8X6f87N2JEmUExBCziZ
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Google Places
GOOGLE_PLACES_API_KEY=AIzaSyB8dlCim-kjU0E4V-Rsc5ydxD0NtZuGDj0
```

---

## 📦 Install Dependencies

```bash
npm install
```

Installs:
- `@google/generative-ai`
- `posthog-js`
- `resend`
- `@googlemaps/google-maps-services-js`

---

## 🎯 Quick Wins

**Easiest to implement (30 min each):**
1. Add analytics tracking to existing pages
2. Add YouTube trailers to movie pages
3. Send welcome email on signup

**Highest impact (2-4 hours):**
1. AI recommendation widget on dashboard
2. Smart search with natural language
3. Auto-moderation on content submission

---

## 📞 Support

- **API Docs:** See `API_INTEGRATION_COMPLETE.md`
- **Full Guide:** See `API_INTEGRATION_IMPLEMENTATION.md`
- **Test Page:** `/test-api-integrations`

---

**All APIs ready to use! Start with analytics + YouTube for quick wins.** 🚀
