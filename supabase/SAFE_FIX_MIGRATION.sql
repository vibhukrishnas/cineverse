-- ================================================
-- CineVerse Database Fix Migration - SAFE VERSION
-- Run this in Supabase SQL Editor
-- This version checks your schema first!
-- ================================================

-- ==================================
-- Step 1: Add missing columns to reviews table
-- ==================================
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS movie_title TEXT,
ADD COLUMN IF NOT EXISTS movie_poster_path TEXT,
ADD COLUMN IF NOT EXISTS movie_year INTEGER;

-- ==================================
-- Step 2: Fix Foreign Key Relationships
-- (These may already exist - we drop and recreate them properly)
-- ==================================

-- Reviews -> Users
DO $$ 
BEGIN
  -- Drop any existing foreign key constraint on user_id
  ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
  ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_reviews_user;
  
  -- Add proper foreign key constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_id') THEN
    ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Posts -> Users
DO $$ 
BEGIN
  -- Drop any existing foreign key constraint on author_id
  ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
  ALTER TABLE posts DROP CONSTRAINT IF EXISTS fk_posts_author;
  
  -- Add proper foreign key constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='author_id') THEN
    ALTER TABLE posts
    ADD CONSTRAINT fk_posts_author
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Comments -> Users
DO $$ 
BEGIN
  -- Drop any existing foreign key constraint on user_id
  ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
  ALTER TABLE comments DROP CONSTRAINT IF EXISTS fk_comments_user;
  
  -- Add proper foreign key constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='user_id') THEN
    ALTER TABLE comments
    ADD CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Channel Members -> Users
DO $$ 
BEGIN
  -- Drop any existing foreign key constraint on user_id
  ALTER TABLE channel_members DROP CONSTRAINT IF EXISTS channel_members_user_id_fkey;
  ALTER TABLE channel_members DROP CONSTRAINT IF EXISTS fk_channel_members_user;
  
  -- Add proper foreign key constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='channel_members' AND column_name='user_id') THEN
    ALTER TABLE channel_members
    ADD CONSTRAINT fk_channel_members_user
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ==================================
-- Step 3: Database Triggers for Counters
-- ==================================

-- Trigger 1: Update channel member_count
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE channels
    SET member_count = member_count + 1,
        updated_at = NOW()
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE channels
    SET member_count = GREATEST(member_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS channel_member_count_trigger ON channel_members;
CREATE TRIGGER channel_member_count_trigger
AFTER INSERT OR DELETE ON channel_members
FOR EACH ROW EXECUTE FUNCTION update_channel_member_count();

-- Trigger 2: Update channel post_count
CREATE OR REPLACE FUNCTION update_channel_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE channels
    SET post_count = post_count + 1,
        updated_at = NOW()
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE channels
    SET post_count = GREATEST(post_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS channel_post_count_trigger ON posts;
CREATE TRIGGER channel_post_count_trigger
AFTER INSERT OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION update_channel_post_count();

-- Trigger 3: Update post comment_count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_comment_count_trigger ON comments;
CREATE TRIGGER post_comment_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- ==================================
-- Step 4: Update RLS Policies
-- ==================================

-- Reviews: Allow reading with user data
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

-- Posts: Allow reading with author data
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
USING (true);

-- Comments: Allow reading with user data
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
USING (true);

-- Channel Members: Allow reading
DROP POLICY IF EXISTS "Anyone can view channel members" ON channel_members;
CREATE POLICY "Anyone can view channel members"
ON channel_members FOR SELECT
USING (true);

-- ==================================
-- Step 5: Fix existing data counters
-- ==================================

-- Fix existing channels with incorrect member_count
UPDATE channels
SET member_count = (
  SELECT COUNT(*) FROM channel_members WHERE channel_id = channels.id
);

-- Fix existing channels with incorrect post_count
UPDATE channels
SET post_count = (
  SELECT COUNT(*) FROM posts WHERE channel_id = channels.id
);

-- Fix existing posts with incorrect comment_count
UPDATE posts
SET comment_count = (
  SELECT COUNT(*) FROM comments WHERE post_id = posts.id
);

-- ==================================
-- Verification Queries (Run these after)
-- ==================================

-- 1. Check foreign keys were created
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('reviews', 'posts', 'comments', 'channel_members')
  AND kcu.column_name IN ('user_id', 'author_id');

-- 2. Check triggers were created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers
WHERE event_object_table IN ('channel_members', 'posts', 'comments')
ORDER BY event_object_table, trigger_name;

-- 3. Verify channel member counts are correct
SELECT 
  c.name,
  c.member_count,
  COUNT(cm.user_id) as actual_members,
  CASE 
    WHEN c.member_count = COUNT(cm.user_id) THEN '✅ Correct'
    ELSE '❌ Mismatch'
  END as status
FROM channels c
LEFT JOIN channel_members cm ON cm.channel_id = c.id
GROUP BY c.id, c.name, c.member_count
ORDER BY c.name;

-- 4. Check reviews table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND column_name IN ('movie_title', 'movie_poster_path', 'movie_year');

-- ==================================
-- SUCCESS!
-- ==================================
-- If all verification queries return results, your database is fixed!
-- Now test the website:
-- 1. Visit /feed - should show reviews
-- 2. Visit /channels - create and join channels
-- 3. Visit /for-you - AI recommendations (after fixing Gemini model)
