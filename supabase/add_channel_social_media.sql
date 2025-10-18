-- Add social media fields to channels table
-- Run this in Supabase SQL Editor

-- First, check if channels table exists
DO $$ 
BEGIN
  -- Only add columns if channels table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channels') THEN
    
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
    
    RAISE NOTICE 'Social media columns added to channels table successfully';
  ELSE
    RAISE EXCEPTION 'Table public.channels does not exist. Please create channels table first by running channels_schema.sql';
  END IF;
END $$;

-- Create index for tmdb_id lookups (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'channels' AND indexname = 'idx_channels_tmdb_id') THEN
    CREATE INDEX idx_channels_tmdb_id ON public.channels(tmdb_id);
    RAISE NOTICE 'Index idx_channels_tmdb_id created successfully';
  ELSE
    RAISE NOTICE 'Index idx_channels_tmdb_id already exists';
  END IF;
END $$;

-- Add comments to columns
COMMENT ON COLUMN public.channels.twitter_handle IS 'Twitter/X handle without @ symbol';
COMMENT ON COLUMN public.channels.instagram_handle IS 'Instagram handle without @ symbol';
COMMENT ON COLUMN public.channels.facebook_handle IS 'Facebook page name or ID';
COMMENT ON COLUMN public.channels.tmdb_id IS 'TMDB movie/collection/person ID for fetching social media';
COMMENT ON COLUMN public.channels.imdb_id IS 'IMDb ID for additional metadata';

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Social media fields are now available on the channels table';
END $$;
