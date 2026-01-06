# 🚀 CineVerse Deployment Guide

Complete guide to deploy CineVerse to production using Vercel and Supabase.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Vercel account ([vercel.com](https://vercel.com))
- ✅ Supabase account ([supabase.com](https://supabase.com))
- ✅ TMDB API key (already configured)
- ✅ All code committed to GitHub

---

## 🗄️ Part 1: Deploy Database to Supabase

### Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: `CineVerse`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 2: Get Supabase Credentials

1. In your Supabase dashboard, click **"Settings"** (gear icon)
2. Go to **"API"** section
3. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (keep this secret!)
   ```

### Step 3: Deploy Database Schema

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"**
3. Open your local file: `supabase/COMPLETE_CINEVERSE_SCHEMA.sql`
4. Copy **ALL content** (Ctrl+A → Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Wait for execution to complete (~30-60 seconds)
8. You should see: ✅ "Success. No rows returned"

### Step 4: Verify Database Setup

1. Click **"Table Editor"** in left sidebar
2. Verify these tables exist:
   - ✅ users
   - ✅ movies
   - ✅ reviews
   - ✅ channels
   - ✅ posts
   - ✅ comments
   - ✅ user_stats
   - ✅ badges
   - ✅ achievements
   - ✅ (30+ more tables)

3. Click **"Database"** → **"Triggers"**
4. Verify these triggers exist:
   - ✅ on_auth_user_created
   - ✅ on_user_stats_created
   - ✅ update_channel_member_count
   - ✅ update_post_comment_count
   - ✅ update_vote_counts

### Step 5: Configure Supabase Auth

1. Go to **"Authentication"** → **"URL Configuration"**
2. Set **Site URL**: `https://your-app.vercel.app` (we'll update this after Vercel deployment)
3. Add **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/auth/login
   https://your-app.vercel.app/
   ```

4. Go to **"Authentication"** → **"Providers"**
5. Enable **Email** provider (should be enabled by default)
6. (Optional) Enable **Google** and **GitHub** OAuth:
   - For Google: Add OAuth Client ID and Secret
   - For GitHub: Add OAuth App credentials

### Step 6: Refresh Schema Cache

1. Go back to **"SQL Editor"**
2. Run this command:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
3. Click **"Run"**

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Push Code to GitHub

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Verify on GitHub:**
   - Go to your repository on GitHub
   - Ensure all files are pushed

### Step 2: Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your **CineVerse** repository
5. Click **"Import"**

### Step 3: Configure Build Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset**: `Next.js`
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: `18.x` (or latest LTS)

### Step 4: Add Environment Variables

Click **"Environment Variables"** section and add:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Site URL (update after first deployment)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# TMDB API (already configured)
NEXT_PUBLIC_TMDB_API_KEY=504f6a520a9012745047291735b07cac
TMDB_API_KEY=504f6a520a9012745047291735b07cac

# Optional: Google Maps (for theater locations)
# GOOGLE_MAPS_API_KEY=your_google_maps_key

# Optional: Twitter/X Integration
# TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Optional: Gemini AI (for recommendations)
# GEMINI_API_KEY=your_gemini_api_key
```

**Important:** 
- Replace `xxxxxxxxxxxxx.supabase.co` with your actual Supabase URL
- Replace `your_supabase_anon_key_here` with your actual anon key
- For each environment variable, select **"Production"**, **"Preview"**, and **"Development"**

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. You'll see: 🎉 **"Congratulations! Your project is live!"**
4. Click **"Visit"** to see your deployed app

### Step 6: Update Supabase URLs

1. Copy your Vercel deployment URL (e.g., `https://cineverse-xyz.vercel.app`)
2. Go back to **Supabase Dashboard**
3. Go to **"Authentication"** → **"URL Configuration"**
4. Update **Site URL** to your Vercel URL
5. Update **Redirect URLs**:
   ```
   https://cineverse-xyz.vercel.app/auth/callback
   https://cineverse-xyz.vercel.app/auth/login
   https://cineverse-xyz.vercel.app/
   ```

### Step 7: Update Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your project → **"Settings"** → **"Environment Variables"**
2. Update `NEXT_PUBLIC_SITE_URL` to your actual Vercel URL
3. Click **"Save"**
4. Go to **"Deployments"** tab
5. Click **"Redeploy"** on the latest deployment

---

## ✅ Part 3: Verify Deployment

### Test Database Connection

1. Visit your deployed app: `https://your-app.vercel.app`
2. Click **"Sign Up"**
3. Create a test account
4. Go to Supabase → **"Authentication"** → **"Users"**
5. Verify new user appears ✅

### Test Features

- ✅ User registration and login
- ✅ Browse movies (TMDB integration)
- ✅ Submit reviews
- ✅ Create posts in channels
- ✅ Comment on posts
- ✅ Upvote/downvote system
- ✅ Watchlist functionality
- ✅ Dark mode toggle

### Check for Errors

1. In Vercel Dashboard, click **"Runtime Logs"**
2. Look for any error messages
3. In Supabase Dashboard, click **"Logs"** → **"Postgres Logs"**
4. Check for any database errors

---

## 🔧 Part 4: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel Dashboard, go to **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter your domain (e.g., `cineverse.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5 minutes - 48 hours)

### Update Supabase URLs Again

1. After domain is active, go to Supabase
2. Update **Site URL** to: `https://cineverse.com`
3. Update **Redirect URLs** to use your custom domain
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables

---

## 🚨 Troubleshooting

### Build Fails on Vercel

**Error**: `Type errors in production build`
```bash
# Run locally to check errors:
npm run build
```
Fix TypeScript errors before deploying.

### Database Connection Errors

**Error**: `Invalid Supabase credentials`
- Double-check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure they're set for all environments (Production, Preview, Development)
- Redeploy after updating environment variables

### Authentication Not Working

**Error**: `Auth redirect not working`
- Verify redirect URLs in Supabase match your deployment URL
- Check that `NEXT_PUBLIC_SITE_URL` matches your actual domain
- Clear browser cache and cookies

### Missing Tables/Triggers

**Error**: `Table does not exist`
- Go to Supabase SQL Editor
- Re-run `COMPLETE_CINEVERSE_SCHEMA.sql`
- Run `NOTIFY pgrst, 'reload schema';`

### TMDB Movies Not Loading

**Error**: `Failed to fetch movies`
- Verify `NEXT_PUBLIC_TMDB_API_KEY` is set in Vercel
- Check TMDB API status at [status.themoviedb.org](https://status.themoviedb.org)

---

## 📊 Monitoring & Analytics

### Vercel Analytics

1. In Vercel Dashboard, go to **"Analytics"**
2. Enable **Web Analytics** (free)
3. View page views, top pages, and performance metrics

### Supabase Monitoring

1. In Supabase Dashboard, go to **"Reports"**
2. Monitor:
   - Database size
   - API requests
   - Auth users
   - Query performance

### PostHog Analytics (Optional)

Your app already has PostHog configured. To enable:

1. Sign up at [posthog.com](https://posthog.com)
2. Get your Project API Key
3. Add to Vercel environment variables:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

---

## 🔒 Security Checklist

- ✅ Never commit `.env.local` to Git
- ✅ Use environment variables for all secrets
- ✅ Keep `service_role` key secret (never expose to frontend)
- ✅ Enable Row Level Security (RLS) on all tables ✅ (already done!)
- ✅ Configure CORS properly in Supabase
- ✅ Use HTTPS only (Vercel does this automatically)
- ✅ Enable rate limiting for API routes
- ✅ Regularly update dependencies: `npm audit`

---

## 🎯 Performance Optimization

### Enable Vercel Caching

Add to `next.config.js`:
```javascript
module.exports = {
  // ... existing config
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ],
};
```

### Optimize Images

Vercel automatically optimizes images with Next.js Image component (already used in your project ✅)

### Enable Edge Functions (Optional)

For faster global response times, convert some API routes to Edge Functions.

---

## 📈 Scaling Considerations

### When to Upgrade Supabase

**Free Tier Limits:**
- 500 MB database
- 2 GB bandwidth
- 50,000 monthly active users

**Upgrade if:**
- Database > 400 MB
- > 40,000 MAUs
- Need more compute resources

### When to Upgrade Vercel

**Hobby Plan (Free) Limits:**
- 100 GB bandwidth/month
- Unlimited deployments
- 1 concurrent build

**Upgrade to Pro if:**
- > 80 GB bandwidth/month
- Need team collaboration
- Require advanced analytics

---

## 🎉 Post-Deployment Tasks

### 1. Populate Default Data

Your schema already includes default data (11 channels, 5 badges, etc.). Verify in Supabase Table Editor.

### 2. Test Admin Features

1. Create an admin account
2. Test user management
3. Verify moderation features work

### 3. Set Up Monitoring Alerts

Configure alerts for:
- Database size threshold
- Error rate spike
- Authentication failures

### 4. Create Backup Strategy

1. Enable Supabase daily backups (automatic on paid plans)
2. Export critical data periodically
3. Document restore procedures

---

## 📞 Support Resources

- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **TMDB API**: [developers.themoviedb.org](https://developers.themoviedb.org)

---

## ✨ Congratulations!

Your CineVerse app is now live! 🎬

**Next Steps:**
1. Share your deployment URL
2. Invite users to test
3. Monitor analytics
4. Iterate based on feedback

**Your deployment URLs:**
- Frontend: `https://your-app.vercel.app`
- Database: `https://xxxxxxxxxxxxx.supabase.co`
- TMDB API: Active and configured ✅

Happy movie reviewing! 🍿
