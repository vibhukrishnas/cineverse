-- ============================================
-- CineVerse Complete Social Features Migration
-- Run this SINGLE file in Supabase SQL Editor
-- ============================================

-- PART 1: Users Table Schema
-- This must run first as it's required by social features

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add full_name column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- RLS Policies for users table

-- Allow anyone to read user profiles
CREATE POLICY "User profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If insert fails, still return NEW to allow auth to continue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing auth users to have profiles
INSERT INTO public.users (id, email, username, full_name)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
  raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 2: Social Features Schema
-- Requires users table to exist
-- ============================================

-- Drop existing objects if they exist (for clean reinstall)
DROP TRIGGER IF EXISTS on_review_like_notification ON public.review_likes;
DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
DROP FUNCTION IF EXISTS notify_on_review_like() CASCADE;
DROP FUNCTION IF EXISTS notify_on_follow() CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR, TEXT, TEXT, TEXT, UUID, UUID) CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.social_posts CASCADE;
DROP TABLE IF EXISTS public.user_online_status CASCADE;

-- Create follows table
CREATE TABLE public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent self-follow and duplicate follows
  CHECK (follower_id != following_id),
  UNIQUE(follower_id, following_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_posts table
CREATE TABLE public.social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(20) NOT NULL,
  post_id TEXT NOT NULL,
  movie_id INTEGER,
  content TEXT,
  media_url TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_avatar TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  external_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(platform, post_id)
);

-- Create user_online_status table
CREATE TABLE public.user_online_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_follows_composite ON public.follows(follower_id, following_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_social_posts_platform ON public.social_posts(platform);
CREATE INDEX idx_social_posts_movie_id ON public.social_posts(movie_id);
CREATE INDEX idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX idx_user_online_status_is_online ON public.user_online_status(is_online);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_online_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table

CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can follow"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for notifications table

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for social_posts table

CREATE POLICY "Social posts are viewable by everyone"
  ON public.social_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage social posts"
  ON public.social_posts FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for user_online_status table

CREATE POLICY "Online status is viewable by everyone"
  ON public.user_online_status FOR SELECT
  USING (true);

CREATE POLICY "Users can update own online status"
  ON public.user_online_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own online status"
  ON public.user_online_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create notification function
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title TEXT,
  p_content TEXT,
  p_link TEXT,
  p_actor_id UUID,
  p_reference_id UUID
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't notify users of their own actions
  IF p_user_id = p_actor_id THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    link,
    actor_id,
    reference_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_content,
    p_link,
    p_actor_id,
    p_reference_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to create notification: %', SQLERRM;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create follow notification function
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
BEGIN
  -- Get follower username
  SELECT username INTO follower_username
  FROM public.users
  WHERE id = NEW.follower_id;
  
  -- Use a default if username not found
  IF follower_username IS NULL THEN
    follower_username := 'Someone';
  END IF;
  
  -- Create notification
  PERFORM create_notification(
    NEW.following_id,
    'follow',
    'New Follower',
    follower_username || ' started following you',
    '/profile/' || NEW.follower_id,
    NEW.follower_id,
    NEW.id
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the follow if notification fails
  RAISE WARNING 'Failed to create follow notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new follow notifications
CREATE TRIGGER on_new_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

-- Create review like notification function
CREATE OR REPLACE FUNCTION notify_on_review_like()
RETURNS TRIGGER AS $$
DECLARE
  review_author_id UUID;
  liker_username TEXT;
  movie_id INTEGER;
BEGIN
  -- Get review author and movie
  SELECT user_id, movie_id INTO review_author_id, movie_id
  FROM public.reviews
  WHERE id = NEW.review_id;
  
  -- Get liker username
  SELECT username INTO liker_username
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- Use defaults if not found
  IF liker_username IS NULL THEN
    liker_username := 'Someone';
  END IF;
  
  -- Create notification
  PERFORM create_notification(
    review_author_id,
    'review_like',
    'Review Liked',
    liker_username || ' liked your review',
    '/movie/' || movie_id,
    NEW.user_id,
    NEW.review_id
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the like if notification fails
  RAISE WARNING 'Failed to create review like notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for review like notifications
CREATE TRIGGER on_review_like_notification
  AFTER INSERT ON public.review_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_review_like();

-- Helper functions
CREATE OR REPLACE FUNCTION update_online_status(p_user_id UUID, p_is_online BOOLEAN)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_online_status (user_id, is_online, last_seen, updated_at)
  VALUES (p_user_id, p_is_online, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_online = p_is_online,
    last_seen = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_follower_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.follows WHERE following_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_following_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.follows WHERE follower_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_following(p_follower_id UUID, p_following_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration Complete!
-- ============================================
-- You should see "Success. No rows returned" if everything worked.
-- 
-- To verify, run:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('users', 'follows', 'notifications', 'social_posts', 'user_online_status');
