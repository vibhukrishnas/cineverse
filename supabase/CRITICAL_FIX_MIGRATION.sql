-- ================================================
-- CineVerse Database Fix Migration
-- Run this in Supabase SQL Editor
-- ================================================

-- ==================================
-- Fix 1: Add missing columns to reviews table
-- ==================================
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS movie_title TEXT,
ADD COLUMN IF NOT EXISTS movie_poster_path TEXT,
ADD COLUMN IF NOT EXISTS movie_year INTEGER;

-- ==================================
-- Fix 2: Add foreign key constraints
-- ==================================

-- First, check if columns exist and add them if needed
DO $$ 
BEGIN
  -- Check if user_id exists in reviews
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_id') THEN
    ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Check if author_id exists in posts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='author_id') THEN
    ALTER TABLE posts ADD COLUMN author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Check if user_id exists in comments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='user_id') THEN
    ALTER TABLE comments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Now add/update the foreign key constraints

-- Reviews to Users (auth.users)
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS fk_reviews_user;

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey; -- Drop existing auto-generated constraint

ALTER TABLE reviews
ADD CONSTRAINT fk_reviews_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Posts to Users (auth.users)
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS fk_posts_author;

ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_author_id_fkey; -- Drop existing auto-generated constraint

ALTER TABLE posts
ADD CONSTRAINT fk_posts_author
FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Comments to Users (auth.users)
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS fk_comments_user;

ALTER TABLE comments
DROP CONSTRAINT IF EXISTS comments_user_id_fkey; -- Drop existing auto-generated constraint

ALTER TABLE comments
ADD CONSTRAINT fk_comments_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Channel Members to Users
ALTER TABLE channel_members
DROP CONSTRAINT IF EXISTS fk_channel_members_user;

ALTER TABLE channel_members
DROP CONSTRAINT IF EXISTS channel_members_user_id_fkey; -- Drop existing auto-generated constraint

ALTER TABLE channel_members
ADD CONSTRAINT fk_channel_members_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==================================
-- Fix 3: Database Triggers for Counters
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
-- Fix 4: Update RLS Policies
-- ==================================

-- Reviews: Allow reading with user data
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
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
-- Fix 5: Initialize existing data
-- ==================================

-- Fix existing channels with zero member_count
UPDATE channels
SET member_count = (
  SELECT COUNT(*) FROM channel_members WHERE channel_id = channels.id
)
WHERE member_count = 0;

-- Fix existing channels with zero post_count
UPDATE channels
SET post_count = (
  SELECT COUNT(*) FROM posts WHERE channel_id = channels.id
)
WHERE post_count = 0;

-- Fix existing posts with zero comment_count
UPDATE posts
SET comment_count = (
  SELECT COUNT(*) FROM comments WHERE post_id = posts.id
)
WHERE comment_count = 0;

-- ==================================
-- Verification Queries
-- ==================================

-- Run these to verify the fixes worked:

-- 1. Check foreign keys
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
  AND tc.table_name IN ('reviews', 'posts', 'comments', 'channel_members');

-- 2. Check triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers
WHERE event_object_table IN ('channel_members', 'posts', 'comments');

-- 3. Test channel member count
SELECT 
  c.name,
  c.member_count,
  COUNT(cm.id) as actual_members
FROM channels c
LEFT JOIN channel_members cm ON cm.channel_id = c.id
GROUP BY c.id, c.name, c.member_count;

-- ==================================
-- SUCCESS!
-- ==================================
-- If no errors, your database is now fixed!
-- Test the website to verify everything works.
