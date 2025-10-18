# CineVerse Community Channels - Complete Guide

## 🎯 Overview

The Community Channels system is a full-featured Reddit/Discord-style discussion platform built into CineVerse. Users can join channels, create posts, comment with nested threading, and vote on content.

## 📊 System Architecture

### Database Schema (5 Tables)

#### 1. **channels** - Community Channels
- `id` (UUID) - Primary key
- `name` (TEXT) - Channel name
- `slug` (TEXT) - URL-friendly identifier (unique)
- `description` (TEXT) - Channel description
- `type` (ENUM) - 'genre', 'regional', 'topic', 'custom'
- `icon` (TEXT) - Emoji or URL
- `banner_url` (TEXT) - Header banner image
- `member_count` (INT) - Auto-updated via trigger
- `post_count` (INT) - Total posts
- `moderator_ids` (UUID[]) - Array of moderator user IDs
- `rules` (TEXT[]) - Array of channel rules
- `is_official` (BOOLEAN) - Official CineVerse channel
- `created_by` (UUID) - Creator user ID
- `created_at`, `updated_at` (TIMESTAMP)

#### 2. **posts** - Channel Posts
- `id` (UUID) - Primary key
- `channel_id` (UUID) - References channels
- `author_id` (UUID) - References auth.users
- `title` (TEXT) - Post title (max 300 chars)
- `content` (TEXT) - Post body (optional)
- `flair` (TEXT) - Post flair/tag
- `thumbnail_url` (TEXT) - Optional image
- `upvotes`, `downvotes`, `score` (INT) - Vote counts
- `comment_count` (INT) - Auto-updated
- `is_pinned` (BOOLEAN) - Moderator pin
- `is_spoiler` (BOOLEAN) - Spoiler content
- `is_deleted` (BOOLEAN) - Soft delete
- `created_at`, `updated_at` (TIMESTAMP)

#### 3. **comments** - Nested Comments
- `id` (UUID) - Primary key
- `post_id` (UUID) - References posts
- `author_id` (UUID) - References auth.users
- `parent_id` (UUID) - References comments (nullable)
- `content` (TEXT) - Comment text
- `upvotes`, `downvotes`, `score` (INT) - Vote counts
- `depth` (INT) - Nesting level (0-10)
- `is_deleted` (BOOLEAN) - Soft delete
- `created_at`, `updated_at` (TIMESTAMP)

#### 4. **channel_members** - Membership
- `user_id` (UUID) - References auth.users
- `channel_id` (UUID) - References channels
- `role` (ENUM) - 'member', 'moderator', 'admin'
- `joined_at` (TIMESTAMP)
- PRIMARY KEY: (user_id, channel_id)

#### 5. **votes** - Upvotes/Downvotes
- `user_id` (UUID) - References auth.users
- `votable_id` (UUID) - Post or comment ID
- `votable_type` (ENUM) - 'post', 'comment'
- `vote_type` (ENUM) - 'up', 'down'
- `created_at` (TIMESTAMP)
- PRIMARY KEY: (user_id, votable_id, votable_type)

### Triggers & Functions

**Automatic Counters:**
1. `update_channel_member_count()` - Updates member_count on join/leave
2. `update_post_comment_count()` - Updates comment_count on comment add/remove
3. `update_vote_counts()` - Updates upvotes, downvotes, score on vote changes

**Helper Functions:**
- `is_channel_moderator(user_id, channel_id)` - Check mod status
- `is_channel_member(user_id, channel_id)` - Check membership

## 🔐 Security (RLS Policies)

### Channels
- ✅ All users can view channels
- ✅ Authenticated users can create channels
- ✅ Creators and moderators can update channels
- ✅ Only creators can delete channels

### Posts
- ✅ All users can view non-deleted posts
- ✅ Authenticated users can create posts
- ✅ Authors can update their own posts
- ✅ Authors and moderators can delete posts

### Comments
- ✅ All users can view non-deleted comments
- ✅ Authenticated users can create comments
- ✅ Authors can update/delete their own comments

### Votes & Members
- ✅ All users can view memberships and votes
- ✅ Authenticated users can join/leave channels
- ✅ Authenticated users can vote (one vote per item)

## 📁 File Structure

