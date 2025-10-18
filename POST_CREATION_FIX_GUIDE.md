# 🔧 Channel Post Creation Issue - Diagnostic & Fix Guide

## 🔍 Issue Report
**User Report:** "Unable to create a post in channel"

## 🩺 Diagnosis Steps

### 1. Check If You're Logged In
The most common issue is not being authenticated.

**How to check:**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for authentication errors
4. Check if you see "Not authenticated" error

### 2. Check RLS Policy
The database policy requires:
```sql
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);
```

This means:
- ✅ You must be logged in
- ✅ Your user ID must match the author_id
- ❌ Anonymous users cannot create posts

### 3. Check Database Schema
The posts table requires these fields:
- `channel_id` (UUID) - Required
- `author_id` (UUID) - Required (auto-set to your user ID)
- `title` (TEXT) - Required
- `content` (TEXT) - Optional
- `flair` (TEXT) - Optional
- `thumbnail_url` (TEXT) - Optional
- `is_spoiler` (BOOLEAN) - Optional

## 🔧 Common Fixes

### Fix 1: Not Logged In
**Symptom:** Error "Not authenticated"

**Solution:**
1. Go to `/auth/signin`
2. Sign in with your account
3. Try creating post again

### Fix 2: Channel Not Found
**Symptom:** Error "Channel not found" or channelId is null

**Solution:**
1. Make sure you're on the correct channel page
2. URL should be: `/channel/[channel-slug]/post/create`
3. If channel doesn't exist, create it first at `/channel/create`

### Fix 3: Missing Required Fields
**Symptom:** Form submit fails silently or shows "Title is required"

**Solution:**
- Make sure title is not empty
- Title must have at least 1 character
- Content is optional but recommended

### Fix 4: Database Policy Issue
**Symptom:** Error after submit, post doesn't appear

**Solution:** Run this SQL in Supabase SQL Editor:

```sql
-- Check if posts table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'posts';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'posts';

-- Recreate the INSERT policy if needed
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);
```

### Fix 5: Channel Membership Required
**Symptom:** You can view channel but can't post

**Possible Solution (if you want to require membership):**

```sql
-- This policy would require users to be members
-- Currently NOT implemented, but here's how you would add it:

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;

CREATE POLICY "Channel members can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE user_id = auth.uid()
      AND channel_id = posts.channel_id
    )
  );
```

**Note:** By default, ANY authenticated user can post to ANY channel.

## 🧪 Testing Steps

### Test 1: Basic Post Creation
1. Make sure you're logged in
2. Go to any channel (e.g., `/channel/general`)
3. Click "Create Post" button
4. Fill in title: "Test Post"
5. Fill in content: "This is a test"
6. Click "Submit"
7. Should redirect to post page

### Test 2: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try creating a post
4. Look for error messages:
   - ❌ "Not authenticated" → Need to log in
   - ❌ "Failed to create post" → Check database
   - ❌ "Channel not found" → Check channel exists

### Test 3: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try creating a post
4. Look for API call to Supabase
5. Check response:
   - ✅ Status 201 → Success
   - ❌ Status 401 → Not authenticated
   - ❌ Status 403 → Permission denied (RLS policy)
   - ❌ Status 422 → Missing required fields

## 🚨 Emergency Fix Script

If posts still won't create, run this complete fix in Supabase SQL Editor:

```sql
-- ============================================
-- EMERGENCY FIX: Channel Posts
-- ============================================

-- Step 1: Verify table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
  ) THEN
    RAISE EXCEPTION 'Posts table does not exist! Run channels_schema.sql first.';
  END IF;
END $$;

-- Step 2: Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing post policies
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors and moderators can delete posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;

-- Step 4: Recreate policies
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

-- Step 5: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'posts'
ORDER BY cmd;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Post creation policies have been reset!';
  RAISE NOTICE 'Try creating a post now.';
END $$;
```

## 📝 Quick Checklist

Before creating a post, verify:

- [ ] You are logged in (check top right corner)
- [ ] You're on a channel page
- [ ] The channel exists and is visible
- [ ] You have filled in the title field
- [ ] Browser console shows no errors
- [ ] You clicked the "Submit" or "Create Post" button

## 💡 Additional Troubleshooting

### Check Supabase Connection
```typescript
// In browser console:
const supabase = createClient()
const { data, error } = await supabase.auth.getUser()
console.log('User:', data.user?.id)
console.log('Error:', error)
```

### Check If You Can Read Posts
If you can SEE posts but not CREATE them:
- RLS SELECT policy works
- RLS INSERT policy might be broken
- Run the emergency fix script above

### Check Database Logs
1. Go to Supabase Dashboard
2. Click on "Logs" in sidebar
3. Look for error messages
4. Common errors:
   - "permission denied for table posts"
   - "null value in column author_id"
   - "violates check constraint"

## 🎯 Expected Behavior

### Successful Post Creation:
1. Click "Create Post" button on channel page
2. Form appears with title, content, flair fields
3. Fill in title (required)
4. Fill in content (optional)
5. Click "Submit"
6. Loading state appears
7. Redirect to new post page
8. Post appears in channel feed
9. Success!

### What Happens Behind the Scenes:
```typescript
// 1. Frontend collects form data
const postData = {
  channel_id: channelId,
  title: title.trim(),
  content: content.trim(),
  flair: flair || undefined,
  is_spoiler: isSpoiler
}

// 2. Server action calls Supabase
const { data: post, error } = await supabase
  .from('posts')
  .insert({
    ...postData,
    author_id: user.id  // Auto-set from auth
  })
  .select()
  .single()

// 3. RLS policy checks:
// - Is user authenticated? ✓
// - Does author_id match user.id? ✓
// - Allow insert ✓

// 4. Database triggers:
// - Increment channel post_count
// - Update channel updated_at
// - Return new post

// 5. Redirect to post page
router.push(`/post/${post.id}`)
```

## 🆘 Still Not Working?

### Get More Information:
1. Take screenshot of error message
2. Copy error from browser console
3. Check Supabase database logs
4. Verify you ran the emergency fix script

### Common Root Causes:
1. **Not logged in** (90% of cases)
2. **Posts table doesn't exist** (run channels_schema.sql)
3. **RLS policy missing** (run emergency fix)
4. **Channel doesn't exist** (create channel first)
5. **JavaScript error** (check browser console)

### Need Help?
Include this information:
- Error message from console
- Screenshot of form
- User authentication status
- Browser and version
- Steps you took before error

## ✅ Verification

After applying fixes, test:
1. Log in to your account
2. Go to `/channel/general` (or any channel)
3. Click "Create Post"
4. Enter title: "Test Post from Fix"
5. Enter content: "Testing post creation after fix"
6. Click "Submit"
7. Should see post in feed!

**If it works:** ✅ Issue resolved!
**If it doesn't:** Run emergency fix script and check logs.
