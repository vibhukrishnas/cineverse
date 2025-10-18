-- ============================================
-- Audience Classification System
-- ============================================
-- This schema enables classification of movies/events by audience type
-- Categories: High Class, Celebration, Normal

-- ============================================
-- 1. Audience Types Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.audience_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  price_multiplier DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default audience types
INSERT INTO public.audience_types (name, display_name, description, icon, color, price_multiplier)
VALUES 
  ('high_class', 'High Class', 'Premium theater experience with luxury seating, gourmet food, and exclusive amenities', '👑', '#FFD700', 2.50),
  ('celebration', 'Celebration', 'Special occasions like birthdays, anniversaries, group events with party atmosphere', '🎉', '#FF6B9D', 1.75),
  ('normal', 'Normal', 'Standard theater experience for regular movie-going', '🎬', '#4A90E2', 1.00)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. Movie Audience Classifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.movie_audience_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER NOT NULL,
  audience_type_id UUID NOT NULL REFERENCES public.audience_types(id) ON DELETE CASCADE,
  score DECIMAL(3,2) DEFAULT 0.50, -- How well does this movie fit this audience type (0-1)
  reasoning TEXT, -- Why this classification was applied
  auto_classified BOOLEAN DEFAULT TRUE, -- Was this auto-classified or manually set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tmdb_id, audience_type_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_movie_audience_tmdb ON public.movie_audience_classifications(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movie_audience_type ON public.movie_audience_classifications(audience_type_id);
CREATE INDEX IF NOT EXISTS idx_movie_audience_score ON public.movie_audience_classifications(score DESC);

-- ============================================
-- 3. User Audience Preferences
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_audience_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audience_type_id UUID NOT NULL REFERENCES public.audience_types(id) ON DELETE CASCADE,
  preference_level INTEGER DEFAULT 5 CHECK (preference_level >= 1 AND preference_level <= 10), -- 1-10 scale
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, audience_type_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_audience_user ON public.user_audience_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audience_type ON public.user_audience_preferences(audience_type_id);

-- ============================================
-- 4. Audience Events/Screenings
-- ============================================
CREATE TABLE IF NOT EXISTS public.audience_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER NOT NULL,
  audience_type_id UUID NOT NULL REFERENCES public.audience_types(id) ON DELETE CASCADE,
  theater_name TEXT NOT NULL,
  theater_location TEXT,
  screening_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER DEFAULT 0,
  total_seats INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL, -- base_price * price_multiplier
  amenities TEXT[], -- Array of special amenities
  special_features TEXT[], -- e.g., ['Dolby Atmos', 'IMAX', 'Recliner Seats']
  food_options TEXT[], -- Available food/beverage options
  dress_code TEXT, -- For high class events
  min_group_size INTEGER DEFAULT 1, -- For celebration events
  booking_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audience_events_tmdb ON public.audience_events(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_audience_events_type ON public.audience_events(audience_type_id);
CREATE INDEX IF NOT EXISTS idx_audience_events_time ON public.audience_events(screening_time);
CREATE INDEX IF NOT EXISTS idx_audience_events_active ON public.audience_events(is_active);

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Audience Types (Public Read)
ALTER TABLE public.audience_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audience types are viewable by everyone"
  ON public.audience_types FOR SELECT
  USING (true);

-- Movie Audience Classifications (Public Read, Admin Write)
ALTER TABLE public.movie_audience_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movie classifications are viewable by everyone"
  ON public.movie_audience_classifications FOR SELECT
  USING (true);

-- User Audience Preferences (Users can manage their own)
ALTER TABLE public.user_audience_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_audience_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_audience_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_audience_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_audience_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Audience Events (Public Read)
ALTER TABLE public.audience_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audience events are viewable by everyone"
  ON public.audience_events FOR SELECT
  USING (is_active = true);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to get audience classification for a movie
CREATE OR REPLACE FUNCTION get_movie_audience_classifications(movie_tmdb_id INTEGER)
RETURNS TABLE (
  audience_type TEXT,
  display_name TEXT,
  score DECIMAL,
  reasoning TEXT,
  icon TEXT,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.name,
    at.display_name,
    mac.score,
    mac.reasoning,
    at.icon,
    at.color
  FROM public.movie_audience_classifications mac
  JOIN public.audience_types at ON mac.audience_type_id = at.id
  WHERE mac.tmdb_id = movie_tmdb_id
  ORDER BY mac.score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended movies by audience type
CREATE OR REPLACE FUNCTION get_recommended_movies_by_audience(
  audience_type_name TEXT,
  min_score DECIMAL DEFAULT 0.7,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  tmdb_id INTEGER,
  score DECIMAL,
  reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mac.tmdb_id,
    mac.score,
    mac.reasoning
  FROM public.movie_audience_classifications mac
  JOIN public.audience_types at ON mac.audience_type_id = at.id
  WHERE at.name = audience_type_name
    AND mac.score >= min_score
  ORDER BY mac.score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-classify a movie based on genre and rating
CREATE OR REPLACE FUNCTION auto_classify_movie(
  movie_tmdb_id INTEGER,
  genres TEXT[],
  vote_average DECIMAL,
  budget BIGINT DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  high_class_id UUID;
  celebration_id UUID;
  normal_id UUID;
  high_class_score DECIMAL := 0.3;
  celebration_score DECIMAL := 0.3;
  normal_score DECIMAL := 0.5;
BEGIN
  -- Get audience type IDs
  SELECT id INTO high_class_id FROM public.audience_types WHERE name = 'high_class';
  SELECT id INTO celebration_id FROM public.audience_types WHERE name = 'celebration';
  SELECT id INTO normal_id FROM public.audience_types WHERE name = 'normal';

  -- Calculate High Class Score
  -- High rating, high budget, specific genres
  IF vote_average >= 8.0 THEN high_class_score := high_class_score + 0.2; END IF;
  IF budget > 100000000 THEN high_class_score := high_class_score + 0.2; END IF;
  IF 'Drama' = ANY(genres) OR 'History' = ANY(genres) THEN high_class_score := high_class_score + 0.15; END IF;
  IF 'Thriller' = ANY(genres) OR 'Mystery' = ANY(genres) THEN high_class_score := high_class_score + 0.1; END IF;

  -- Calculate Celebration Score
  -- Family-friendly, adventure, comedy, animation
  IF 'Animation' = ANY(genres) THEN celebration_score := celebration_score + 0.25; END IF;
  IF 'Family' = ANY(genres) THEN celebration_score := celebration_score + 0.25; END IF;
  IF 'Comedy' = ANY(genres) THEN celebration_score := celebration_score + 0.15; END IF;
  IF 'Adventure' = ANY(genres) THEN celebration_score := celebration_score + 0.1; END IF;
  IF 'Fantasy' = ANY(genres) THEN celebration_score := celebration_score + 0.1; END IF;

  -- Normal is default, everyone can enjoy
  normal_score := 1.0 - (high_class_score + celebration_score) / 2;

  -- Insert classifications
  INSERT INTO public.movie_audience_classifications (tmdb_id, audience_type_id, score, reasoning, auto_classified)
  VALUES 
    (movie_tmdb_id, high_class_id, LEAST(high_class_score, 1.0), 'Auto-classified based on rating, budget, and genres', TRUE),
    (movie_tmdb_id, celebration_id, LEAST(celebration_score, 1.0), 'Auto-classified based on family-friendly content', TRUE),
    (movie_tmdb_id, normal_id, LEAST(normal_score, 1.0), 'Standard viewing experience', TRUE)
  ON CONFLICT (tmdb_id, audience_type_id) DO UPDATE
  SET 
    score = EXCLUDED.score,
    reasoning = EXCLUDED.reasoning,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Sample Data (for testing)
-- ============================================

-- Example: Classify some popular movies
-- Note: In production, you'd call auto_classify_movie from your app
-- when fetching movie details from TMDB

COMMENT ON TABLE public.audience_types IS 'Defines different audience classifications for movies/events';
COMMENT ON TABLE public.movie_audience_classifications IS 'Stores audience type classifications for each movie';
COMMENT ON TABLE public.user_audience_preferences IS 'Stores user preferences for different audience types';
COMMENT ON TABLE public.audience_events IS 'Special screenings/events targeted at specific audience types';
