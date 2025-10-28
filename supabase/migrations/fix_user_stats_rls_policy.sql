-- Fix RLS policy for user_stats table to allow inserts
-- This migration adds the missing INSERT policy that was causing error 42501

-- Solution 1: Add INSERT policy (allows users to create their own stats)
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solution 2: Update trigger function to use SECURITY DEFINER (bypasses RLS)
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