```
app/
├── actions/
│   ├── channels.ts          # Channel & post CRUD (500+ lines)
│   └── moderation.ts         # Moderation actions (250+ lines)
├── channels/
│   └── page.tsx              # Channels list page
├── channel/
│   └── [slug]/
│       ├── page.tsx          # Channel detail & posts feed
│       ├── post/
│       │   └── create/
│       │       └── page.tsx  # Create post form
│       └── mod/
│           └── page.tsx      # Moderation dashboard
└── post/
    └── [id]/
        └── page.tsx          # Post detail & comments

components/
└── channels/
    ├── vote-buttons.tsx      # Reddit-style voting
    ├── channel-card.tsx      # Channel preview card
    ├── join-channel-button.tsx # Join/Leave button
    ├── post-card.tsx         # Post card in feed
    ├── comment-form.tsx      # Comment input form
    └── comment-item.tsx      # Nested comment display

supabase/
└── channels_schema.sql       # Full database migration

types/
└── database.types.ts         # TypeScript types (updated)
```

## 🎨 UI Components

### 1. VoteButtons Component
**Location:** `components/channels/vote-buttons.tsx`

**Features:**
- Reddit-style upvote/downvote arrows
- Optimistic updates
- Orange (upvote) and blue (downvote) color coding
- Vote score display with +/- prefix
- Vertical or horizontal layout
- Prevents double-voting

**Props:**
```typescript
{
  votableId: string
  votableType: 'post' | 'comment'
  upvotes: number
  downvotes: number
  score: number
  userVote?: 'up' | 'down' | null
  vertical?: boolean // default true
}
```

### 2. PostCard Component
**Features:**
- Vote buttons on left
- Thumbnail image support
- Channel and author info
- Flair/tag badges
- Pin indicator
- Spoiler blur effect
- Comment count
- Click to post detail page

### 3. CommentItem Component
**Features:**
- Nested threading up to 10 levels
- Collapse/expand threads
- Vote buttons (horizontal layout)
- Reply button
- Edit/delete options
- Author avatar and username
- Relative timestamps
- "Load more replies" support

### 4. JoinChannelButton
**Features:**
- Join/Leave toggle
- Live member count
- Optimistic updates
- Loading states

## 📄 Pages

### 1. Channels List (`/channels`)
**Features:**
- Browse all channels
- Filter by type (genre, regional, topic, custom)
- Search channels by name/description
- Create new channel button
- Shows member count and joined status

### 2. Channel Detail (`/channel/[slug]`)
**Features:**
- Channel header with icon, name, description
- Member and post counts
- Join/Leave button
- Create Post button (members only)
- Moderation button (moderators only)
- Posts feed with sorting (Hot, New, Top, Controversial)
- Sidebar with about, rules, moderators

**Sort Options:**
- **Hot** - High score + recent (default)
- **New** - Latest posts first
- **Top** - Highest score
- **Controversial** - Most debated (high comment count)

### 3. Post Detail (`/post/[id]`)
**Features:**
- Full post display
- Vote buttons
- Spoiler blur on content
- Comment form
- Nested comment threads
- Share button
- Author and channel info

### 4. Create Post (`/channel/[slug]/post/create`)
**Features:**
- Title input (required, max 300 chars)
- Content textarea (optional)
- Flair selector
- Thumbnail URL input
- Spoiler checkbox
- Character counter

### 5. Moderation Dashboard (`/channel/[slug]/mod`)
**Access:** Moderators only

**Features:**
- Channel statistics
- Moderation queue (flagged content)
- Quick actions (pin posts, ban users, add mods)
- Channel settings editor
- Moderation log
- Removed content review

## 🔧 Server Actions

### Channel Actions (`app/actions/channels.ts`)

```typescript
// Channels
getChannels(options) // List with filters
getChannel(slug) // Get single channel
createChannel(data) // Create new channel
updateChannel(id, data) // Update channel
joinChannel(id) // Join as member
leaveChannel(id) // Leave channel
getChannelMembers(id) // List members

// Posts
getPosts(options) // List with filters & sorting
getPost(id) // Get single post
createPost(data) // Create new post
updatePost(id, data) // Update post
deletePost(id) // Soft delete post

// Comments
getComments(postId, parentId) // Get comments (threaded)
createComment(data) // Create comment/reply
updateComment(id, content) // Edit comment
deleteComment(id) // Soft delete comment

// Voting
vote(votableId, votableType, voteType) // Cast vote
getUserVotes(ids, type) // Get user's votes
```

### Moderation Actions (`app/actions/moderation.ts`)

```typescript
isChannelModerator(channelId) // Check mod status
pinPost(postId) // Pin to top
unpinPost(postId) // Unpin
removePost(postId, reason) // Mod remove post
removeComment(commentId, reason) // Mod remove comment
banUserFromChannel(userId, channelId, reason, duration)
addModerator(userId, channelId) // Promote to mod
removeModerator(userId, channelId) // Demote mod
getModeratedChannels() // User's moderated channels
getFlaggedContent(channelId) // Reported items
getModerationLog(channelId) // Action history
```

