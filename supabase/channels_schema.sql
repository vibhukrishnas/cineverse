-- ============================================
-- CineVerse Community Channels Schema
-- Reddit/Discord-style discussion channels
-- ============================================

-- Drop existing objects if they exist (in correct order)
DO $$ 
BEGIN
  -- Drop triggers first (only if tables exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channel_members') THEN
    DROP TRIGGER IF EXISTS update_channel_member_count ON public.channel_members;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    DROP TRIGGER IF EXISTS update_post_comment_count ON public.comments;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'votes') THEN
    DROP TRIGGER IF EXISTS update_vote_counts ON public.votes;
  END IF;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_channel_member_count_fn() CASCADE;
DROP FUNCTION IF EXISTS update_post_comment_count_fn() CASCADE;
DROP FUNCTION IF EXISTS update_vote_counts_fn() CASCADE;
DROP FUNCTION IF EXISTS is_channel_moderator(UUID, UUID);
DROP FUNCTION IF EXISTS is_channel_member(UUID, UUID);

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.channel_members CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;

-- Create channels table
CREATE TABLE public.channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('genre', 'regional', 'topic', 'custom')),
  icon TEXT, -- URL or emoji
  banner_url TEXT,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  moderator_ids UUID[] DEFAULT '{}',
  rules TEXT[] DEFAULT '{}',
  is_official BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  flair TEXT, -- Discussion, Review, Question, News, etc.
  thumbnail_url TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0, -- upvotes - downvotes
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_spoiler BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table (supports nested comments)
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0, -- 0 = top-level, max 10
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (depth <= 10)
);

-- Create channel_members table (join/leave channels)
CREATE TABLE public.channel_members (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, channel_id)
);

-- Create votes table (upvote/downvote posts and comments)
CREATE TABLE public.votes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  votable_id UUID NOT NULL,
  votable_type TEXT NOT NULL CHECK (votable_type IN ('post', 'comment')),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, votable_id, votable_type)
);

-- Create indexes for performance
CREATE INDEX idx_channels_slug ON public.channels(slug);
CREATE INDEX idx_channels_type ON public.channels(type);
CREATE INDEX idx_channels_member_count ON public.channels(member_count DESC);
CREATE INDEX idx_posts_channel_id ON public.posts(channel_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_score ON public.posts(score DESC);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_pinned ON public.posts(is_pinned DESC, created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_score ON public.comments(score DESC);
CREATE INDEX idx_channel_members_user_id ON public.channel_members(user_id);
CREATE INDEX idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX idx_votes_votable ON public.votes(votable_id, votable_type);

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels

CREATE POLICY "Channels are viewable by everyone"
  ON public.channels FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create channels"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creators and moderators can update"
  ON public.channels FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid() = ANY(moderator_ids)
  );

CREATE POLICY "Channel creators can delete"
  ON public.channels FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for posts

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors and moderators can delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    auth.uid() IN (
      SELECT unnest(moderator_ids) 
      FROM public.channels 
      WHERE id = channel_id
    )
  );

-- RLS Policies for comments

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for channel_members

CREATE POLICY "Members are viewable by everyone"
  ON public.channel_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join channels"
  ON public.channel_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave channels"
  ON public.channel_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for votes

CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their votes"
  ON public.votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes"
  ON public.votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update channel member count
CREATE OR REPLACE FUNCTION update_channel_member_count_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.channels
    SET member_count = member_count + 1
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.channels
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for channel member count
CREATE TRIGGER update_channel_member_count
  AFTER INSERT OR DELETE ON public.channel_members
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_member_count_fn();

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post comment count
CREATE TRIGGER update_post_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count_fn();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts_fn()
RETURNS TRIGGER AS $$
DECLARE
  target_table TEXT;
BEGIN
  -- Determine which table to update
  IF TG_OP = 'INSERT' THEN
    target_table := NEW.votable_type || 's';
    
    IF NEW.vote_type = 'up' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = upvotes + 1, score = score + 1 WHERE id = $1', target_table)
      USING NEW.votable_id;
    ELSE
      EXECUTE format('UPDATE public.%I SET downvotes = downvotes + 1, score = score - 1 WHERE id = $1', target_table)
      USING NEW.votable_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    target_table := NEW.votable_type || 's';
    
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = upvotes - 1, downvotes = downvotes + 1, score = score - 2 WHERE id = $1', target_table)
      USING NEW.votable_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = upvotes + 1, downvotes = downvotes - 1, score = score + 2 WHERE id = $1', target_table)
      USING NEW.votable_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    target_table := OLD.votable_type || 's';
    
    IF OLD.vote_type = 'up' THEN
      EXECUTE format('UPDATE public.%I SET upvotes = GREATEST(0, upvotes - 1), score = score - 1 WHERE id = $1', target_table)
      USING OLD.votable_id;
    ELSE
      EXECUTE format('UPDATE public.%I SET downvotes = GREATEST(0, downvotes - 1), score = score + 1 WHERE id = $1', target_table)
      USING OLD.votable_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote counts
CREATE TRIGGER update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts_fn();

-- Helper function to check if user is channel moderator
CREATE OR REPLACE FUNCTION is_channel_moderator(p_user_id UUID, p_channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = p_channel_id
    AND p_user_id = ANY(moderator_ids)
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user is channel member
CREATE OR REPLACE FUNCTION is_channel_member(p_user_id UUID, p_channel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE user_id = p_user_id AND channel_id = p_channel_id
  );
END;
$$ LANGUAGE plpgsql;

-- Insert default channels
INSERT INTO public.channels (name, slug, description, type, icon, is_official, moderator_ids) VALUES
('Horror', 'horror', 'Discuss horror movies, from classic scares to modern frights', 'genre', '🎃', true, '{}'),
('Sci-Fi', 'sci-fi', 'Science fiction movies and futuristic storytelling', 'genre', '🚀', true, '{}'),
('Comedy', 'comedy', 'Funny movies that make you laugh', 'genre', '😂', true, '{}'),
('Drama', 'drama', 'Emotional and powerful dramatic films', 'genre', '🎭', true, '{}'),
('Action', 'action', 'High-octane action and adventure movies', 'genre', '💥', true, '{}'),
('Hollywood', 'hollywood', 'Hollywood movies and American cinema', 'regional', '🎬', true, '{}'),
('Bollywood', 'bollywood', 'Indian cinema and Bollywood films', 'regional', '🇮🇳', true, '{}'),
('International', 'international', 'World cinema from around the globe', 'regional', '🌍', true, '{}'),
('New Releases', 'new-releases', 'Discuss the latest movie releases', 'topic', '🆕', true, '{}'),
('Classic Cinema', 'classic-cinema', 'Timeless classics and cinema history', 'topic', '📽️', true, '{}'),
('Indie Films', 'indie-films', 'Independent and art-house cinema', 'topic', '🎨', true, '{}');

-- ============================================
-- Migration Complete!
-- ============================================
-- You should see "Success. No rows returned" if everything worked.
-- 
-- To verify, run:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('channels', 'posts', 'comments', 'channel_members', 'votes');
