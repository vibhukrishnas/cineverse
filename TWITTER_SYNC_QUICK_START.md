# 🚀 Quick Start: Twitter Auto-Sync

## ⚡ 5-Minute Setup

### Step 1: Install Package (30 seconds)
```bash
npm install twitter-api-v2
```

### Step 2: Get Twitter API Key (2 minutes)
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create app → Get Bearer Token
3. Copy the token

### Step 3: Add to Environment (30 seconds)
Create or edit `.env.local`:
```bash
TWITTER_BEARER_TOKEN=paste_your_token_here
CRON_SECRET=any-random-secret-key
```

### Step 4: Run Database Migration (1 minute)
1. Open Supabase SQL Editor
2. Paste content from `supabase/twitter_sync_migration.sql`
3. Click Run

### Step 5: Configure Channel (1 minute)
1. Go to any channel (e.g., `/channel/general`)
2. Edit channel settings (need moderator access)
3. Add Twitter handle (e.g., "MarvelStudios")
4. Enable "Twitter Auto-Sync" toggle
5. Click "Sync Now" to test

## ✅ Done!

Tweets from @MarvelStudios will now automatically post to your channel!

## 🎯 Next Steps

### Setup Automation (Optional):
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/twitter-sync",
    "schedule": "0 */6 * * *"
  }]
}
```

### Configure More Channels:
- `@NetflixFilm` → Netflix channel
- `@DCOfficial` → DC Movies channel
- `@Variety` → Movie News channel

## 📝 Quick Test

**Manual Sync:**
1. Go to channel with Twitter handle
2. Open settings
3. Click "Sync Now"
4. Check channel feed!

**Check Logs:**
```bash
# Development
npm run dev

# Check console for:
🐦 Fetching tweets from @username
✅ Fetched X tweets
✅ Created post from tweet
```

## 🐛 Troubleshooting

**No tweets syncing?**
- Check TWITTER_BEARER_TOKEN is correct
- Verify Twitter account is public
- Enable sync toggle in channel settings

**Duplicates?**
- Run database migration again
- Check posts.metadata column exists

## 📚 Full Documentation

See `documents/TWITTER_AUTO_SYNC_COMPLETE.md` for:
- Complete setup guide
- API documentation
- Advanced configuration
- Troubleshooting
- Best practices

## 🎬 Popular Accounts to Follow

- `@MarvelStudios` - Marvel/MCU
- `@DCOfficial` - DC Movies
- `@NetflixFilm` - Netflix Movies
- `@Variety` - Movie News
- `@DisneyStudios` - Disney Movies

**That's it! Your channels will now auto-update with latest tweets!** 🎉
