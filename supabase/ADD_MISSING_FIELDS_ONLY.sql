-- ============================================
-- SIMPLE FIX: Just Add Missing Fields
-- Since channels table already exists, we just need to add the new columns
-- ============================================

-- Add social media fields to existing channels table
DO $$ 
BEGIN
  -- Add twitter_handle if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'twitter_handle'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN twitter_handle TEXT;
    RAISE NOTICE '✅ Added twitter_handle column';
  ELSE
    RAISE NOTICE '⏭️  twitter_handle already exists';
  END IF;
  
  -- Add instagram_handle if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'instagram_handle'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN instagram_handle TEXT;
    RAISE NOTICE '✅ Added instagram_handle column';
  ELSE
    RAISE NOTICE '⏭️  instagram_handle already exists';
  END IF;
  
  -- Add facebook_handle if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'facebook_handle'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN facebook_handle TEXT;
    RAISE NOTICE '✅ Added facebook_handle column';
  ELSE
    RAISE NOTICE '⏭️  facebook_handle already exists';
  END IF;
  
  -- Add tmdb_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'tmdb_id'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN tmdb_id INTEGER;
    RAISE NOTICE '✅ Added tmdb_id column';
  ELSE
    RAISE NOTICE '⏭️  tmdb_id already exists';
  END IF;
  
  -- Add imdb_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'imdb_id'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN imdb_id TEXT;
    RAISE NOTICE '✅ Added imdb_id column';
  ELSE
    RAISE NOTICE '⏭️  imdb_id already exists';
  END IF;
END $$;

-- Create index for TMDB lookups
CREATE INDEX IF NOT EXISTS idx_channels_tmdb_id ON public.channels(tmdb_id);

-- ============================================
-- Create user_activity table and function
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);

-- Enable RLS
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
    RAISE NOTICE '✅ Created policy: Users can view their own activity';
  ELSE
    RAISE NOTICE '⏭️  Policy already exists: Users can view their own activity';
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
    RAISE NOTICE '✅ Created policy: Users can insert their own activity';
  ELSE
    RAISE NOTICE '⏭️  Policy already exists: Users can insert their own activity';
  END IF;
END $$;

-- Create activity logging function
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_id TEXT,
  p_entity_title TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  -- Only log if this exact activity hasn't been logged in the last hour
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
-- Verify everything worked
-- ============================================

DO $$
DECLARE
  channel_cols TEXT;
  activity_cols TEXT;
BEGIN
  -- Get channels columns
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO channel_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'channels'
    AND column_name IN ('twitter_handle', 'instagram_handle', 'facebook_handle', 'tmdb_id', 'imdb_id');
  
  -- Get user_activity columns
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO activity_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'user_activity';

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Channels table - New fields:';
  RAISE NOTICE '   %', COALESCE(channel_cols, 'ERROR: No social media columns found!');
  RAISE NOTICE '';
  RAISE NOTICE '📋 User Activity table:';
  RAISE NOTICE '   %', COALESCE(activity_cols, 'ERROR: Table not created!');
  RAISE NOTICE '';
  RAISE NOTICE '✨ You can now:';
  RAISE NOTICE '   - Add Twitter/Instagram handles to channels';
  RAISE NOTICE '   - Track user activities automatically';
  RAISE NOTICE '   - Display activity feeds on dashboard';
  RAISE NOTICE '   - Show Twitter feeds on channel pages';
  RAISE NOTICE '============================================';
END $$;
