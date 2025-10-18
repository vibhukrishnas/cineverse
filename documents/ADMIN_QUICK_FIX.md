# 🚨 ADMIN ACCESS FIX - Quick Solution

## Problem
You're getting `insufficient_permissions` error when accessing `/admin` because your user doesn't have an admin role assigned yet.

## Solution (2 Steps - Takes 1 Minute)

### Step 1: Get Your User ID

1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** in the left sidebar
3. Click **Users**
4. Find your email and **copy your User ID** (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

### Step 2: Assign Admin Role

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL query (replace `YOUR-USER-ID` with your actual ID):

```sql
-- Replace YOUR-USER-ID with your actual user ID from Step 1
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID', 'super_admin');
```

3. Click **Run** button

### Step 3: Test Access

1. **Log out and log back in** (or clear your browser cookies)
2. Go to `http://localhost:3000/admin`
3. ✅ You should now see the admin dashboard!

---

## Alternative: Use Supabase Table Editor

If you prefer a visual interface:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `user_roles` table
3. Click **Insert** → **Insert row**
4. Fill in:
   - `user_id`: Your user ID from Step 1
   - `role`: `super_admin`
5. Click **Save**
6. Log out and back in
7. Try `/admin` again

---

## Verify It Worked

After assigning the role, you can verify with this SQL query:

```sql
SELECT 
  ur.role,
  u.email,
  ur.assigned_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = 'YOUR-USER-ID';
```

You should see:
- **role**: `super_admin`
- **email**: Your email
- **assigned_at**: Current timestamp

---

## Why This Happened

The admin system has **role-based access control**. Without a role assignment:
- Default role: `user`
- Can access: Regular user features only
- Cannot access: `/admin` routes

With `super_admin` role:
- Can access: All admin pages
- Can manage: Users, content, settings, everything

---

## Role Types

| Role | Access Level |
|------|-------------|
| `user` | Regular user (default) |
| `moderator` | Can moderate content |
| `admin` | Can manage users + moderate |
| `super_admin` | Full access to everything |

---

## Still Not Working?

### Check 1: Database Migration Ran Successfully
```sql
-- This should return rows, not an error
SELECT * FROM public.user_roles LIMIT 1;
```

If you get an error, run the migration:
1. Open `supabase/admin_schema.sql`
2. Copy entire contents
3. Paste in SQL Editor
4. Click Run

### Check 2: RPC Function Exists
```sql
-- This should return TRUE or FALSE, not an error
SELECT public.has_permission('YOUR-USER-ID', 'admin');
```

If you get an error about function not existing, the migration didn't run properly.

### Check 3: Clear Browser Cache
- Press `Ctrl + Shift + R` to hard refresh
- Or open an incognito window
- Sometimes cookies get stuck

### Check 4: Restart Dev Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## ✅ Success Checklist

- [ ] Got my user ID from Supabase Authentication page
- [ ] Ran INSERT query to assign `super_admin` role
- [ ] Logged out and back in (or cleared cookies)
- [ ] Restarted dev server
- [ ] Visited `localhost:3000/admin`
- [ ] Can see admin dashboard! 🎉

---

## Quick SQL Reference

```sql
-- Get your user ID if you forgot it
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Assign super_admin role (use your actual ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id-here', 'super_admin');

-- Check if role is assigned
SELECT * FROM public.user_roles WHERE user_id = 'your-user-id-here';

-- Check if permission function works
SELECT public.has_permission('your-user-id-here', 'admin');
```

---

**After these steps, `/admin` will work perfectly!** 🚀
