# 🚀 Enhanced Features Implementation Plan

## Overview
This document outlines the implementation of your requested features for CineVerse:
1. OTT Platform Integration
2. Ticketing Platform Integration
3. Audience Classification System
4. Actor/Actress Social Feeds
5. Video-First Movie Page UI
6. Geolocation Service

---

## 📋 API Keys Required

### REQUIRED for Implementation:

| API | Purpose | Cost | Priority | Get From |
|-----|---------|------|----------|----------|
| **TMDB Watch Providers** | OTT availability | ✅ FREE (included in TMDB) | 🔥 HIGH | Already have! |
| **BookMyShow API** | Theater ticketing | 💰 Commercial | 🔥 HIGH | https://developer.bookmyshow.com |
| **Twitter API v2** | Actor social feeds | 💰 $100/month (Basic) | 🟡 MEDIUM | https://developer.twitter.com |
| **Instagram Graph API** | Actor Instagram posts | ✅ FREE (rate limited) | 🟡 MEDIUM | https://developers.facebook.com |
| **YouTube Data API** | Video content | ✅ FREE (10K/day) | 🔥 HIGH | Already listed! |

### OPTIONAL (Alternatives):

| API | Alternative To | Cost | Notes |
|-----|----------------|------|-------|
| **Atom Tickets API** | BookMyShow | 💰 Commercial | US/Canada focused |
| **Fandango API** | BookMyShow | 💰 Commercial | US market |
| **Custom Ticketing** | BookMyShow | 💰 Variable | Build your own |

---

## 🎯 Implementation Priority Order

Based on complexity and value:

### Phase 1: Foundation (Week 1)
1. ✅ **OTT Platform Integration** - Uses existing TMDB API
2. ✅ **Geolocation Service** - No external API needed
3. ✅ **Video-First Movie UI** - Uses existing YouTube API

### Phase 2: Core Features (Week 2)
4. 🎫 **Ticketing Integration** - Requires BookMyShow API
5. 👥 **Audience Classification** - Database schema + UI

### Phase 3: Advanced (Week 3)
6. 📱 **Actor Social Feeds** - Requires Twitter/Instagram APIs

---

## 📦 Detailed Implementation Specs

### 1. OTT Platform Integration

**Files to Create:**
- `lib/ott/watch-providers.ts` - Fetch OTT availability
- `components/movies/watch-providers.tsx` - Display OTT platforms
- `app/actions/ott.ts` - Server actions

**Database Changes:**
```sql
-- Cache OTT availability
CREATE TABLE ott_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER NOT NULL,
  country_code TEXT DEFAULT 'US',
  providers JSONB, -- {flatrate: [], rent: [], buy: []}
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tmdb_id, country_code)
);
```

**API Used:** TMDB Watch Providers (FREE - already available!)
**No new API key needed!** ✅

---

### 2. Ticketing Platform Integration

**Files to Create:**
- `lib/ticketing/bookmyshow.ts` - BookMyShow API client
- `components/movies/ticket-booking.tsx` - Ticket UI
- `app/actions/tickets.ts` - Server actions
- `app/movie/[id]/tickets/page.tsx` - Ticket booking page

**Database Changes:**
```sql
-- Store theaters and showtimes
CREATE TABLE theaters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'India',
  location GEOGRAPHY(POINT), -- PostGIS for location
  amenities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE showtimes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theater_id UUID REFERENCES theaters(id),
  tmdb_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  show_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  language TEXT,
  format TEXT, -- 2D, 3D, IMAX, etc.
  audience_type TEXT, -- high_class, celebration, normal
  price DECIMAL(10,2),
  available_seats INTEGER,
  booking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_showtimes_theater ON showtimes(theater_id);
CREATE INDEX idx_showtimes_movie ON showtimes(tmdb_id);
CREATE INDEX idx_showtimes_datetime ON showtimes(show_datetime);
```

**API Needed:** 🔴 **BookMyShow API Key Required**
- Apply at: https://developer.bookmyshow.com
- Alternative: Use mock data initially

---

### 3. Audience Classification System

**Files to Create:**
- `components/movies/audience-filter.tsx` - Filter by audience type
- `components/movies/audience-badge.tsx` - Display audience type
- Update existing movie pages to show audience classification

**Database Changes:**
```sql
-- Add audience classification to movies
CREATE TABLE movie_audience_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER NOT NULL,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('high_class', 'celebration', 'normal')),
  description TEXT,
  price_range TEXT, -- e.g., "₹500-1000"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tmdb_id, audience_type)
);

-- Add audience preferences to user profiles
ALTER TABLE profiles ADD COLUMN preferred_audience_types TEXT[] DEFAULT ARRAY['normal'];
```

**No API needed!** ✅ Pure database + UI work

---

### 4. Actor/Actress Social Feed Integration

**Files to Create:**
- `lib/social/twitter.ts` - Twitter API client
- `lib/social/instagram.ts` - Instagram Graph API client
- `components/actors/social-feed.tsx` - Display social posts
- `app/actions/social-feeds.ts` - Server actions
- `app/actor/[id]/page.tsx` - Actor profile page

