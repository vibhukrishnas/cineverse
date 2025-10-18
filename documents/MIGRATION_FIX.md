# 🚨 QUICK FIX: Supabase Social Features Migration

## The Problem
You're getting an error because the `users` table doesn't exist yet, which the social features depend on.

## ✅ The Solution (2 Options)

### **Option 1: Use the Combined Migration (RECOMMENDED)**

I've created a single file that runs everything in the correct order:

1. Open Supabase SQL Editor (where you are now)
2. Copy ALL content from: `supabase/complete_social_migration.sql`
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see: **"Success. No rows returned"**

✅ This file includes:
- Users table creation
- All social tables (follows, notifications, social_posts, user_online_status)
- All triggers and functions
- Better error handling

---

### **Option 2: Run Files Separately (If you prefer)**

Run these files **IN THIS EXACT ORDER**:

#### Step 1: Run `users_schema.sql`
```sql
-- Copy ALL content from supabase/users_schema.sql
-- Paste in SQL Editor and Run
```

#### Step 2: Run `social_schema.sql`
```sql
-- Copy ALL content from supabase/social_schema.sql  
-- Paste in SQL Editor and Run
```

---

## 🧪 Verify It Worked

After running the migration, paste this in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'follows', 'notifications', 'social_posts', 'user_online_status');
```

You should see **5 tables** listed:
- users
- follows
- notifications  
- social_posts
- user_online_status

---

## 📝 What Changed

I updated the files to fix these issues:

### `users_schema.sql`
- ✅ Added `full_name` column (required by social features)
- ✅ Updated trigger to include full_name
- ✅ Better error handling

### `complete_social_migration.sql` (NEW)
- ✅ Combines both schemas in correct order
- ✅ Adds DROP IF EXISTS for clean re-runs
- ✅ Better error handling with EXCEPTION blocks
- ✅ Default values when data is missing
- ✅ Warning logs instead of failures

---

## 🔥 Quick Start Commands

### Copy Complete Migration
```bash
# Windows (PowerShell)
Get-Content supabase\complete_social_migration.sql | Set-Clipboard

# Then paste in Supabase SQL Editor and Run
```

### Or Copy Individual Files
```bash
# 1. Copy users schema
Get-Content supabase\users_schema.sql | Set-Clipboard

# 2. Run in Supabase, then copy social schema
Get-Content supabase\social_schema.sql | Set-Clipboard
```

---

## 💡 Pro Tips

1. **Use the complete_social_migration.sql** - It's easier and safer
2. **If you get errors**, the script has error handling so it won't break your database
3. **You can re-run it** - The script includes DROP IF EXISTS for clean re-runs
4. **Check the logs** - Look for any WARNING messages in Supabase
5. **Ignore VS Code SQL errors** - They're false positives (VS Code thinks it's MS SQL)

---

## ❓ Still Having Issues?

### Error: "relation public.reviews does not exist"
**Solution:** You need to run `reviews_schema.sql` first
```bash
# Run this BEFORE the social migration:
Get-Content supabase\reviews_schema.sql | Set-Clipboard
```

### Error: "permission denied"
**Solution:** Make sure you're using the SQL Editor in Supabase Dashboard, not psql

### Tables already exist?
**Solution:** The complete_social_migration.sql will drop and recreate them safely

---

## ✅ Next Steps After Migration

1. **Test the features:**
   - Start your dev server: `npm run dev`
   - Go to `/feed` - Social feed page
   - Go to `/notifications` - Notifications page
   - Try following a user

2. **Create test accounts:**
   - You need 2-3 accounts to test social features
   - Sign up at `/auth/signup`

3. **Check the docs:**
   - Read `SOCIAL_FEATURES_SETUP.md` for full guide
   - See `SOCIAL_FEATURES_GUIDE.md` for documentation

---

## 📞 Files to Use

- ✅ **RECOMMENDED**: `supabase/complete_social_migration.sql` (run this one)
- 📄 Backup: `supabase/users_schema.sql` (if you prefer separate)
- 📄 Backup: `supabase/social_schema.sql` (if you prefer separate)

**Choose complete_social_migration.sql and you're done in one step!** 🚀
