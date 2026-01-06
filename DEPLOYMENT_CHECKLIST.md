# 🚀 Quick Deployment Checklist

Use this checklist to ensure smooth deployment of CineVerse.

---

## ☑️ Pre-Deployment Checklist

### Code Ready
- [ ] All features tested locally
- [ ] No TypeScript errors: `npm run build`
- [ ] No console errors in browser
- [ ] Dark mode works properly
- [ ] Authentication flows tested
- [ ] All environment variables documented

### Git Repository
- [ ] All code committed
- [ ] `.env.local` added to `.gitignore` ✅
- [ ] `node_modules` in `.gitignore` ✅
- [ ] Pushed to GitHub
- [ ] Repository is public or accessible to Vercel

### Database Schema
- [ ] `COMPLETE_CINEVERSE_SCHEMA.sql` is complete ✅
- [ ] Schema file is tested locally
- [ ] All RLS policies defined ✅
- [ ] Triggers are functional ✅

---

## 🗄️ Supabase Setup Checklist

### Project Creation
- [ ] Supabase account created
- [ ] New project created
- [ ] Project region selected
- [ ] Database password saved securely

### Credentials Collected
- [ ] Project URL copied
- [ ] `anon` key copied
- [ ] `service_role` key copied (keep secret!)

### Database Deployment
- [ ] Schema SQL file pasted in SQL Editor
- [ ] Schema executed successfully
- [ ] Tables verified (30+ tables)
- [ ] Triggers verified (6 triggers)
- [ ] Default data inserted (channels, badges, etc.)
- [ ] Schema cache refreshed: `NOTIFY pgrst, 'reload schema'`

### Authentication Configuration
- [ ] Site URL set (will update after Vercel deployment)
- [ ] Redirect URLs configured
- [ ] Email provider enabled
- [ ] OAuth providers configured (optional)

---

## 🌐 Vercel Deployment Checklist

### Account Setup
- [ ] Vercel account created
- [ ] GitHub connected to Vercel

### Project Import
- [ ] Repository imported
- [ ] Framework detected as Next.js
- [ ] Build settings verified

### Environment Variables Set
- [ ] `NEXT_PUBLIC_SUPABASE_URL` ✅
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- [ ] `NEXT_PUBLIC_SITE_URL` (will update)
- [ ] `NEXT_PUBLIC_TMDB_API_KEY` ✅
- [ ] `TMDB_API_KEY` ✅
- [ ] Variables set for Production, Preview, Development

### First Deployment
- [ ] Clicked "Deploy"
- [ ] Build completed successfully
- [ ] No build errors
- [ ] Deployment URL received

### Post-Deployment Configuration
- [ ] Vercel URL copied
- [ ] Supabase Site URL updated with Vercel URL
- [ ] Supabase Redirect URLs updated
- [ ] `NEXT_PUBLIC_SITE_URL` updated in Vercel
- [ ] Redeployed after environment variable update

---

## ✅ Verification Checklist

### Frontend Tests
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Login works
- [ ] Movies display (TMDB integration)
- [ ] Dashboard accessible
- [ ] Dark mode toggle works
- [ ] Navigation works

### Database Tests
- [ ] New user appears in Supabase
- [ ] User profile created automatically
- [ ] User stats initialized
- [ ] Reviews can be submitted
- [ ] Posts can be created
- [ ] Comments can be added
- [ ] Votes work (upvote/downvote)

### Features Tests
- [ ] Channels page loads
- [ ] Individual channel page works
- [ ] Post creation works
- [ ] Comment creation works
- [ ] Watchlist add/remove works
- [ ] Favorites add/remove works
- [ ] Profile page displays
- [ ] Settings page works

### Performance Checks
- [ ] Page load time < 3s
- [ ] No console errors
- [ ] No network errors (check DevTools)
- [ ] Images load properly
- [ ] API calls successful

---

## 🔧 Common Issues & Solutions

### Build Errors

