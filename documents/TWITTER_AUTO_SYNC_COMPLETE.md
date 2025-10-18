# 🐦 Twitter Auto-Sync for Movie Discussions - Complete Guide

## 🎯 Feature Overview

Automatically fetch latest tweets from movie-related X/Twitter accounts and post them as discussions in your channels!

### ✨ What This Does:

1. **Auto-Fetch Tweets** - Monitors Twitter accounts you configure
2. **Create Posts** - Automatically converts tweets into channel posts
3. **Prevent Duplicates** - Tracks posted tweets to avoid reposting
4. **Format Nicely** - Preserves tweet formatting, links, and metadata
5. **Scheduled Sync** - Runs periodically via cron job
6. **Manual Trigger** - Admins can manually sync anytime

## 📁 Files Created

### Core Library:
1. **`lib/twitter/auto-sync.ts`** - Twitter API integration
   - Fetch tweets from user timelines
   - Search tweets by hashtag/keyword
   - Format tweet text
   - Convert tweets to post format

### Server Actions:
2. **`app/actions/twitter-sync.ts`** - Sync logic
   - `syncChannelTweets()` - Sync specific channel
   - `syncAllChannels()` - Sync all configured channels
   - `createPostFromTweet()` - Create post from tweet
   - `toggleTwitterSync()` - Enable/disable sync
   - `manualSyncTweets()` - Manual trigger for admins

### API Routes:
3. **`app/api/cron/twitter-sync/route.ts`** - Cron endpoint
   - POST /api/cron/twitter-sync - Trigger sync
   - GET /api/cron/twitter-sync - Status check
   - Secured with CRON_SECRET

### UI Components:
4. **`components/channels/twitter-sync-settings.tsx`** - Admin UI
   - Enable/disable auto-sync
   - View sync status
   - Manual sync button
   - Setup instructions

### Database:
5. **`supabase/twitter_sync_migration.sql`** - Schema changes
   - `twitter_sync_enabled` - Enable/disable per channel
   - `last_synced_tweet_id` - Track last synced tweet
   - `last_sync_at` - Timestamp of last sync
   - `metadata` - JSONB for tweet data in posts

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install twitter-api-v2 @radix-ui/react-switch
```

### Step 2: Get Twitter API Credentials

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app (or use existing)
3. Generate Bearer Token
4. Copy the token

### Step 3: Add Environment Variables

In `.env.local`:

```bash
# Twitter API (Required for auto-sync)
TWITTER_BEARER_TOKEN=your_bearer_token_here

# Cron Job Security (Required for automated sync)
CRON_SECRET=your-random-secret-key-here
```

**Generate a secure CRON_SECRET:**
```bash
# In terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Run Database Migration

In Supabase SQL Editor, run:

```sql
-- Copy content from supabase/twitter_sync_migration.sql
-- This adds:
-- - twitter_sync_enabled column
-- - last_synced_tweet_id column
-- - last_sync_at column
-- - metadata column to posts table
```

### Step 5: Configure Channels

For each channel you want to auto-sync:

1. Go to channel settings (moderator access required)
2. Add Twitter handle to channel (e.g., "MarvelStudios")
3. Enable Twitter Auto-Sync toggle
4. Click "Sync Now" to test

### Step 6: Setup Cron Job (Optional)

**Option A: Vercel Cron (Recommended)**

In `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/twitter-sync",
    "schedule": "0 */6 * * *"
  }]
}
```

**Option B: External Cron Service**

Use services like cron-job.org or EasyCron:
- URL: `https://your-domain.com/api/cron/twitter-sync`
- Method: POST
- Headers: `Authorization: Bearer your-cron-secret`
- Schedule: Every 6 hours

**Option C: GitHub Actions**

Create `.github/workflows/twitter-sync.yml`:
```yaml
name: Twitter Sync
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Twitter Sync
        run: |
          curl -X POST https://your-domain.com/api/cron/twitter-sync \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 🎨 How It Works

### 1. Tweet Fetching Flow

```
Twitter API → fetch latest tweets
    ↓
