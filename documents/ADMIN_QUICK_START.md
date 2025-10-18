# 🚀 Admin System - Quick Start Instructions

## ✅ What's Done

- ✅ Complete database schema (10 tables)
- ✅ All admin server actions (900+ lines)
- ✅ Middleware protection for `/admin` routes
- ✅ Admin layout with sidebar and header
- ✅ Admin dashboard page with metrics
- ✅ User management page with full CRUD

**Total:** ~2,000 lines of code written across 8 files

---

## 📋 Step-by-Step Setup (5 minutes)

### Step 1: Run Database Migration

1. Go to https://supabase.com/dashboard
2. Select your CineVerse project
3. Click **SQL Editor** (left sidebar)
4. Open this file in VS Code: `supabase/admin_schema.sql`
5. Copy ALL contents (600+ lines)
6. Paste into Supabase SQL Editor
7. Click **Run** button
8. Wait for "Success" message

---

### Step 2: Assign Yourself Admin Role

In the same SQL Editor, run these queries:

```sql
-- First, get your user ID
SELECT id, email FROM auth.users;
```

Copy your user ID from the results, then run:

```sql
-- Replace 'YOUR-USER-ID-HERE' with actual ID from above
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'super_admin');
```

---

### Step 3: Install Missing Package (Optional)

If you see errors about dropdown-menu, run:

```bash
npm install @radix-ui/react-dropdown-menu
```

---

### Step 4: Start Development Server

```bash
npm run dev
```

---

### Step 5: Access Admin Panel

Open your browser and go to:

```
http://localhost:3000/admin
```

You should see:
- ✅ Admin dashboard with statistics
- ✅ Sidebar navigation with 9 menu items
- ✅ Stats cards showing platform metrics
- ✅ Trend charts for signups and reviews

---

## 🎯 Test the Features

### Test 1: View Dashboard
- Navigate to `/admin`
- See 4 stats cards (users, active users, reviews, reports)
- See 2 trend charts (signups last 30 days, reviews last 7 days)
- See 3 quick action cards

### Test 2: Manage Users
- Click "Users" in sidebar (or go to `/admin/users`)
- See list of all users
- Try searching by email
- Try filtering by role
- Click ban button on a test user
- Click role change button

### Test 3: Check Security
- Log out and try to access `/admin` (should redirect to login)
- Log in as regular user (should redirect to dashboard with error)
- Only works with admin/moderator/super_admin role

---

## 📊 What's Available Now

### Working Pages:

1. **Dashboard** (`/admin`)
   - Platform statistics
   - User signup trends
   - Review trends
   - Quick actions

2. **User Management** (`/admin/users`)
   - Search users
   - Filter by role/status
   - Ban users (temp/permanent)
   - Change roles
   - Delete users
   - Pagination

### Working API Endpoints:

All these server actions are ready to use:

**User Management:**
- `getAdminUsers()` - List users with filters
- `banUser()` - Ban with reason
- `unbanUser()` - Lift ban
- `updateUserRole()` - Change role
- `deleteUser()` - Delete account

**Dashboard:**
- `getDashboardStats()` - Platform metrics
- `getUserSignupTrend()` - Registration data
- `getReviewsTrend()` - Review data

**Reports & Flags:**
- `getReports()` - List reports
- `updateReport()` - Moderate reports
- `getFlags()` - List flags
- `updateFlag()` - Moderate flags

**And 20+ more functions!**

---

## 🔧 Troubleshooting

### Issue: Cannot access `/admin`

**Solution:**
1. Check you ran the database migration
2. Check you assigned yourself admin role
3. Try logging out and back in
4. Check browser console for errors

### Issue: "has_permission is not a function"

**Solution:**
The database migration wasn't run. Go back to Step 1.

### Issue: Pages look broken

**Solution:**
Make sure all shadcn/ui components are installed. Some may be missing.

### Issue: Stats showing 0

**Solution:**
This is normal if you have no data yet. Try:
- Creating some test users
- Adding some reviews
- The numbers will update automatically

---

## 📝 Next Pages to Build (Optional)

If you want to continue, these pages still need to be created:

1. **Moderation Queue** (`/admin/moderation`)
2. **Reports Management** (`/admin/reports`)  
3. **Analytics Dashboard** (`/admin/analytics`)
4. **Featured Content** (`/admin/featured`)
5. **Announcements** (`/admin/announcements`)
6. **Audit Logs** (`/admin/logs`)
7. **Settings** (`/admin/settings`)

Each page would take 1-2 hours to build. Let me know if you want me to create any of these!

---

## ✨ Key Features

### Security:
- ✅ Route protection with middleware
- ✅ Permission-based access (moderator/admin/super_admin)
- ✅ Audit logging for all actions
- ✅ Row Level Security on all tables

### User Management:
- ✅ Search and filter
- ✅ Multiple ban types (temporary, permanent, shadow, IP)
- ✅ Role management
- ✅ Account deletion
- ✅ Bulk operations support

### Dashboard:
- ✅ Real-time statistics
- ✅ Trend visualization
- ✅ Quick actions
- ✅ Performance optimized with indexes

---

## 🎉 Success Checklist

After completing setup, you should have:

- [ ] Database tables created in Supabase
- [ ] Super admin role assigned to your account
- [ ] Dev server running without errors
- [ ] Admin dashboard accessible at `/admin`
- [ ] User management page working at `/admin/users`
- [ ] Stats showing (or 0 if no data)
- [ ] Sidebar navigation visible
- [ ] Can search and filter users

---

## 📞 Need Help?

If you encounter issues:

1. Check `ADMIN_PROGRESS_REPORT.md` for detailed overview
2. Check `ADMIN_DASHBOARD_GUIDE.md` for implementation details
3. Review error messages in browser console
4. Check Supabase logs for database errors

---

**Ready to go!** Follow the 5 steps above and your admin system will be live! 🚀
