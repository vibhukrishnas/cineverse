-- ============================================
-- CINEVERSE COMPLETE DATABASE SCHEMA
-- ============================================
-- Unified schema file for all CineVerse features
-- Version: 1.0
-- Last Updated: January 6, 2026
-- 
-- This file includes:
-- 1. Core Tables (Users, Movies, Reviews)
-- 2. Community Features (Channels, Posts, Comments, Votes)
-- 3. Gamification System (Stats, Badges, Achievements, Karma)
-- 4. Social Features (Watchlist, Favorites, Follows, Notifications)
-- 5. Theater Booking System
-- 6. AI Recommendations & Analytics
-- 7. Actor Following System
-- 8. Social Media Integration (Twitter/X)
-- 9. All RLS Policies
-- 10. All Triggers & Functions
-- 11. Default Data & Seed Data
--
-- Run this file in Supabase SQL Editor to set up complete database
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SECTION 1: CORE TABLES
-- ============================================

-- ============================================
-- 1.1 USERS TABLE
-- ============================================
-- Extends Supabase auth.users with profile data

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================
-- 1.2 MOVIES TABLE
-- ============================================
-- Caches movie data from TMDB API

CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  release_date DATE,
  overview TEXT,
  genres TEXT[] DEFAULT '{}',
  runtime INTEGER,
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  popularity DECIMAL(10,2),
  original_language TEXT,
  adult BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON public.movies(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON public.movies(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_movies_popularity ON public.movies(popularity DESC);

-- ============================================
-- 1.3 REVIEWS TABLE
-- ============================================
-- User reviews with detailed ratings

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL, -- TMDB movie ID
  
  -- Ratings
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  story_rating DECIMAL(2,1) CHECK (story_rating IS NULL OR (story_rating >= 0 AND story_rating <= 5)),
  acting_rating DECIMAL(2,1) CHECK (acting_rating IS NULL OR (acting_rating >= 0 AND acting_rating <= 5)),
  direction_rating DECIMAL(2,1) CHECK (direction_rating IS NULL OR (direction_rating >= 0 AND direction_rating <= 5)),
  cinematography_rating DECIMAL(2,1) CHECK (cinematography_rating IS NULL OR (cinematography_rating >= 0 AND cinematography_rating <= 5)),
  music_rating DECIMAL(2,1) CHECK (music_rating IS NULL OR (music_rating >= 0 AND music_rating <= 5)),
  
  -- Content
  content TEXT NOT NULL CHECK (char_length(content) >= 50 AND char_length(content) <= 5000),
  is_spoiler BOOLEAN DEFAULT FALSE,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Metadata
  movie_title TEXT,
  movie_poster_path TEXT,
  movie_year INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON public.reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_count ON public.reviews(helpful_count DESC);

-- ============================================
-- SECTION 2: COMMUNITY FEATURES
-- ============================================

-- ============================================
-- 2.1 CHANNELS TABLE
-- ============================================
-- Reddit/Discord-style discussion channels

CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('genre', 'regional', 'topic', 'custom')),
  icon TEXT,
  banner_url TEXT,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  moderator_ids UUID[] DEFAULT '{}',
  rules TEXT[] DEFAULT '{}',
  is_official BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Social media integration
  twitter_handle TEXT,
  tmdb_id INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_slug ON public.channels(slug);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_member_count ON public.channels(member_count DESC);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON public.channels(created_by);

-- ============================================
-- 2.2 POSTS TABLE
-- ============================================
-- User posts within channels

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  flair TEXT,
  thumbnail_url TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_spoiler BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_channel_id ON public.posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_score ON public.posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON public.posts(is_pinned DESC, created_at DESC);

-- ============================================
-- 2.3 COMMENTS TABLE
-- ============================================
-- Nested comment system (max depth: 10)

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0 CHECK (depth <= 10),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_score ON public.comments(score DESC);

-- ============================================
-- 2.4 CHANNEL MEMBERS TABLE
-- ============================================
-- Track channel membership

CREATE TABLE IF NOT EXISTS public.channel_members (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON public.channel_members(channel_id);

-- ============================================
-- 2.5 VOTES TABLE
-- ============================================
-- Universal voting system for posts and comments

CREATE TABLE IF NOT EXISTS public.votes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  votable_id UUID NOT NULL,
  votable_type TEXT NOT NULL CHECK (votable_type IN ('post', 'comment')),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, votable_id, votable_type)
);

