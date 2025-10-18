-- Add Twitter Sync fields to channels table

DO $$ 
BEGIN
  -- Add twitter_sync_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'twitter_sync_enabled'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN twitter_sync_enabled BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added twitter_sync_enabled column';
  ELSE
    RAISE NOTICE '⏭️  twitter_sync_enabled already exists';
  END IF;
  
  -- Add last_synced_tweet_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'last_synced_tweet_id'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN last_synced_tweet_id TEXT;
    RAISE NOTICE '✅ Added last_synced_tweet_id column';
  ELSE
    RAISE NOTICE '⏭️  last_synced_tweet_id already exists';
  END IF;
  
  -- Add last_sync_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'channels' 
    AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE public.channels ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Added last_sync_at column';
  ELSE
    RAISE NOTICE '⏭️  last_sync_at already exists';
  END IF;
END $$;

-- Add metadata column to posts if not exists (for storing tweet data)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_posts_metadata ON public.posts USING GIN (metadata);
    RAISE NOTICE '✅ Added metadata column to posts';
  ELSE
    RAISE NOTICE '⏭️  metadata column already exists';
  END IF;
END $$;

-- Create index for Twitter handle lookups
CREATE INDEX IF NOT EXISTS idx_channels_twitter_handle 
ON public.channels(twitter_handle) 
WHERE twitter_handle IS NOT NULL;

-- Verify columns were added
DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'channels'
    AND column_name IN ('twitter_sync_enabled', 'last_synced_tweet_id', 'last_sync_at');
    
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ TWITTER SYNC MIGRATION COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Columns added to channels table: %', col_count;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '  - Enable Twitter sync for channels';
  RAISE NOTICE '  - Auto-post tweets to channel discussions';
  RAISE NOTICE '  - Track last synced tweet to avoid duplicates';
  RAISE NOTICE '============================================';
END $$;
