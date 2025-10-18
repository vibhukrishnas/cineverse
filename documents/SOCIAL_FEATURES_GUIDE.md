# CineVerse Social Features - Complete Guide

## 🎉 Overview

The social features system transforms CineVerse into a fully interactive social platform where users can follow each other, receive notifications, and see activity feeds of their connections. This guide covers everything you need to know about the social features implementation.

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Setup Instructions](#setup-instructions)
5. [Components](#components)
6. [Server Actions](#server-actions)
7. [Usage Examples](#usage-examples)
8. [Real-time Features](#real-time-features)
9. [API Integration](#api-integration)
10. [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Follow System
- ✅ Follow/unfollow users with optimistic updates
- ✅ View followers and following lists
- ✅ Get follow statistics (followers count, following count)
- ✅ Suggested users based on activity
- ✅ Prevent self-following
- ✅ Duplicate follow prevention

### Notification System
- ✅ Real-time notifications for:
  - New followers
  - Review likes
  - Review helpful marks
  - (Extensible for comments, mentions, etc.)
- ✅ Notification bell with unread count
- ✅ Mark as read functionality
- ✅ Mark all as read
- ✅ Delete notifications
- ✅ Clear read notifications
- ✅ Unread/All tabs
- ✅ Automatic notification creation via database triggers

### Social Feed
- ✅ Following feed (activity from followed users)
- ✅ Discover feed (popular content from all users)
- ✅ Infinite scroll pagination
- ✅ Review activity display
- ✅ Social media posts integration (prepared)
- ✅ Follow activity tracking
- ✅ Rich content display with movie posters

### Social Media Integration (Prepared)
- 🔄 Twitter/X post fetching (placeholder)
- 🔄 YouTube video integration (placeholder)
- 🔄 Instagram post integration (placeholder)
- ✅ Social posts database schema ready
- ✅ Social post display components ready

---

## 🏗️ Architecture

### Database Layer
```
supabase/
├── users_schema.sql          # User profiles (prerequisite)
├── reviews_schema.sql        # Review system (prerequisite)
└── social_schema.sql         # Social features (NEW)
    ├── follows               # Follow relationships
    ├── notifications         # User notifications
    ├── social_posts          # Cached social media posts
    └── user_online_status    # Real-time presence
```

### Server Actions Layer
```
app/actions/
├── follows.ts               # Follow/unfollow operations
├── notifications.ts         # Notification management
└── feed.ts                  # Feed generation
```

### Components Layer
```
components/
├── social/
│   ├── follow-button.tsx        # Follow/unfollow button
│   ├── user-card.tsx            # User profile card
│   ├── follow-list.tsx          # Followers/following tabs
│   └── suggested-users.tsx      # User suggestions
├── notifications/
│   ├── notification-bell.tsx    # Header notification bell
│   ├── notification-item.tsx    # Single notification
│   └── notifications-list.tsx   # Full notifications page
└── feed/
    ├── feed-item.tsx            # Single feed item
    └── feed-list.tsx            # Feed with infinite scroll
```

### Pages
```
app/
├── feed/page.tsx               # Social feed page
└── notifications/page.tsx      # Notifications page
```

---

## 🗄️ Database Schema

### 1. Follows Table
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```

**Indexes:**
- `idx_follows_follower` on `follower_id`
- `idx_follows_following` on `following_id`
- `idx_follows_composite` on `(follower_id, following_id)`

**RLS Policies:**
- Public read access
- Users can only create their own follows
- Users can only delete their own follows

### 2. Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Notification Types:**
- `follow` - New follower
- `review_like` - Someone liked your review
- `review_helpful` - Someone marked your review as helpful
- `review_comment` - New comment (future)
- `mention` - Mentioned in review/comment (future)

**Indexes:**
- `idx_notifications_user` on `user_id`
- `idx_notifications_unread` on `(user_id, is_read)`
- `idx_notifications_created` on `created_at`

**RLS Policies:**
- Users can only read their own notifications
- Users can only update/delete their own notifications

### 3. Social Posts Table
```sql
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'youtube', 'instagram')),
  post_id TEXT NOT NULL,
  movie_id INTEGER,
  content TEXT,
  media_url TEXT,
  author_name TEXT,
  author_handle TEXT,
  author_avatar TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, post_id)
);
```

**Indexes:**
- `idx_social_posts_platform` on `platform`
- `idx_social_posts_movie` on `movie_id`
- `idx_social_posts_created` on `created_at`

**RLS Policies:**
- Public read access
- Insert/update restricted (admin only in future)

### 4. User Online Status Table
```sql
CREATE TABLE user_online_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_user_online_status_online` on `is_online`

**RLS Policies:**
- Public read access
- Users can only update their own status

---

## 🚀 Setup Instructions

### Step 1: Run Database Migrations

**Important:** Run migrations in this exact order!

```bash
# 1. Users table (if not already created)
psql -U postgres -d cineverse -f supabase/users_schema.sql

# 2. Reviews system (if not already created)
psql -U postgres -d cineverse -f supabase/reviews_schema.sql

# 3. Social features (NEW)
psql -U postgres -d cineverse -f supabase/social_schema.sql
```

**Using Supabase Dashboard:**
1. Go to SQL Editor
2. Copy content from `supabase/social_schema.sql`
3. Run the SQL
4. Verify all tables created successfully

### Step 2: Verify Tables

Check that all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('follows', 'notifications', 'social_posts', 'user_online_status');
```

### Step 3: Test Triggers

The schema includes automatic triggers for notifications:

**Test Follow Notification:**
```sql
-- Follow a user (replace UUIDs with actual user IDs)
INSERT INTO follows (follower_id, following_id)
VALUES ('user-1-id', 'user-2-id');

-- Check if notification was created
SELECT * FROM notifications WHERE user_id = 'user-2-id' AND type = 'follow';
```

**Test Review Like Notification:**
```sql
-- Like a review
INSERT INTO review_likes (user_id, review_id)
VALUES ('user-1-id', 'review-id');

-- Check if notification was created
SELECT * FROM notifications WHERE type = 'review_like';
```

### Step 4: Update Navigation

The navigation has been updated in `app/dashboard/layout.tsx` to include:
- Feed link
- Notifications link
- Notification bell with unread count

### Step 5: Environment Variables (Optional for Social Media)

If you want to enable social media integration in the future:

```env
# .env.local
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
YOUTUBE_API_KEY=your_youtube_api_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
```

---

## 🧩 Components

### Follow Button
```tsx
import { FollowButton } from '@/components/social/follow-button'

<FollowButton
  userId="user-id"
  initialIsFollowing={false}
  size="default"
  variant="default"
  showIcon={true}
  onFollowChange={(isFollowing) => console.log('Follow state:', isFollowing)}
/>
```

### User Card
```tsx
import { UserCard } from '@/components/social/user-card'

<UserCard
  user={userProfile}
  showFollowButton={true}
  showBio={true}
  showStats={false}
/>
```

### Follow List
```tsx
import { FollowList } from '@/components/social/follow-list'

<FollowList
  userId="user-id"
  initialTab="followers" // or "following"
/>
```

### Suggested Users
```tsx
import { SuggestedUsers } from '@/components/social/suggested-users'

<SuggestedUsers
  limit={5}
  title="Who to follow"
/>
```

### Notification Bell
```tsx
import { NotificationBell } from '@/components/notifications/notification-bell'

<NotificationBell />
```

### Notifications List
```tsx
import { NotificationsList } from '@/components/notifications/notifications-list'

<NotificationsList />
```

### Feed List
```tsx
import { FeedList } from '@/components/feed/feed-list'

<FeedList />
```

---

## ⚡ Server Actions

### Follow Actions

#### Follow User
```typescript
import { followUser } from '@/app/actions/follows'

const result = await followUser('user-id')
if (result.success) {
  console.log('Followed successfully')
} else {
  console.error(result.error)
}
```

#### Unfollow User
```typescript
import { unfollowUser } from '@/app/actions/follows'

const result = await unfollowUser('user-id')
```

#### Get Followers
```typescript
import { getFollowers } from '@/app/actions/follows'

const result = await getFollowers('user-id', 50, 0)
if (result.success) {
  console.log('Followers:', result.followers)
}
```

#### Get Following
```typescript
import { getFollowing } from '@/app/actions/follows'

const result = await getFollowing('user-id', 50, 0)
```

#### Get Follow Stats
```typescript
import { getFollowStats } from '@/app/actions/follows'

const stats = await getFollowStats('user-id')
console.log('Followers:', stats.followersCount)
console.log('Following:', stats.followingCount)
console.log('Is following:', stats.isFollowing)
```

#### Get Suggested Users
```typescript
import { getSuggestedUsers } from '@/app/actions/follows'

const result = await getSuggestedUsers(10)
if (result.success) {
  console.log('Suggestions:', result.users)
}
```

### Notification Actions

#### Get Notifications
```typescript
import { getNotifications } from '@/app/actions/notifications'

const result = await getNotifications(20, 0, false) // limit, offset, unreadOnly
if (result.success) {
  console.log('Notifications:', result.notifications)
  console.log('Unread count:', result.unreadCount)
}
```

#### Mark as Read
```typescript
import { markNotificationAsRead } from '@/app/actions/notifications'

await markNotificationAsRead('notification-id')
```

#### Mark All as Read
```typescript
import { markAllNotificationsAsRead } from '@/app/actions/notifications'

await markAllNotificationsAsRead()
```

#### Delete Notification
```typescript
import { deleteNotification } from '@/app/actions/notifications'

await deleteNotification('notification-id')
```

### Feed Actions

#### Get Following Feed
```typescript
import { getFollowingFeed } from '@/app/actions/feed'

const result = await getFollowingFeed(20, 0) // limit, offset
if (result.success) {
  console.log('Feed items:', result.feed)
}
```

#### Get Discover Feed
```typescript
import { getDiscoverFeed } from '@/app/actions/feed'

const result = await getDiscoverFeed(20, 0)
```

#### Get Social Posts for Movie
```typescript
import { getSocialPostsForMovie } from '@/app/actions/feed'

const result = await getSocialPostsForMovie(550, 10) // movieId, limit
```

---

## 🔴 Real-time Features

### Notification Real-time Updates

To enable real-time notifications, add this to your notification components:

```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

function useNotificationSubscription(userId: string, onNotification: (notification: any) => void) {
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotification(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onNotification])
}
```

### Online Status Real-time Updates

```typescript
function useOnlineStatus(userId: string) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Update status to online
    supabase
      .from('user_online_status')
      .upsert({ user_id: userId, is_online: true })
      .then()

    // Subscribe to status changes
    const channel = supabase
      .channel('online-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_online_status',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setIsOnline(payload.new.is_online)
        }
      )
      .subscribe()

    // Set offline on unmount
    return () => {
      supabase
        .from('user_online_status')
        .update({ is_online: false })
        .eq('user_id', userId)
        .then()
      
      supabase.removeChannel(channel)
    }
  }, [userId])

  return isOnline
}
```

---

## 🌐 API Integration

### Social Media Integration Setup

The system is prepared for social media integration. To implement:

#### Twitter/X Integration

```typescript
// lib/social/twitter.ts
import { TwitterApi } from 'twitter-api-v2'

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
})

export async function fetchTweetsAboutMovie(movieTitle: string) {
  const tweets = await client.v2.search(`${movieTitle} movie`, {
    max_results: 10,
    'tweet.fields': ['created_at', 'public_metrics'],
    'user.fields': ['profile_image_url']
  })
  
  return tweets.data.map(tweet => ({
    platform: 'twitter',
    post_id: tweet.id,
    content: tweet.text,
    author_name: tweet.author?.name,
    likes_count: tweet.public_metrics?.like_count || 0,
    // ... map other fields
  }))
}
```

#### YouTube Integration

```typescript
// lib/social/youtube.ts
export async function fetchYouTubeVideos(movieTitle: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&q=${encodeURIComponent(movieTitle + ' review')}&` +
    `type=video&key=${process.env.YOUTUBE_API_KEY}`
  )
  
  const data = await response.json()
  
  return data.items.map((item: any) => ({
    platform: 'youtube',
    post_id: item.id.videoId,
    content: item.snippet.title,
    media_url: item.snippet.thumbnails.high.url,
    // ... map other fields
  }))
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Notifications Not Creating

**Problem:** Notifications aren't being created automatically.

**Solution:**
- Verify triggers are installed:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```
- Check if the trigger function exists:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'notify_%';
```

#### 2. Follow Button Not Working

**Problem:** Follow/unfollow action fails.

**Solution:**
- Check RLS policies are enabled
- Verify user is authenticated
- Check browser console for errors
- Verify unique constraint isn't violated

#### 3. Feed Not Loading

**Problem:** Feed shows loading state forever.

**Solution:**
- Check if reviews table exists and has data
- Verify follows table has data
- Check browser console for errors
- Test the server action directly in a test page

#### 4. Notification Count Not Updating

**Problem:** Bell icon shows wrong count.

**Solution:**
- Check if polling is working (30-second interval)
- Verify getUnreadNotificationCount action works
- Check if notifications are marked as read properly
- Consider implementing real-time subscriptions

### Debug SQL Queries

#### Check Follow Relationships
```sql
SELECT 
  f.id,
  follower.username as follower_username,
  following.username as following_username,
  f.created_at
FROM follows f
JOIN users follower ON f.follower_id = follower.id
JOIN users following ON f.following_id = following.id
ORDER BY f.created_at DESC
LIMIT 10;
```

#### Check Notifications
```sql
SELECT 
  n.*,
  actor.username as actor_username
FROM notifications n
LEFT JOIN users actor ON n.actor_id = actor.id
ORDER BY n.created_at DESC
LIMIT 10;
```

#### Check Feed Data
```sql
SELECT 
  r.id,
  u.username,
  r.movie_title,
  r.rating,
  r.likes_count,
  r.created_at
FROM reviews r
JOIN users u ON r.user_id = u.id
ORDER BY r.created_at DESC
LIMIT 10;
```

---

## 📊 Performance Considerations

### Database Indexes

All critical paths are indexed:
- Follow lookups by follower/following
- Notification queries by user and read status
- Feed queries by creation date
- Social posts by platform and movie

### Pagination

All list queries support pagination:
```typescript
// Load more followers
const result = await getFollowers(userId, 50, 50) // limit: 50, offset: 50
```

### Optimistic Updates

Follow button uses optimistic updates for instant feedback:
```typescript
// Update UI immediately
setIsFollowing(!isFollowing)

// Then make API call
const result = await followUser(userId)

// Revert if failed
if (!result.success) {
  setIsFollowing(isFollowing)
}
```

---

## 🎯 Next Steps

### Immediate Enhancements
1. ✅ Implement real-time subscriptions for notifications
2. ✅ Add online status indicators to user cards
3. ✅ Implement notification preferences (email, push)
4. ✅ Add notification grouping (e.g., "John and 5 others followed you")

### Future Features
1. 🔄 Direct messaging between users
2. 🔄 User blocking/muting
3. 🔄 Activity analytics (most liked reviews, trending users)
4. 🔄 Social media post caching and refresh
5. 🔄 Push notifications via web push API
6. 🔄 Email digest for notifications

---

## 📚 Related Documentation

- [REVIEWS_SYSTEM_GUIDE.md](./REVIEWS_SYSTEM_GUIDE.md) - Review system documentation
- [REVIEWS_ARCHITECTURE.md](./REVIEWS_ARCHITECTURE.md) - Architecture details
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Overall project overview

---

## 🤝 Contributing

When adding new social features:

1. **Database First**: Update schema with proper RLS policies
2. **Types**: Add TypeScript types to `types/database.types.ts`
3. **Actions**: Create server actions in `app/actions/`
4. **Components**: Build reusable React components
5. **Documentation**: Update this guide with examples
6. **Testing**: Test with multiple users and edge cases

---

## ✅ Completion Checklist

Before considering social features complete:

- [x] Database schema created with all tables
- [x] RLS policies configured
- [x] Triggers for automatic notifications
- [x] Follow/unfollow actions
- [x] Notification CRUD actions
- [x] Feed generation actions
- [x] Follow system UI components
- [x] Notification UI components
- [x] Feed UI components
- [x] Infinite scroll implementation
- [x] Optimistic updates
- [x] Navigation updated
- [ ] Database migrations run
- [ ] Real-time subscriptions enabled (optional)
- [ ] Social media APIs integrated (optional)
- [ ] User testing completed

---

**CineVerse Social Features** - Built with ❤️ using Next.js, Supabase, and TypeScript