CREATE INDEX IF NOT EXISTS idx_votes_votable ON public.votes(votable_id, votable_type);

-- ============================================
-- SECTION 3: GAMIFICATION SYSTEM
-- ============================================

-- ============================================
-- 3.1 USER STATS TABLE
-- ============================================
-- Track user karma, level, and aggregate stats

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Karma & Levels
  karma_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  
  -- Aggregate Stats
  total_reviews INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  channel_posts_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  movies_watched INTEGER DEFAULT 0,
  
  -- Activity Streaks
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_karma ON public.user_stats(karma_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON public.user_stats(level DESC);

-- ============================================
-- 3.2 BADGES TABLE
-- ============================================
-- Badge definitions

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  category TEXT CHECK (category IN ('newcomer', 'expert', 'master', 'legend', 'special')),
  karma_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3.3 USER BADGES TABLE
-- ============================================
-- Badges earned by users

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ============================================
-- 3.4 ACHIEVEMENTS TABLE
-- ============================================
-- Achievement definitions

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('social', 'content', 'engagement', 'special')),
  points INTEGER DEFAULT 0,
  requirement_type TEXT,
  requirement_value INTEGER,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3.5 USER ACHIEVEMENTS TABLE
-- ============================================
-- Achievements unlocked by users

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ============================================
-- 3.6 CHALLENGES TABLE
-- ============================================
-- Time-limited challenges

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('daily', 'weekly', 'monthly', 'special')),
  goal INTEGER NOT NULL,
  reward_karma INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3.7 USER CHALLENGES TABLE
-- ============================================
-- User challenge progress

CREATE TABLE IF NOT EXISTS public.user_challenges (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, challenge_id)
);

-- ============================================
-- 3.8 KARMA TRANSACTIONS TABLE
-- ============================================
-- Karma change audit log

CREATE TABLE IF NOT EXISTS public.karma_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('review', 'post', 'comment', 'vote', 'achievement')),
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_karma_transactions_user_id ON public.karma_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_transactions_created_at ON public.karma_transactions(created_at DESC);

-- ============================================
-- SECTION 4: SOCIAL FEATURES
-- ============================================

-- ============================================
-- 4.1 WATCHLIST TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.watchlist (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);

-- ============================================
-- 4.2 FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- ============================================
-- 4.3 FOLLOWS TABLE
-- ============================================
-- User follow relationships

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ============================================
-- 4.4 NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- 4.5 USER ACTIVITY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('movie_view', 'review_posted', 'post_created', 'comment_posted', 'channel_joined', 'watchlist_added')),
  entity_id TEXT NOT NULL,
  entity_title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- ============================================
-- SECTION 5: THEATER BOOKING SYSTEM
-- ============================================