**Issue**: TypeScript errors during build
```bash
# Solution: Run locally first
npm run build

# Fix all type errors, then redeploy
```

**Issue**: Module not found
```bash
# Solution: Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Database Errors

**Issue**: "Table does not exist"
```sql
-- Solution: Re-run schema in Supabase SQL Editor
-- Then refresh:
NOTIFY pgrst, 'reload schema';
```

**Issue**: "Row-level security policy violation"
```sql
-- Solution: Check RLS policies are enabled
-- Verify user authentication is working
```

### Auth Errors

**Issue**: "Auth redirect not working"
```
Solution:
1. Check Supabase redirect URLs match Vercel URL exactly
2. Verify NEXT_PUBLIC_SITE_URL is correct
3. Clear browser cookies and cache
```

**Issue**: "Invalid credentials"
```
Solution:
1. Verify NEXT_PUBLIC_SUPABASE_URL is correct
2. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
3. Check they're set in Vercel environment variables
4. Redeploy after fixing
```

---

## 📊 Monitoring Setup

### Immediate (Free)
- [ ] Enable Vercel Analytics
- [ ] Check Vercel Runtime Logs
- [ ] Monitor Supabase Dashboard
- [ ] Check Supabase Auth users

### Recommended
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Enable PostHog analytics

---

## 🎯 Post-Launch Tasks

### Week 1
- [ ] Monitor error logs daily
- [ ] Check user signups
- [ ] Verify all features working
- [ ] Gather initial feedback
- [ ] Fix critical bugs

### Week 2-4
- [ ] Analyze user behavior
- [ ] Optimize slow queries
- [ ] Improve performance
- [ ] Add requested features
- [ ] Update documentation

---

## 📝 Deployment Summary Template

Use this template to document your deployment:

```
===========================================
CineVerse Deployment Summary
===========================================

Deployment Date: ___________
Deployed By: ___________

Frontend URL: https://_____________________.vercel.app
Custom Domain: https://_____________________ (if applicable)

Supabase Project: _____________________
Database Region: _____________________

Environment:
- Node Version: 18.x
- Next.js Version: 14.2.33
- Vercel Plan: Hobby (Free) / Pro
- Supabase Plan: Free / Pro

Features Deployed:
✅ User Authentication
✅ Movie Browsing (TMDB)
✅ Review System
✅ Channels & Posts
✅ Comments & Voting
✅ Gamification (Karma, Badges)
✅ Theater Booking
✅ Watchlist & Favorites
✅ Dark Mode
✅ Responsive Design

Known Issues:
- (list any known issues)

Next Steps:
1. (your next steps)
2. 
3. 

Notes:
___________________________________________
___________________________________________
===========================================
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ **All checks pass:**
- Frontend loads without errors
- Users can sign up and log in
- Database connections work
- All features functional
- Performance is acceptable
- Mobile responsive

✅ **Users can:**
- Browse movies
- Submit reviews
- Create posts
- Comment on posts
- Vote on content
- Build watchlists
- Earn karma and badges

✅ **Monitoring shows:**
- No critical errors
- Acceptable response times
- Users successfully authenticating
- Database operations completing

---

## 📞 Need Help?

If you encounter issues:

1. **Check the logs:**
   - Vercel: Runtime Logs
   - Supabase: Logs → Postgres Logs

2. **Review documentation:**
   - `DEPLOYMENT_GUIDE.md` (detailed guide)
   - `README.md` (project overview)
   - `DATABASE_SCHEMA.md` (database reference)

3. **Common solutions:**
   - Clear cache: `.next` folder
   - Reinstall: `rm -rf node_modules && npm install`
   - Redeploy: Vercel dashboard → Redeploy

4. **Still stuck?**
   - Check Vercel documentation
   - Check Supabase documentation
   - Review error messages carefully
   - Search error on Stack Overflow

---

**Ready to deploy? Start with Step 1 in `DEPLOYMENT_GUIDE.md`!** 🚀
