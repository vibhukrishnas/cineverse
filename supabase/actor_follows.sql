-- Actor Following System Database Schema
-- Allows users to follow their favorite actors and receive updates

-- Drop existing tables if recreating
DROP TABLE IF EXISTS actor_updates CASCADE;
DROP TABLE IF EXISTS actor_follows CASCADE;

-- Table to track user actor follows
CREATE TABLE actor_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL, -- TMDB person ID
  actor_name TEXT NOT NULL,
  actor_profile_path TEXT, -- TMDB profile image path
  actor_popularity REAL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure user can only follow actor once
  UNIQUE(user_id, actor_id)
);

-- Table to store actor updates/news (future enhancement)
CREATE TABLE actor_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id INTEGER NOT NULL, -- TMDB person ID
  update_type TEXT NOT NULL CHECK (update_type IN ('new_movie', 'birthday', 'news', 'award')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  movie_id INTEGER, -- TMDB movie ID if related to a movie
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for querying updates by actor
  INDEX idx_actor_updates_actor_id (actor_id),
  INDEX idx_actor_updates_published_at (published_at DESC)
);

-- Create indexes for better query performance
CREATE INDEX idx_actor_follows_user_id ON actor_follows(user_id);
CREATE INDEX idx_actor_follows_actor_id ON actor_follows(actor_id);
CREATE INDEX idx_actor_follows_created_at ON actor_follows(created_at DESC);

-- Enable Row Level Security
ALTER TABLE actor_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for actor_follows

-- Users can view their own follows
CREATE POLICY "Users can view own follows"
  ON actor_follows
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own follows
CREATE POLICY "Users can follow actors"
  ON actor_follows
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own follows (unfollow)
CREATE POLICY "Users can unfollow actors"
  ON actor_follows
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for actor_updates

-- Everyone can view actor updates
CREATE POLICY "Anyone can view actor updates"
  ON actor_updates
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete actor updates
-- (Updates will be populated via background job or admin interface)

-- Helper function to get follower count for an actor
CREATE OR REPLACE FUNCTION get_actor_follower_count(p_actor_id INTEGER)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM actor_follows
  WHERE actor_id = p_actor_id;
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user follows an actor
CREATE OR REPLACE FUNCTION is_user_following_actor(p_user_id UUID, p_actor_id INTEGER)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM actor_follows
    WHERE user_id = p_user_id AND actor_id = p_actor_id
  );
$$ LANGUAGE SQL STABLE;

-- Helper function to get actors followed by a user
CREATE OR REPLACE FUNCTION get_user_followed_actors(p_user_id UUID)
RETURNS TABLE(
  actor_id INTEGER,
  actor_name TEXT,
  actor_profile_path TEXT,
  actor_popularity REAL,
  followed_at TIMESTAMPTZ,
  follower_count INTEGER
) AS $$
  SELECT 
    af.actor_id,
    af.actor_name,
    af.actor_profile_path,
    af.actor_popularity,
    af.created_at,
    get_actor_follower_count(af.actor_id)
  FROM actor_follows af
  WHERE af.user_id = p_user_id
  ORDER BY af.created_at DESC;
$$ LANGUAGE SQL STABLE;

-- Helper function to get recent movies from followed actors
CREATE OR REPLACE FUNCTION get_followed_actors_recent_movies(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  actor_id INTEGER,
  actor_name TEXT,
  movie_count INTEGER
) AS $$
  -- This is a placeholder - actual movie data comes from TMDB API
  -- This function helps identify which actors to query for recent movies
  SELECT 
    af.actor_id,
    af.actor_name,
    0 as movie_count -- Populated by backend query to TMDB
  FROM actor_follows af
  WHERE af.user_id = p_user_id
  ORDER BY af.actor_popularity DESC
  LIMIT p_limit;
$$ LANGUAGE SQL STABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_actor_follows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_actor_follows_updated_at
  BEFORE UPDATE ON actor_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_actor_follows_updated_at();

-- Sample data (optional - for testing)
-- Uncomment to insert sample follows (requires real user IDs)

/*
-- Example: User follows Christopher Nolan (TMDB ID: 525)
INSERT INTO actor_follows (user_id, actor_id, actor_name, actor_profile_path, actor_popularity)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with real user UUID
  525,
  'Christopher Nolan',
  '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
  50.5
);

-- Example: Sample actor update
INSERT INTO actor_updates (actor_id, update_type, title, description, image_url, movie_id)
VALUES (
  525,
  'new_movie',
  'Oppenheimer - Now in Theaters',
  'Christopher Nolan''s epic biographical thriller is now playing in theaters worldwide.',
  '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  872585
);
*/

-- Grant permissions
GRANT SELECT ON actor_follows TO authenticated;
GRANT INSERT ON actor_follows TO authenticated;
GRANT DELETE ON actor_follows TO authenticated;
GRANT SELECT ON actor_updates TO authenticated, anon;

-- Comments for documentation
COMMENT ON TABLE actor_follows IS 'Tracks which actors/people users follow';
COMMENT ON TABLE actor_updates IS 'Stores news and updates about actors (future feature)';
COMMENT ON COLUMN actor_follows.actor_id IS 'TMDB person/actor ID';
COMMENT ON COLUMN actor_follows.actor_profile_path IS 'TMDB image path (prefix with https://image.tmdb.org/t/p/w500)';
COMMENT ON FUNCTION get_actor_follower_count IS 'Returns total number of users following an actor';
COMMENT ON FUNCTION is_user_following_actor IS 'Checks if specific user follows specific actor';
COMMENT ON FUNCTION get_user_followed_actors IS 'Returns all actors a user follows with metadata';