**Database Changes:**
```sql
-- Store actors/actresses
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profile_path TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  biography TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache social posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES actors(id),
  platform TEXT NOT NULL, -- twitter, instagram
  post_id TEXT UNIQUE NOT NULL,
  content TEXT,
  media_urls TEXT[],
  post_url TEXT NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  engagement JSONB, -- likes, retweets, comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track user follows for notifications
CREATE TABLE actor_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  actor_id UUID REFERENCES actors(id),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, actor_id)
);

CREATE INDEX idx_social_posts_actor ON social_posts(actor_id, posted_at DESC);
CREATE INDEX idx_actor_follows_user ON actor_follows(user_id);
```

**API Needed:** 🔴 **Twitter API v2 + Instagram Graph API**
- Twitter: https://developer.twitter.com ($100/month Basic plan)
- Instagram: https://developers.facebook.com (FREE with rate limits)

---

### 5. Video-First Movie Page UI (70-80% Video)

**Files to Update:**
- `app/movie/[id]/page.tsx` - Redesign layout
- `components/movies/video-hero.tsx` - Large video player
- `components/movies/video-carousel.tsx` - Multiple videos
- `components/movies/movie-info-sidebar.tsx` - Compact info

**New Layout:**
```
┌─────────────────────────────────────────┐
│  Video Player (Trailer/Promo)   [70%]  │
│  Auto-play, muted, loop                 │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  Video Carousel (Trailers, Promos)     │
│  [Thumb][Thumb][Thumb][Thumb]          │
├─────────────────────────────────────────┤
│  Movie Info Sidebar [30%]              │
│  - Title, Rating, Genre                 │
│  - Watch On (OTT)                       │
│  - Book Tickets                         │
│  - Cast (with social links)             │
└─────────────────────────────────────────┘
```

**API Used:** YouTube Data API (already listed!)
**No new API key needed!** ✅

---

### 6. Geolocation Service

**Files to Create:**
- `lib/location/geolocation.ts` - Browser geolocation
- `lib/location/ip-location.ts` - IP-based fallback
- `components/location/location-picker.tsx` - Manual selection
- `hooks/use-location.ts` - React hook for location

**Features:**
1. Request browser geolocation (with user permission)
2. Fallback to IP-based location (with VPN warning)
3. Manual city selection dropdown
4. Store user's preferred location in profile
5. Use location for theater search and content recommendations

**Database Changes:**
```sql
-- Add location to user profiles
ALTER TABLE profiles ADD COLUMN location JSONB DEFAULT '{
  "city": null,
  "state": null,
  "country": null,
  "lat": null,
  "lng": null,
  "source": "manual"
}';

CREATE INDEX idx_profiles_location ON profiles USING GIN(location);
```

**No API needed!** ✅ Browser API + optional IP lookup

---

## 🔑 API Keys Summary

### ✅ Already Have (No Action Needed):
- TMDB API (includes Watch Providers)
- Supabase

### 🟡 Recommended to Get:
1. **YouTube Data API** (FREE) - For video content
   - Get from: https://console.cloud.google.com/apis/credentials
   
### 🔴 Required for Full Features:
2. **BookMyShow API** (Commercial) - For ticketing
   - Apply at: https://developer.bookmyshow.com
   - Alternative: Start with mock data, integrate later

3. **Twitter API v2** (Paid - $100/month) - For actor feeds
   - Get from: https://developer.twitter.com
   - Alternative: Start with Instagram only (free)

4. **Instagram Graph API** (FREE) - For actor feeds
   - Get from: https://developers.facebook.com

---

## 📅 Implementation Timeline

### Week 1: Foundation (No new APIs needed)
- ✅ OTT Platform Integration (uses TMDB)
- ✅ Geolocation Service (browser API)
- ✅ Video-First Movie UI (needs YouTube API)

**Action Required:** Get YouTube Data API key

### Week 2: Core Features
- 🎫 Ticketing Integration (mock data initially)
- 👥 Audience Classification

**Action Required:** Apply for BookMyShow API (takes time)

### Week 3: Advanced Features
- 📱 Actor Social Feeds (start with Instagram)

**Action Required:** Setup Instagram Graph API

---

## 🎬 Let's Start!

**I recommend starting with Phase 1 features since they don't require new commercial APIs:**

1. ✅ **OTT Platform Integration** - Show where to watch (Netflix, Prime, etc.)
2. ✅ **Geolocation Service** - Handle user location for theater search
3. ✅ **Video-First Movie UI** - Immersive video experience

**Which would you like me to implement first?**

Or if you want, I can:
- Start with all 3 Phase 1 features in parallel
- Create mock data for ticketing so you can test the UI
- Setup the database schemas for all features

**Your call! Let me know and I'll start building.** 🚀

---

## 📝 Notes

- All database schemas use PostgreSQL/Supabase
- All code will be TypeScript + Next.js 14
- All UI will use shadcn/ui components
- All features will have proper error handling
- All features will work with your existing auth system

**Ready when you are!** 💪
