# 🔧 QUICK FIX - Reviews Not Showing

## The Problem
Error: "Could not find a relationship between 'reviews' and 'user_id' in the schema cache"

## The Solution (2 Steps)

### Step 1: Run Users Table Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy ALL content from `supabase/users_schema.sql`
3. Paste and **RUN** in Supabase
4. Wait for success message

This creates the `users` table and automatically creates profiles for existing users.

### Step 2: Restart Your App

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Test Again

1. Go to any movie page (e.g., `/movie/1233413`)
2. Click "Write a Review"
3. Fill and submit
4. **Review should now appear!** ✅

## What Was Fixed?

I updated the code to handle missing user data gracefully:
- Reviews will now load even if users table doesn't exist
- Shows "Anonymous" if user data is missing
- Creates users table with auto-sync from auth.users

## Verify It Works

After running the SQL, check in Supabase:

1. Go to **Table Editor**
2. You should see `users` table
3. Click on it - should show your user profile

Then test creating a review - it should work perfectly now! 🎬

## If Still Having Issues

Check browser console (F12) and share the error message.
