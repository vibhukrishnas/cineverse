-- ============================================
-- CINEVERSE GAMIFICATION & AI DATABASE SCHEMA
-- ============================================
-- This migration adds gamification features including:
-- - User karma/points system
-- - Achievement badges
-- - User levels
-- - Leaderboards
-- - Weekly challenges
-- - AI recommendations tracking
-- - Review sentiment analysis

-- ============================================
-- USER STATS TABLE
-- ============================================
-- Tracks user karma, level, and aggregate stats

CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Karma & Levels
  karma_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Newbie',
  
  -- Aggregate Stats
  reviews_count INTEGER DEFAULT 0,
  helpful_votes_received INTEGER DEFAULT 0,
  review_likes_received INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  channel_posts_count INTEGER DEFAULT 0,
  post_upvotes_received INTEGER DEFAULT 0,
  movies_rated_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_stats_karma ON public.user_stats(karma_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON public.user_stats(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

-- ============================================
-- BADGES/ACHIEVEMENTS TABLE
-- ============================================
-- Defines all available achievement badges

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Badge Info
  badge_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  color TEXT DEFAULT '#gray',
  
  -- Unlock Requirements
  requirement_type TEXT NOT NULL, -- 'reviews_count', 'genre_reviews', 'followers', etc.
  requirement_value INTEGER NOT NULL,
  requirement_meta JSONB, -- additional requirements (e.g., genre name)
  
  -- Badge Tier
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  
  -- Rewards
  karma_reward INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
-- Tracks which badges users have earned and progress

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  
  -- Progress
  progress INTEGER DEFAULT 0,
  required INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  earned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements(completed, earned_at DESC);

-- ============================================
-- CHALLENGES TABLE
-- ============================================
-- Weekly/monthly challenges for users

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Challenge Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'weekly', 'monthly', 'special'
  icon TEXT,
  
  -- Requirements
  requirement_type TEXT NOT NULL, -- 'reviews', 'genres_explored', 'helpful_votes_given'
  requirement_value INTEGER NOT NULL,
  requirement_meta JSONB,
  
  -- Rewards
  karma_reward INTEGER DEFAULT 0,
  badge_reward UUID REFERENCES public.badges(id),
  
  -- Duration
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active challenges
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(active, start_date, end_date);

-- ============================================
-- USER CHALLENGES TABLE
-- ============================================
-- Tracks user progress on challenges

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  
  -- Progress
  progress INTEGER DEFAULT 0,
  required INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(user_id, challenge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_active ON public.user_challenges(completed, started_at DESC);

-- ============================================
-- AI RECOMMENDATIONS TABLE
-- ============================================
-- Tracks AI-generated recommendations and user feedback

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recommendation
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  reason TEXT, -- AI-generated explanation
  algorithm_type TEXT NOT NULL, -- 'collaborative', 'content_based', 'mood_based', 'gemini_ai'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Context
  context JSONB, -- mood, user history, etc.
  
  -- Feedback
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  feedback TEXT, -- 'liked', 'disliked', 'not_interested'
  feedback_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON public.ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_shown ON public.ai_recommendations(shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_feedback ON public.ai_recommendations(feedback);

-- ============================================
-- REVIEW SENTIMENTS TABLE
-- ============================================
-- AI-analyzed sentiment for reviews

CREATE TABLE IF NOT EXISTS public.review_sentiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  
  -- Sentiment Analysis
  sentiment TEXT NOT NULL, -- 'positive', 'neutral', 'negative'
  sentiment_score DECIMAL(4,3), -- -1.000 to 1.000
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Key Insights
  summary TEXT, -- AI-generated summary
  key_points JSONB, -- array of extracted key points
  detected_spoilers BOOLEAN DEFAULT FALSE,
  
  -- Toxicity Detection
  toxicity_score DECIMAL(3,2), -- 0.00 to 1.00
  is_toxic BOOLEAN DEFAULT FALSE,
  
  -- Processing Info
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  model_version TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_review_sentiments_review ON public.review_sentiments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_sentiments_sentiment ON public.review_sentiments(sentiment);

-- ============================================
-- KARMA TRANSACTIONS TABLE
-- ============================================
-- Audit trail for all karma point changes

CREATE TABLE IF NOT EXISTS public.karma_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction
  points INTEGER NOT NULL, -- can be negative
  reason TEXT NOT NULL, -- 'review_created', 'review_liked', 'helpful_vote', etc.
  reference_id UUID, -- ID of related review, post, etc.
  reference_type TEXT, -- 'review', 'post', 'comment'
  
  -- Balance
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_karma_transactions_user ON public.karma_transactions(user_id, created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate user level based on karma
CREATE OR REPLACE FUNCTION calculate_user_level(karma INTEGER)
RETURNS TABLE(level INTEGER, level_name TEXT, level_color TEXT) AS $$
BEGIN
  IF karma >= 5000 THEN
    RETURN QUERY SELECT 5, 'Icon'::TEXT, 'platinum'::TEXT;
  ELSIF karma >= 1501 THEN
    RETURN QUERY SELECT 4, 'Legend'::TEXT, 'gold'::TEXT;
  ELSIF karma >= 501 THEN
    RETURN QUERY SELECT 3, 'Expert'::TEXT, 'purple'::TEXT;
  ELSIF karma >= 101 THEN
    RETURN QUERY SELECT 2, 'Critic'::TEXT, 'blue'::TEXT;
  ELSE
    RETURN QUERY SELECT 1, 'Newbie'::TEXT, 'gray'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to award karma points
CREATE OR REPLACE FUNCTION award_karma(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_current_karma INTEGER;
  v_new_karma INTEGER;
  v_new_level RECORD;
BEGIN
  -- Get current karma
  SELECT karma_points INTO v_current_karma
  FROM user_stats
  WHERE user_id = p_user_id;
  
  -- If user stats don't exist, create them
  IF v_current_karma IS NULL THEN
    INSERT INTO user_stats (user_id, karma_points)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_current_karma := 0;
  END IF;
  
  -- Calculate new karma
  v_new_karma := GREATEST(0, v_current_karma + p_points);
  
  -- Get new level
  SELECT * INTO v_new_level FROM calculate_user_level(v_new_karma);
  
  -- Update user stats
  UPDATE user_stats
  SET 
    karma_points = v_new_karma,
    level = v_new_level.level,
    level_name = v_new_level.level_name,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO karma_transactions (
    user_id, points, reason, reference_id, reference_type,
    balance_before, balance_after
  )
  VALUES (
    p_user_id, p_points, p_reason, p_reference_id, p_reference_type,
    v_current_karma, v_new_karma
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

-- User Stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all user stats" ON public.user_stats;
CREATE POLICY "Users can view all user stats"
  ON public.user_stats FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;
CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Badges (Public read-only)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

-- User Achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all achievements" ON public.user_achievements;
CREATE POLICY "Users can view all achievements"
  ON public.user_achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own achievements" ON public.user_achievements;
CREATE POLICY "Users can update own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- Challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.challenges;
CREATE POLICY "Anyone can view active challenges"
  ON public.challenges FOR SELECT
  USING (active = true);

-- User Challenges
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can view own challenge progress"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can insert own challenge progress"
  ON public.user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can update own challenge progress"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Recommendations
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can view own recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendation feedback" ON public.ai_recommendations;
CREATE POLICY "Users can update own recommendation feedback"
  ON public.ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- Review Sentiments
ALTER TABLE public.review_sentiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view review sentiments" ON public.review_sentiments;
CREATE POLICY "Anyone can view review sentiments"
  ON public.review_sentiments FOR SELECT
  USING (true);

-- Karma Transactions
ALTER TABLE public.karma_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own karma transactions" ON public.karma_transactions;
CREATE POLICY "Users can view own karma transactions"
  ON public.karma_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - DEFAULT BADGES
-- ============================================

INSERT INTO public.badges (badge_type, name, description, icon, color, requirement_type, requirement_value, tier, rarity, karma_reward)
VALUES
  -- Review Badges
  ('first_review', 'First Review', 'Write your first movie review', '✍️', '#4299e1', 'reviews_count', 1, 'bronze', 'common', 10),
  ('prolific_critic', 'Prolific Critic', 'Write 50 movie reviews', '📝', '#805ad5', 'reviews_count', 50, 'silver', 'rare', 100),
  ('master_reviewer', 'Master Reviewer', 'Write 200 movie reviews', '👑', '#d69e2e', 'reviews_count', 200, 'gold', 'epic', 500),
  ('legendary_critic', 'Legendary Critic', 'Write 500 movie reviews', '🏆', '#e53e3e', 'reviews_count', 500, 'platinum', 'legendary', 1000),
  
  -- Genre Expert Badges
  ('action_expert', 'Action Expert', 'Review 30 action movies', '💥', '#e53e3e', 'genre_reviews', 30, 'gold', 'rare', 150),
  ('comedy_expert', 'Comedy Expert', 'Review 30 comedy movies', '😂', '#f6ad55', 'genre_reviews', 30, 'gold', 'rare', 150),
  ('drama_expert', 'Drama Expert', 'Review 30 drama movies', '🎭', '#805ad5', 'genre_reviews', 30, 'gold', 'rare', 150),
  ('scifi_expert', 'Sci-Fi Expert', 'Review 30 sci-fi movies', '🚀', '#4299e1', 'genre_reviews', 30, 'gold', 'rare', 150),
  ('horror_expert', 'Horror Expert', 'Review 30 horror movies', '👻', '#38a169', 'genre_reviews', 30, 'gold', 'rare', 150),
  
  -- Social Badges
  ('social_butterfly', 'Social Butterfly', 'Gain 100 followers', '🦋', '#d53f8c', 'followers', 100, 'gold', 'rare', 200),
  ('influencer', 'Influencer', 'Gain 500 followers', '⭐', '#d69e2e', 'followers', 500, 'platinum', 'epic', 1000),
  
  -- Helpful Badges
  ('helpful_helper', 'Helpful Helper', 'Receive 100 helpful votes', '👍', '#38a169', 'helpful_votes', 100, 'silver', 'rare', 150),
  ('community_hero', 'Community Hero', 'Receive 500 helpful votes', '🦸', '#805ad5', 'helpful_votes', 500, 'gold', 'epic', 500),
  
  -- Activity Badges
  ('early_bird', 'Early Bird', 'Review a movie on its release day', '🐦', '#f6ad55', 'early_review', 1, 'gold', 'rare', 100),
  ('binge_watcher', 'Binge Watcher', 'Rate 50 movies in one month', '📺', '#4299e1', 'monthly_ratings', 50, 'silver', 'rare', 150),
  ('marathon_runner', 'Marathon Runner', 'Rate 100 movies in one month', '🏃', '#e53e3e', 'monthly_ratings', 100, 'platinum', 'legendary', 500)
ON CONFLICT (badge_type) DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to initialize user stats on signup
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_stats();

-- Trigger to update user stats timestamp
CREATE OR REPLACE FUNCTION update_user_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_stats_timestamp_trigger ON public.user_stats;

CREATE TRIGGER update_user_stats_timestamp_trigger
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_timestamp();

COMMENT ON TABLE public.user_stats IS 'Stores user gamification statistics including karma, level, and aggregate counts';
COMMENT ON TABLE public.badges IS 'Defines all available achievement badges in the system';
COMMENT ON TABLE public.user_achievements IS 'Tracks user progress and completion of achievement badges';
COMMENT ON TABLE public.challenges IS 'Weekly and monthly challenges for users to complete';
COMMENT ON TABLE public.user_challenges IS 'Tracks user progress on active challenges';
COMMENT ON TABLE public.ai_recommendations IS 'Stores AI-generated movie recommendations with user feedback';
COMMENT ON TABLE public.review_sentiments IS 'AI-analyzed sentiment and insights for movie reviews';
COMMENT ON TABLE public.karma_transactions IS 'Audit trail of all karma point transactions';