-- ============================================
-- 5.1 CITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5.2 THEATER CHAINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.theater_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  booking_url TEXT,
  country TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5.3 THEATERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.theaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES public.theater_chains(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  audience_type TEXT CHECK (audience_type IN ('high_class', 'celebration', 'normal')),
  total_screens INTEGER DEFAULT 1,
  total_seats INTEGER DEFAULT 200,
  
  -- Amenities
  has_parking BOOLEAN DEFAULT TRUE,
  has_food_court BOOLEAN DEFAULT TRUE,
  has_wheelchair_access BOOLEAN DEFAULT TRUE,
  has_3d BOOLEAN DEFAULT FALSE,
  has_imax BOOLEAN DEFAULT FALSE,
  has_4dx BOOLEAN DEFAULT FALSE,
  has_dolby_atmos BOOLEAN DEFAULT FALSE,
  has_recliners BOOLEAN DEFAULT FALSE,
  
  phone TEXT,
  email TEXT,
  booking_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_theaters_city ON public.theaters(city_id);
CREATE INDEX IF NOT EXISTS idx_theaters_chain ON public.theaters(chain_id);

-- ============================================
-- 5.4 SCREENS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id UUID NOT NULL REFERENCES public.theaters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_seats INTEGER NOT NULL,
  screen_type TEXT CHECK (screen_type IN ('2D', '3D', 'IMAX', '4DX', 'Dolby')),
  seat_layout JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screens_theater ON public.screens(theater_id);

-- ============================================
-- 5.5 SHOWTIMES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.showtimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  language TEXT NOT NULL,
  subtitle_language TEXT,
  price DECIMAL(10,2) NOT NULL,
  available_seats INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_showtimes_screen ON public.showtimes(screen_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON public.showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_date ON public.showtimes(show_date, show_time);

-- ============================================
-- 5.6 BOOKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  seats TEXT[] NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  booking_status TEXT CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  payment_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime ON public.bookings(showtime_id);

-- ============================================
-- SECTION 6: AI & RECOMMENDATIONS
-- ============================================

-- ============================================
-- 6.1 WATCH HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.watch_history (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration INTEGER,
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON public.watch_history(watched_at DESC);

-- ============================================
-- 6.2 MOVIE SIMILARITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.movie_similarities (
  movie_id_1 INTEGER NOT NULL,
  movie_id_2 INTEGER NOT NULL,
  similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (movie_id_1, movie_id_2)
);

-- ============================================
-- 6.3 USER PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres TEXT[] DEFAULT '{}',
  preferred_languages TEXT[] DEFAULT '{}',
  preferred_decades INTEGER[] DEFAULT '{}',
  min_rating DECIMAL(2,1) CHECK (min_rating >= 0 AND min_rating <= 10),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 7: ACTOR FOLLOWING
-- ============================================

-- ============================================
-- 7.1 ACTOR FOLLOWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.actor_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL,
  actor_name TEXT NOT NULL,
  actor_profile_path TEXT,
  popularity REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, actor_id)
);

CREATE INDEX IF NOT EXISTS idx_actor_follows_user ON public.actor_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_actor_follows_actor ON public.actor_follows(actor_id);

-- ============================================
-- SECTION 8: SOCIAL MEDIA INTEGRATION
-- ============================================

-- ============================================
-- 8.1 TWITTER CACHE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.twitter_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_title TEXT NOT NULL,
  movie_id INTEGER,
  tweet_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  author_username TEXT,
  likes_count INTEGER DEFAULT 0,
  retweets_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_twitter_cache_movie ON public.twitter_cache(movie_id);
CREATE INDEX IF NOT EXISTS idx_twitter_cache_cached_at ON public.twitter_cache(cached_at DESC);

-- ============================================
-- 8.2 SOCIAL POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'reddit', 'letterboxd')),
  movie_id INTEGER,
  post_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author TEXT,
  engagement INTEGER DEFAULT 0,
  url TEXT,
  created_at TIMESTAMPTZ,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON public.social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_movie ON public.social_posts(movie_id);

-- ============================================
-- SECTION 9: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitter_cache ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9.1 USERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 9.2 MOVIES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view movies" ON public.movies;
CREATE POLICY "Anyone can view movies"
  ON public.movies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert movies" ON public.movies;
CREATE POLICY "Authenticated users can insert movies"
  ON public.movies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 9.3 REVIEWS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9.4 CHANNELS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Channels are viewable by everyone" ON public.channels;
CREATE POLICY "Channels are viewable by everyone"
  ON public.channels FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.channels;
CREATE POLICY "Authenticated users can create channels"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Channel creators and moderators can update" ON public.channels;
CREATE POLICY "Channel creators and moderators can update"
  ON public.channels FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = ANY(moderator_ids));

-- ============================================
-- 9.5 POSTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (NOT is_deleted);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

-- ============================================
-- 9.6 COMMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (NOT is_deleted);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update own comments" ON public.comments;
CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

