-- Fix missing foreign key relationship between posts and users
-- This resolves the PGRST200 error when querying posts with author data

-- First, check if the foreign key exists and drop it if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_author_id_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_author_id_fkey;
  END IF;
END $$;

-- Add the foreign key constraint properly
ALTER TABLE public.posts
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify the constraint was created
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_author_id_fkey' 
    AND table_name = 'posts'
  ) THEN
    RAISE EXCEPTION 'Foreign key constraint was not created successfully';
  END IF;
  
  RAISE NOTICE 'Foreign key constraint posts_author_id_fkey created successfully';
END $$;

-- Refresh the schema cache (Supabase will do this automatically after migration)
-- But you can also manually run: SELECT pg_notify('pgrst', 'reload schema');
