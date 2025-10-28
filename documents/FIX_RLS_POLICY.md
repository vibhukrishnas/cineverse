# Fix RLS Policy for user_stats Table

## Problem
Error: `new row violates row-level security policy for table "user_stats"`

**Root Cause:** The `user_stats` table has RLS enabled but is missing an INSERT policy. Users can SELECT (view) and UPDATE their stats, but cannot INSERT new stats.

## Solution
Added missing INSERT policy to allow users to create their own stats row.

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (RECOMMENDED)
1. Go to https://supabase.com/dashboard
2. Select your CineVerse project
3. Navigate to **SQL Editor**
4. Copy and paste this SQL:

```sql
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

5. Click **Run** to execute
6. Verify success (should see "Success. No rows returned")

### Option 2: Via Supabase CLI (If installed)
```bash
supabase db push
```

### Option 3: Manual SQL Execution
If you have direct database access, run:
```bash
psql postgresql://[connection-string] -f supabase/migrations/fix_user_stats_rls_policy.sql
```

## Verify the Fix
After applying, refresh your dashboard page. The errors should be gone and you should see:
- ✅ Level progress bar
- ✅ Karma points
- ✅ Recent achievements
- ✅ Stats grid (karma/achievements/reviews)

## What This Does
- Allows authenticated users to INSERT rows into `user_stats` where `user_id` matches their `auth.uid()`
- Maintains security by preventing users from inserting stats for other users
- Completes the RLS policy set (SELECT, UPDATE, INSERT)

## Current RLS Policies (After Fix)
```sql
-- SELECT: Anyone can view all user stats (for leaderboards)
CREATE POLICY "Users can view all user stats"
  ON public.user_stats FOR SELECT
  USING (true);

-- UPDATE: Users can only update their own stats
CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own stats (NEW)
CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Alternative: Disable Error Logging (NOT RECOMMENDED)
If you can't access the database immediately, you can temporarily silence the error by commenting out the `initializeUserStats` call, but this will break gamification for new users.