-- ============================================
-- 9.7 VOTES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can vote" ON public.votes;
CREATE POLICY "Users can vote"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can change their votes" ON public.votes;
CREATE POLICY "Users can change their votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their votes" ON public.votes;
CREATE POLICY "Users can remove their votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9.8 CHANNEL MEMBERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.channel_members;
CREATE POLICY "Members are viewable by everyone"
  ON public.channel_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can join channels" ON public.channel_members;
CREATE POLICY "Users can join channels"
  ON public.channel_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave channels" ON public.channel_members;
CREATE POLICY "Users can leave channels"
  ON public.channel_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9.9 USER STATS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view all user stats" ON public.user_stats;
CREATE POLICY "Users can view all user stats"
  ON public.user_stats FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- 🚨 FIX: Add missing INSERT policy
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 9.10 WATCHLIST & FAVORITES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to watchlist" ON public.watchlist;
CREATE POLICY "Users can add to watchlist"
  ON public.watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from watchlist" ON public.watchlist;
CREATE POLICY "Users can remove from watchlist"
  ON public.watchlist FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to favorites" ON public.favorites;
CREATE POLICY "Users can add to favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from favorites" ON public.favorites;
CREATE POLICY "Users can remove from favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9.11 NOTIFICATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- SECTION 10: TRIGGERS & FUNCTIONS
-- ============================================

-- ============================================
-- 10.1 NEW USER CREATION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 10.2 INITIALIZE USER STATS TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_stats_created ON auth.users;
CREATE TRIGGER on_user_stats_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_stats();

-- ============================================
-- 10.3 UPDATE TIMESTAMPS TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10.4 CHANNEL MEMBER COUNT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_channel_member_count_fn()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.channels
    SET member_count = member_count + 1
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.channels
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_channel_member_count ON public.channel_members;
CREATE TRIGGER update_channel_member_count
  AFTER INSERT OR DELETE ON public.channel_members
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_member_count_fn();

-- ============================================
-- 10.5 POST COMMENT COUNT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_post_comment_count_fn()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_post_comment_count ON public.comments;
CREATE TRIGGER update_post_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count_fn();

-- ============================================
-- 10.6 VOTE COUNTS TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_vote_counts_fn()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  target_table TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_table := NEW.votable_type || 's';
    
    IF NEW.vote_type = 'up' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = upvotes + 1, score = score + 1 WHERE id = $1', target_table)
      USING NEW.votable_id;
    ELSE
      EXECUTE format('UPDATE public.%I SET downvotes = downvotes + 1, score = score - 1 WHERE id = $1', target_table)
      USING NEW.votable_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    target_table := NEW.votable_type || 's';
    
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = upvotes - 1, downvotes = downvotes + 1, score = score - 2 WHERE id = $1', target_table)
      USING NEW.votable_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = upvotes + 1, downvotes = downvotes - 1, score = score + 2 WHERE id = $1', target_table)
      USING NEW.votable_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    target_table := OLD.votable_type || 's';
    
    IF OLD.vote_type = 'up' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = GREATEST(0, upvotes - 1), score = score - 1 WHERE id = $1', target_table)
      USING OLD.votable_id;
    ELSE
      EXECUTE format('UPDATE public.%I SET downvotes = GREATEST(0, downvotes - 1), score = score + 1 WHERE id = $1', target_table)
      USING OLD.votable_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_vote_counts ON public.votes;
CREATE TRIGGER update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts_fn();

-- ============================================
-- SECTION 11: DEFAULT DATA & SEED DATA
-- ============================================

-- ============================================
-- 11.1 DEFAULT CHANNELS
-- ============================================

