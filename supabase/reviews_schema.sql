-- Reviews System Schema for CineVerse

-- Drop existing objects if they exist (for clean reinstall)
-- Drop tables first (this will cascade and drop triggers too)
DROP TABLE IF EXISTS public.review_helpful CASCADE;
DROP TABLE IF EXISTS public.review_likes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_review_counts() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  content TEXT NOT NULL CHECK (char_length(content) >= 50 AND char_length(content) <= 5000),
  
  -- Category ratings (optional, 0-5 scale)
  story_rating DECIMAL(2,1) CHECK (story_rating IS NULL OR (story_rating >= 0 AND story_rating <= 5)),
  acting_rating DECIMAL(2,1) CHECK (acting_rating IS NULL OR (acting_rating >= 0 AND acting_rating <= 5)),
  direction_rating DECIMAL(2,1) CHECK (direction_rating IS NULL OR (direction_rating >= 0 AND direction_rating <= 5)),
  cinematography_rating DECIMAL(2,1) CHECK (cinematography_rating IS NULL OR (cinematography_rating >= 0 AND cinematography_rating <= 5)),
  music_rating DECIMAL(2,1) CHECK (music_rating IS NULL OR (music_rating >= 0 AND music_rating <= 5)),
  
  -- Metadata
  is_spoiler BOOLEAN DEFAULT FALSE,
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  helpful_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one review per user per movie
  UNIQUE(user_id, movie_id)
);

-- Create review_likes table
CREATE TABLE public.review_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one like per user per review
  UNIQUE(user_id, review_id)
);

-- Create review_helpful table
CREATE TABLE public.review_helpful (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one helpful mark per user per review
  UNIQUE(user_id, review_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_reviews_movie_id ON public.reviews(movie_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX idx_reviews_helpful_count ON public.reviews(helpful_count DESC);
CREATE INDEX idx_review_likes_review_id ON public.review_likes(review_id);
CREATE INDEX idx_review_helpful_review_id ON public.review_helpful(review_id);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews table

-- Allow anyone to read reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Allow authenticated users to create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for review_likes table

-- Allow anyone to read likes
CREATE POLICY "Review likes are viewable by everyone"
  ON public.review_likes FOR SELECT
  USING (true);

-- Allow authenticated users to like reviews
CREATE POLICY "Authenticated users can like reviews"
  ON public.review_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to remove their own likes
CREATE POLICY "Users can remove their own likes"
  ON public.review_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for review_helpful table

-- Allow anyone to read helpful marks
CREATE POLICY "Review helpful marks are viewable by everyone"
  ON public.review_helpful FOR SELECT
  USING (true);

-- Allow authenticated users to mark reviews as helpful
CREATE POLICY "Authenticated users can mark reviews as helpful"
  ON public.review_helpful FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to remove their own helpful marks
CREATE POLICY "Users can remove their own helpful marks"
  ON public.review_helpful FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update review counts
CREATE OR REPLACE FUNCTION update_review_counts()
RETURNS TRIGGER AS $$
DECLARE
  review_record RECORD;
BEGIN
  IF TG_TABLE_NAME = 'review_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.reviews
      SET like_count = like_count + 1
      WHERE id = NEW.review_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.reviews
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = OLD.review_id;
      RETURN OLD;
    END IF;
  ELSIF TG_TABLE_NAME = 'review_helpful' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.reviews
      SET helpful_count = helpful_count + 1
      WHERE id = NEW.review_id;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.reviews
      SET helpful_count = GREATEST(helpful_count - 1, 0)
      WHERE id = OLD.review_id;
      RETURN OLD;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic count updates
DROP TRIGGER IF EXISTS review_likes_count_trigger ON public.review_likes;
CREATE TRIGGER review_likes_count_trigger
  AFTER INSERT OR DELETE ON public.review_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_counts();

DROP TRIGGER IF EXISTS review_helpful_count_trigger ON public.review_helpful;
CREATE TRIGGER review_helpful_count_trigger
  AFTER INSERT OR DELETE ON public.review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION update_review_counts();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
