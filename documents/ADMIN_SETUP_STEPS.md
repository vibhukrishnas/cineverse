# 🚀 Admin System Setup - Step by Step

## ✅ Task 1: Create Database Schema (IN PROGRESS)

### Step 1.1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your CineVerse project
3. Click on **SQL Editor** in the left sidebar

### Step 1.2: Run the Admin Schema Migration

1. Open the file: `supabase/admin_schema.sql`
2. Copy ALL contents (544 lines)
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for success message

**Expected Output:**
```
Success. No rows returned
```

### Step 1.3: Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_roles', 'admin_logs', 'bans', 'reports', 
  'flags', 'appeals', 'platform_settings', 
  'featured_content', 'moderation_notes', 'announcements'
);
```

**Expected:** Should show 10 tables

### Step 1.4: Assign Yourself Super Admin Role

Get your user ID first:

```sql
SELECT id, email FROM auth.users;
```

Copy your user ID, then run:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'super_admin');
```

### Step 1.5: Test Permissions

```sql
SELECT has_permission('YOUR-USER-ID-HERE', 'admin');
```

**Expected:** `true`

---

## 📋 Next Steps After Database Setup

Once you've completed the database migration, return here and I'll proceed with:

- ✅ Task 1: Database schema (YOU ARE HERE - complete the SQL migration above)
- ⏳ Task 2: Complete admin server actions
- ⏳ Task 3: Update middleware for admin routes
- ⏳ Task 4: Create admin layout components
- ⏳ Task 5: Build admin dashboard page
- ⏳ Task 6: Build user management page
- ⏳ Task 7: Build moderation queue
- ⏳ Task 8: Add analytics dashboard
- ⏳ Task 9: Create settings page
- ⏳ Task 10: Test everything

---

## ⚠️ Important Notes

1. **Backup First**: If you have production data, back it up before running migrations
2. **RLS Policies**: The schema includes Row Level Security - only admins can access these tables
3. **Indexes**: 50+ indexes are created for query performance
4. **Helper Functions**: 4 PostgreSQL functions are created for permission checking

---

## 🆘 Troubleshooting

### If you get "relation already exists" errors:
The schema uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run.

### If you get permission errors:
Make sure you're running as the postgres role (default in Supabase SQL Editor).

### If tables aren't showing up:
1. Refresh your Supabase dashboard
2. Check the Table Editor in the sidebar
3. Look for the new tables in the public schema

---

**Once you've completed the SQL migration, let me know and I'll continue with the next tasks!**