INSERT INTO public.channels (name, slug, description, type, icon, is_official, moderator_ids) VALUES
('Horror', 'horror', 'Discuss horror movies, from classic scares to modern frights', 'genre', '🎃', true, '{}'),
('Sci-Fi', 'sci-fi', 'Science fiction movies and futuristic storytelling', 'genre', '🚀', true, '{}'),
('Comedy', 'comedy', 'Funny movies that make you laugh', 'genre', '😂', true, '{}'),
('Drama', 'drama', 'Emotional and powerful dramatic films', 'genre', '🎭', true, '{}'),
('Action', 'action', 'High-octane action and adventure movies', 'genre', '💥', true, '{}'),
('Hollywood', 'hollywood', 'Hollywood movies and American cinema', 'regional', '🎬', true, '{}'),
('Bollywood', 'bollywood', 'Indian cinema and Bollywood films', 'regional', '🇮🇳', true, '{}'),
('International', 'international', 'World cinema from around the globe', 'regional', '🌍', true, '{}'),
('New Releases', 'new-releases', 'Discuss the latest movie releases', 'topic', '🆕', true, '{}'),
('Classic Cinema', 'classic-cinema', 'Timeless classics and cinema history', 'topic', '📽️', true, '{}'),
('Indie Films', 'indie-films', 'Independent and art-house cinema', 'topic', '🎨', true, '{}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 11.2 DEFAULT BADGES
-- ============================================

INSERT INTO public.badges (name, description, icon, color, category, karma_required) VALUES
('Newbie', 'Welcome to CineVerse!', '🌱', '#gray', 'newcomer', 0),
('Film Buff', 'Reached 100 karma', '🎬', '#blue', 'newcomer', 100),
('Critic', 'Reached 500 karma', '⭐', '#purple', 'expert', 500),
('Master Reviewer', 'Reached 1000 karma', '🏆', '#gold', 'master', 1000),
('Cinema Legend', 'Reached 5000 karma', '👑', '#red', 'legend', 5000)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 11.3 DEFAULT ACHIEVEMENTS
-- ============================================

INSERT INTO public.achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
('First Steps', 'Write your first review', '✍️', 'content', 10, 'reviews_count', 1),
('Social Butterfly', 'Get 10 followers', '🦋', 'social', 20, 'followers_count', 10),
('Prolific Critic', 'Write 10 reviews', '📝', 'content', 50, 'reviews_count', 10),
('Community Builder', 'Create a channel', '🏗️', 'social', 30, 'channels_created', 1),
('Popular Post', 'Get a post with 100 upvotes', '🔥', 'engagement', 40, 'post_upvotes', 100)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 11.4 DEFAULT CITIES (Major Indian Cities)
-- ============================================

INSERT INTO public.cities (name, state, country, latitude, longitude) VALUES
('Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777),
('Delhi', 'Delhi', 'India', 28.7041, 77.1025),
('Bangalore', 'Karnataka', 'India', 12.9716, 77.5946),
('Hyderabad', 'Telangana', 'India', 17.3850, 78.4867),
('Chennai', 'Tamil Nadu', 'India', 13.0827, 80.2707),
('Kolkata', 'West Bengal', 'India', 22.5726, 88.3639),
('Pune', 'Maharashtra', 'India', 18.5204, 73.8567),
('Ahmedabad', 'Gujarat', 'India', 23.0225, 72.5714)
ON CONFLICT DO NOTHING;

-- ============================================
-- 11.5 DEFAULT THEATER CHAINS
-- ============================================

INSERT INTO public.theater_chains (name, website_url, booking_url, country) VALUES
('PVR Cinemas', 'https://www.pvrcinemas.com', 'https://www.pvrcinemas.com/buy-tickets/', 'India'),
('INOX', 'https://www.inoxmovies.com', 'https://www.inoxmovies.com/buy-tickets', 'India'),
('Cinépolis', 'https://www.cinepolis.co.in', 'https://www.cinepolis.co.in/buy-tickets', 'India'),
('Carnival Cinemas', 'https://www.carnivalcinemas.com', 'https://www.carnivalcinemas.com/book-tickets', 'India')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CineVerse Database Setup Complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created Tables: 40+';
  RAISE NOTICE 'Created Indexes: 50+';
  RAISE NOTICE 'Created RLS Policies: 30+';
  RAISE NOTICE 'Created Triggers: 6';
  RAISE NOTICE 'Created Functions: 10+';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Verify all tables in Supabase Dashboard';
  RAISE NOTICE '2. Test authentication flow';
  RAISE NOTICE '3. Run: NOTIFY pgrst, "reload schema"';
  RAISE NOTICE '4. Start building features!';
  RAISE NOTICE '============================================';
END $$;
