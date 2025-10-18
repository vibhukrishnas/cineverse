# Reviews System - Debugging Guide

## Fixed Issues

1. ✅ **Removed window.location.reload()** - Now uses React state to refresh reviews
2. ✅ **Fixed foreign key reference** - Changed from `users!reviews_user_id_fkey` to `users:user_id`
3. ✅ **Added error handling** - Reviews list now shows error messages
4. ✅ **Added console logging** - Can debug in browser console

## How to Test

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Open Browser Console
- Press F12 in Chrome/Edge
- Go to "Console" tab
- Keep it open while testing

### 3. Test Creating a Review

1. Go to http://localhost:3000/movie/550
2. Sign in if not already
3. Scroll to Reviews section
4. Click "Write a Review"
5. Fill in the form:
   - Rating: 4.5 stars
   - Content: "This is a test review for debugging purposes. It needs to be at least fifty characters long to pass validation."
6. Click "Submit Review"

### 4. Check Console Output

You should see:
```
Creating review for user: [user-id] movie: 550
Review data: { user_id: "...", movie_id: 550, ... }
Review created successfully: { id: "...", ... }
Loading reviews for movie: 550
Loaded reviews: 1
```

### 5. Check for Errors

If you see errors, they will appear in:
- Console (F12 → Console tab)
- Network tab (F12 → Network tab)
- On the page itself (red error message)

## Common Issues & Solutions

### Issue 1: "Error loading reviews"
**Possible causes:**
- Users table doesn't exist in Supabase
- RLS policies blocking access
- Foreign key reference incorrect

**Solution:**
1. Go to Supabase Dashboard → Table Editor
2. Check if `users` table exists
3. Check if `reviews` table exists
4. Run the SQL migration again

### Issue 2: "You must be logged in"
**Cause:** User session expired or not logged in

**Solution:**
1. Go to /auth/login
2. Sign in again
3. Try creating review

### Issue 3: "You have already reviewed this movie"
**Cause:** User already has a review for this movie (unique constraint)

**Solution:**
1. Either delete your existing review
2. Or test with a different movie ID
3. Or edit your existing review instead

### Issue 4: Reviews don't appear after creation
**Possible causes:**
- Foreign key to users table failing
- RLS policy blocking SELECT
- Review was created but user data not fetched

**Debug steps:**
1. Check console for "Review created successfully"
2. Check console for "Loaded reviews: X"
3. Go to Supabase Dashboard → Table Editor → reviews
4. Check if your review is there
5. If review exists but doesn't show:
   - Check users table has your user data
   - Check RLS policies on reviews table
   - Check foreign key constraint

### Issue 5: "relation public.users does not exist"
**Cause:** Users table wasn't created yet

**Solution:**
Create users table in Supabase:
```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read user profiles
CREATE POLICY "User profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

## Verification Checklist

After creating a review, verify:

- [ ] Console shows "Review created successfully"
- [ ] Console shows "Loaded reviews: 1" (or more)
- [ ] Review appears on the page
- [ ] User avatar/username shows correctly
- [ ] Star rating displays correctly
- [ ] Review content is visible
- [ ] Like button works
- [ ] Helpful button works
- [ ] Can edit own review
- [ ] Can delete own review

## SQL Verification Queries

Run these in Supabase SQL Editor:

### Check if review was created
```sql
SELECT * FROM public.reviews 
WHERE movie_id = 550 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check if user data exists
```sql
SELECT id, username, avatar_url 
FROM public.users 
WHERE id = (SELECT user_id FROM public.reviews LIMIT 1);
```

### Check review with user data (simulates what app does)
```sql
SELECT 
  r.*,
  u.username,
  u.avatar_url
FROM public.reviews r
LEFT JOIN public.users u ON r.user_id = u.id
WHERE r.movie_id = 550
ORDER BY r.created_at DESC;
```

### Check RLS policies
```sql
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('reviews', 'review_likes', 'review_helpful');
```

## Next Steps

1. **Test the system** - Follow the steps above
2. **Check console output** - Look for errors
3. **Verify in Supabase** - Check if data is being created
4. **Report specific error** - Share the console output if issues persist

The console logging will help identify exactly where the issue is occurring.
