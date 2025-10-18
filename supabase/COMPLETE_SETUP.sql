-- ============================================
-- STEP-BY-STEP SUPABASE SETUP SCRIPT
-- Run each section in order in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Check what tables exist
-- ============================================
-- Run this first to see what's already in your database
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- STEP 2: Create channels table (if it doesn't exist)
-- ============================================
-- Only run this if channels table doesn't exist from Step 1

CREATE TABLE IF NOT EXISTS public.channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only create if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'channels' 
    AND policyname = 'Channels are viewable by everyone'
  ) THEN
    CREATE POLICY "Channels are viewable by everyone"
      ON public.channels FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'channels' 
    AND policyname = 'Authenticated users can create channels'
  ) THEN
    CREATE POLICY "Authenticated users can create channels"
      ON public.channels FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;

-- ============================================
-- STEP 3: Add social media fields
-- ============================================
-- This adds Twitter, Instagram, Facebook, TMDB ID fields

DO $$ 
BEGIN
  -- Add twitter_handle if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'channels' AND column_name = 'twitter_handle') THEN
    ALTER TABLE public.channels ADD COLUMN twitter_handle TEXT;
  END IF;
  
  -- Add instagram_handle if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'channels' AND column_name = 'instagram_handle') THEN
    ALTER TABLE public.channels ADD COLUMN instagram_handle TEXT;
  END IF;
  
  -- Add facebook_handle if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'channels' AND column_name = 'facebook_handle') THEN
    ALTER TABLE public.channels ADD COLUMN facebook_handle TEXT;
  END IF;
  
  -- Add tmdb_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'channels' AND column_name = 'tmdb_id') THEN
    ALTER TABLE public.channels ADD COLUMN tmdb_id INTEGER;
  END IF;
  
  -- Add imdb_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'channels' AND column_name = 'imdb_id') THEN
    ALTER TABLE public.channels ADD COLUMN imdb_id TEXT;
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_channels_tmdb_id ON public.channels(tmdb_id);

-- ============================================
-- STEP 4: Create user_activity table
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('movie_view', 'review_posted', 'post_created', 'comment_posted', 'channel_joined', 'watchlist_added')),
  entity_id TEXT NOT NULL,
  entity_title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only create if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_activity' 
    AND policyname = 'Users can view their own activity'
  ) THEN
    CREATE POLICY "Users can view their own activity"
      ON public.user_activity FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_activity' 
    AND policyname = 'Users can insert their own activity'
  ) THEN
    CREATE POLICY "Users can insert their own activity"
      ON public.user_activity FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- STEP 5: Create activity logging function
-- ============================================

CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_id TEXT,
  p_entity_title TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_activity
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND entity_id = p_entity_id
      AND created_at > NOW() - INTERVAL '1 hour'
  ) THEN
    INSERT INTO user_activity (user_id, activity_type, entity_id, entity_title, metadata)
    VALUES (p_user_id, p_activity_type, p_entity_id, p_entity_title, p_metadata);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Verify everything worked
-- ============================================

-- Check channels table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'channels'
ORDER BY ordinal_position;

-- Check user_activity table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_activity'
ORDER BY ordinal_position;

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - public.channels (with social media fields)';
  RAISE NOTICE '  - public.user_activity';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  - log_user_activity()';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '  - Create channels with Twitter/Instagram handles';
  RAISE NOTICE '  - Track user activities automatically';
  RAISE NOTICE '  - Display activity feeds on dashboard';
  RAISE NOTICE '============================================';
END $$;