Check against last_synced_tweet_id
    ↓
Get only new tweets (not previously synced)
    ↓
Return array of TweetData objects
```

### 2. Post Creation Flow

```
TweetData object
    ↓
Format tweet text (expand URLs, etc.)
    ↓
Extract metadata (likes, retweets, etc.)
    ↓
Create post in database
    ↓
Update last_synced_tweet_id
    ↓
Revalidate channel page
```

### 3. Duplicate Prevention

```
Before creating post:
1. Check if tweet_id exists in posts.metadata
2. If exists → Skip (return existing post ID)
3. If not exists → Create new post
4. Store tweet_id in metadata JSONB field
```

## 📝 Usage Examples

### Example 1: Enable Sync for a Channel

```typescript
import { toggleTwitterSync } from '@/app/actions/twitter-sync'

// Enable sync
const result = await toggleTwitterSync('marvel-movies', true)
// { success: true, message: "Twitter sync enabled for marvel-movies" }

// Disable sync
const result = await toggleTwitterSync('marvel-movies', false)
// { success: true, message: "Twitter sync disabled for marvel-movies" }
```

### Example 2: Manual Sync

```typescript
import { manualSyncTweets } from '@/app/actions/twitter-sync'

// Sync specific channel
const result = await manualSyncTweets('marvel-movies')
// { success: true, postsCreated: 3, totalTweets: 5, message: "Created 3 posts from 5 tweets" }

// Sync all channels
const result = await manualSyncTweets()
// { success: true, channelsSynced: 5, totalPosts: 12, results: [...] }
```

### Example 3: Fetch Tweets Directly

```typescript
import { fetchUserTweets, searchTweets } from '@/lib/twitter/auto-sync'

// Fetch from specific user
const tweets = await fetchUserTweets('MarvelStudios', 10)
// Returns TweetData[] with up to 10 tweets

// Search by keyword
const tweets = await searchTweets('#MCU OR #Marvel', 20)
// Returns TweetData[] matching search
```

## 🎬 Popular Movie Twitter Accounts

Configure these accounts for best results:

### Studios:
- `@MarvelStudios` → Marvel/MCU Channel
- `@DCOfficial` → DC Movies Channel
- `@warnerbros` → Warner Bros Channel
- `@paramountpics` → Paramount Channel
- `@SonyPictures` → Sony Channel
- `@UniversalPics` → Universal Channel
- `@DisneyStudios` → Disney Channel

### News & Critics:
- `@Variety` → Movie News Channel
- `@THR` → Entertainment News Channel
- `@Deadline` → Industry News Channel
- `@RollingStone` → Entertainment Channel
- `@empiremagazine` → Movie Magazine Channel

### Streaming:
- `@NetflixFilm` → Netflix Movies Channel
- `@PrimeVideo` → Prime Video Channel
- `@hulu` → Hulu Channel
- `@DisneyPlus` → Disney+ Channel

## 🔧 Configuration Options

### Channel-Level Settings:

```typescript
// In Supabase channels table:
{
  twitter_handle: 'MarvelStudios',      // Twitter username to follow
  twitter_sync_enabled: true,           // Enable/disable sync
  last_synced_tweet_id: '1234567890',   // Last tweet processed
  last_sync_at: '2025-01-01T00:00:00Z', // Last sync timestamp
  tmdb_id: 299536                       // Optional: Link to TMDB entity
}
```

### System-Wide Settings:

```bash
# .env.local
TWITTER_BEARER_TOKEN=xxx              # Required for Twitter API
CRON_SECRET=xxx                       # Required for cron endpoint
```

## 📊 Post Format

When a tweet is converted to a post:

```markdown
Title: 🐦 [First line or first 100 chars of tweet]

Content:
[Full tweet text with expanded URLs]

