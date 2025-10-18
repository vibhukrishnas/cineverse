# 🚀 Quick Start Guide - New Features

## Run These SQL Migrations First!

### Step 1: Add Social Media to Channels
Open Supabase SQL Editor and run:

```sql
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_handle TEXT,
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
ADD COLUMN IF NOT EXISTS imdb_id TEXT;

CREATE INDEX IF NOT EXISTS idx_channels_tmdb_id ON public.channels(tmdb_id);
```

### Step 2: Create Activity Tracking
Run this complete migration:

```sql
-- Create user_activity table
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

CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to log activity
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
```

---

## Test the Features!

### 1. Test Channel Twitter Feeds:
```
1. Go to http://localhost:3000/channels
2. Click any channel (or create one)
3. Scroll down to see the Twitter feed section
4. See live tweets related to the channel!
```

### 2. Test Activity Tracking:
```
1. Go to http://localhost:3000/dashboard
2. Visit any movie page
3. Return to dashboard
4. See "Viewed [Movie Name]" in Recent Activity!
```

### 3. Add Twitter to a Channel:
```sql
-- Update a channel with Twitter info
UPDATE channels
SET 
  twitter_handle = 'Marvel',
  tmdb_id = 299536
WHERE slug = 'marvel-cinematic-universe';
```

---

## Key Features Summary:

✅ **Channel Pages**: Full pages at `/channel/[slug]`
✅ **Twitter Feeds**: Live tweets on every channel
✅ **Activity Tracking**: Dashboard shows recent activities  
✅ **Dark Mode**: Toggle in navigation (already working)
✅ **Auto-Logging**: Movie views, reviews, posts tracked automatically

---

## Need Help?

Check the full documentation:
`documents/FEATURES_IMPLEMENTATION_COMPLETE.md`

**Everything is ready to go! Just run the migrations and test it out! 🎉**
