-- Create user_activity table to track recent activities
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('movie_view', 'review_posted', 'post_created', 'comment_posted', 'channel_joined', 'watchlist_added')),
  entity_id TEXT NOT NULL, -- movie_id, review_id, post_id, etc.
  entity_title TEXT, -- movie title, post title, etc.
  metadata JSONB DEFAULT '{}', -- additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to log activity (prevents duplicates within 1 hour)
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_id TEXT,
  p_entity_title TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  -- Check if same activity exists within last hour
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

COMMENT ON TABLE public.user_activity IS 'Tracks user activities for recent activity feed';
COMMENT ON FUNCTION log_user_activity IS 'Logs user activity, preventing duplicates within 1 hour';