---
📱 Source: [@username](https://twitter.com/username/status/123)
❤️ 1.2K likes • 🔄 345 retweets

Flair: News

Metadata (JSON):
{
  "source": "twitter",
  "tweet_id": "1234567890",
  "author_username": "MarvelStudios",
  "created_at": "2025-01-01T00:00:00Z"
}
```

## 🚨 Troubleshooting

### Issue: No tweets being synced

**Solutions:**
1. Check `TWITTER_BEARER_TOKEN` is set correctly
2. Verify Twitter account exists and is public
3. Check `twitter_sync_enabled` is true for channel
4. Ensure channel has `twitter_handle` set
5. Check console logs for errors

### Issue: Duplicate posts appearing

**Solutions:**
1. Run database migration to add metadata column
2. Verify `last_synced_tweet_id` is being updated
3. Check duplicate detection logic in createPostFromTweet()

### Issue: Cron job not running

**Solutions:**
1. Verify `CRON_SECRET` matches in .env and cron service
2. Check cron service is configured correctly
3. Test endpoint manually: `curl -X POST url -H "Authorization: Bearer secret"`
4. Check Vercel/hosting logs for cron execution

### Issue: "Unauthorized" error

**Solutions:**
1. For manual sync: User must be admin/moderator
2. For cron: Check Authorization header includes correct Bearer token
3. Verify user has permission on specific channel

## 🎯 Testing

### Test 1: Manual Sync via UI
1. Go to channel settings
2. Make sure Twitter handle is set
3. Enable auto-sync toggle
4. Click "Sync Now" button
5. Check channel feed for new posts

### Test 2: API Endpoint
```bash
curl -X POST http://localhost:3000/api/cron/twitter-sync \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json" \
  -d '{"channelSlug": "marvel-movies", "maxTweets": 5}'
```

### Test 3: Server Action
```typescript
// In browser console (must be logged in as admin):
const result = await import('@/app/actions/twitter-sync')
  .then(m => m.manualSyncTweets('marvel-movies'))
console.log(result)
```

## 📈 Best Practices

1. **Start Small**: Enable sync for 1-2 channels first
2. **Monitor Rate Limits**: Twitter API has rate limits
3. **Set Reasonable Intervals**: 6 hours is good, don't go below 1 hour
4. **Review Posts**: Check auto-posted content periodically
5. **Moderate Active**: Delete spam or inappropriate auto-posts
6. **Use Flairs**: Posts auto-tagged with "News" flair
7. **Engage**: Reply to auto-posts to encourage discussion

## 🔮 Future Enhancements

Possible improvements (not yet implemented):
- [ ] Filter tweets by keywords/hashtags
- [ ] Auto-pin important tweets
- [ ] Support for tweet threads
- [ ] Include tweet images/videos
- [ ] Reply sync (sync tweet replies as comments)
- [ ] Hashtag-based channel routing
- [ ] Sentiment analysis for filtering
- [ ] Custom post templates
- [ ] Multi-account support per channel

## 💡 Use Cases

### Use Case 1: Movie Studio Channel
```
Channel: marvel-cinematic-universe
Twitter: @MarvelStudios
Result: Auto-posts Marvel announcements, trailers, behind-the-scenes
```

### Use Case 2: News Aggregation
```
Channel: movie-news
Twitter: @Variety, @THR, @Deadline (configure multiple channels)
Result: Curated movie news feed from top sources
```

### Use Case 3: Streaming Updates
```
Channel: netflix-releases
Twitter: @NetflixFilm
Result: Automatic posts about new Netflix movies
```

## ✅ Summary

**What You Get:**
- ✅ Automatic tweet-to-post conversion
- ✅ Duplicate prevention
- ✅ Admin UI for easy management
- ✅ Cron job support for automation
- ✅ Manual sync trigger
- ✅ Per-channel configuration
- ✅ Proper formatting and metadata
- ✅ Rate limit handling
- ✅ Error recovery
- ✅ Secure authentication

**Required:**
- Twitter API Bearer Token
- Supabase database migration
- Admin/moderator permissions
- Channel with Twitter handle

**Optional:**
- Cron job setup (for automation)
- Multiple channel configuration
- Custom sync intervals

**Ready to keep your movie discussions updated with the latest tweets!** 🎬🐦