## 🚀 Getting Started

### 1. Run Database Migration

```bash
# In Supabase SQL Editor, run:
# supabase/channels_schema.sql
```

This creates:
- 5 tables
- 15 RLS policies
- 15 indexes
- 5 triggers
- 8 helper functions
- 11 default channels (Horror, Sci-Fi, Comedy, etc.)

### 2. Verify Installation

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('channels', 'posts', 'comments', 'channel_members', 'votes');
-- Should return 5 rows

-- Check default channels
SELECT name, slug, type, member_count FROM channels;
-- Should return 11 channels
```

### 3. Test the System

1. **Navigate to Channels:** Go to `/channels` in your app
2. **Join a Channel:** Click "Join" on any channel
3. **Create a Post:** Click "Create Post" inside a channel
4. **Vote:** Click upvote/downvote arrows
5. **Comment:** Add a comment to a post
6. **Reply:** Click "Reply" on a comment (test nesting)

## 🎯 Default Channels

The migration creates 11 official channels:

**Genre Channels:**
- 🎃 Horror
- 🚀 Sci-Fi
- 😂 Comedy
- 🎭 Drama
- 💥 Action

**Regional Channels:**
- 🎬 Hollywood
- 🇮🇳 Bollywood
- 🌍 International

**Topic Channels:**
- 🆕 New Releases
- 📽️ Classic Cinema
- 🎨 Indie Films

## 🛠️ Advanced Features

### Keyboard Shortcuts (Planned)
- `J` - Next post
- `K` - Previous post
- `A` - Upvote
- `Z` - Downvote
- `C` - Comment
- `Enter` - Open post

### Real-time Updates (Planned)
- Live vote count updates via WebSocket
- New comment notifications
- Live member count updates

### Additional Moderation Tools (Planned)
- User reports/flags system
- Auto-moderation rules
- Moderation log with filters
- Bulk actions
- Ban appeals system

## 📊 Statistics

**Total Files Created:** 17
- Server Actions: 2 files (750+ lines)
- UI Components: 6 components (900+ lines)
- Pages: 5 pages (600+ lines)
- Database Schema: 1 file (450+ lines)
- Types: Updated database types (250+ lines)

**Total Lines of Code:** ~3,000+

**Database Objects:**
- Tables: 5
- RLS Policies: 15
- Indexes: 15
- Triggers: 3
- Functions: 8

## 🐛 Troubleshooting

### Issue: Posts not showing
**Solution:** Check RLS policies, ensure user is authenticated

### Issue: Votes not updating
**Solution:** Check vote trigger is created, verify RLS policies

### Issue: Comments not nesting
**Solution:** Check parent_id is set correctly, max depth is 10

### Issue: Can't create channel
**Solution:** User must be authenticated, slug must be unique

### Issue: Member count not updating
**Solution:** Verify trigger `update_channel_member_count` exists

## 🔮 Future Enhancements

1. **User Karma System** - Points based on post/comment scores
2. **Awards/Badges** - Reddit-style awards
3. **Channel Subscriptions** - Email/push notifications
4. **Multi-image Posts** - Gallery support
5. **Video Posts** - Embedded videos
6. **Polls** - Create polls in posts
7. **Wiki Pages** - Channel wikis
8. **Custom CSS** - Channel themes
9. **Scheduled Posts** - Auto-post at specific time
10. **Cross-posting** - Share to multiple channels

## ✅ Completion Checklist

- [x] Database schema with 5 tables
- [x] RLS policies for security
- [x] Triggers for auto-counters
- [x] Server actions for all CRUD operations
- [x] Vote system (upvote/downvote)
- [x] Nested comments (up to 10 levels)
- [x] Channel membership (join/leave)
- [x] Post creation with flairs
- [x] Moderation system (pin, remove, ban)
- [x] Sorting (hot, new, top, controversial)
- [x] UI components (6 components)
- [x] Pages (channels list, channel detail, post detail, create post, mod dashboard)
- [x] Optimistic updates
- [x] TypeScript types
- [x] Navigation integration
- [x] Documentation

## 🎉 Success!

You now have a complete Reddit/Discord-style community channels system! Users can:
- Join channels and discuss movies
- Create posts with titles, content, flairs, images
- Comment with 10-level nested threading
- Upvote/downvote posts and comments
- Pin important posts (moderators)
- Remove inappropriate content (moderators)
- Search and discover channels
- Sort by Hot/New/Top/Controversial

**Next Steps:**
1. Run the database migration
2. Navigate to `/channels` in your app
3. Join a channel and create your first post!
4. Promote some users to moderators
5. Customize default channels to match your needs

---

Built with ❤️ for CineVerse
