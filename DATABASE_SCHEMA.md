# CineVerse Database Schema Documentation

> **Last Updated:** October 27, 2025  
> **Database:** PostgreSQL (Supabase)  
> **Total Tables:** 27

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Community & Channels](#community--channels)
3. [Gamification System](#gamification-system)
4. [Social Features](#social-features)
5. [Theater Bookings](#theater-bookings)
6. [AI & Recommendations](#ai--recommendations)
7. [Cache & Integration](#cache--integration)
8. [Entity Relationship Diagram](#entity-relationship-diagram)
9. [Known Issues](#known-issues)

---

## Core Tables

### 1. `public.users`
Extended user profiles (references Supabase Auth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY → `auth.users(id)` ON DELETE CASCADE | User identifier |
| `email` | TEXT | NOT NULL UNIQUE | User email address |
| `username` | TEXT | UNIQUE | Display username |
| `avatar_url` | TEXT | - | Profile picture URL |
| `bio` | TEXT | - | User biography |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Unique index on `username`

**RLS Policies:**
- ✅ Users can view all profiles (SELECT)
- ✅ Users can update own profile (UPDATE)
- ✅ Users can insert own profile (INSERT)

---

### 2. `public.movies`
Cached movie data from TMDB API

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Internal movie ID |
| `tmdb_id` | INTEGER | NOT NULL UNIQUE | TMDB API movie ID |
| `title` | TEXT | NOT NULL | Movie title |
| `poster_url` | TEXT | - | Poster image URL |
| `release_date` | DATE | - | Release date |
| `genres` | TEXT[] | DEFAULT '{}' | Array of genres |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `tmdb_id`
- Index on `tmdb_id` (idx_movies_tmdb_id)

**RLS Policies:**
- ✅ Anyone can view movies (SELECT)
- ✅ Authenticated users can insert movies (INSERT)

---

### 3. `public.reviews`
User movie reviews with ratings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT uuid_generate_v4() | Review ID |
| `user_id` | UUID | NOT NULL → `users(id)` ON DELETE CASCADE | Review author |
| `movie_id` | INTEGER | NOT NULL | TMDB movie ID |
| `rating` | INTEGER | NOT NULL CHECK (rating >= 1 AND rating <= 5) | Overall rating (1-5) |
| `content` | TEXT | NOT NULL | Review text content |
| `story_rating` | INTEGER | CHECK (1-5) | Story rating |
| `acting_rating` | INTEGER | CHECK (1-5) | Acting rating |
| `direction_rating` | INTEGER | CHECK (1-5) | Direction rating |
| `cinematography_rating` | INTEGER | CHECK (1-5) | Cinematography rating |
| `music_rating` | INTEGER | CHECK (1-5) | Music rating |
| `is_spoiler` | BOOLEAN | DEFAULT FALSE | Contains spoilers flag |
| `sentiment` | TEXT | - | AI-detected sentiment |
| `helpful_count` | INTEGER | DEFAULT 0 | Helpful votes count |
| `like_count` | INTEGER | DEFAULT 0 | Like count |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Review creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Constraints:**
- UNIQUE(user_id, movie_id) - One review per user per movie

**Indexes:**
- idx_reviews_user_id
- idx_reviews_movie_id
- idx_reviews_created_at (DESC)

**RLS Policies:**
- ✅ Anyone can view reviews (SELECT)
- ✅ Authenticated users can insert reviews (INSERT)
- ✅ Users can update own reviews (UPDATE)
- ✅ Users can delete own reviews (DELETE)

**Triggers:**
- `update_reviews_updated_at` - Auto-update `updated_at` timestamp

---

## Community & Channels

### 4. `public.channels`
Reddit-style discussion channels

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Channel ID |
| `name` | TEXT | NOT NULL | Channel name |
| `slug` | TEXT | NOT NULL UNIQUE | URL-friendly identifier |
| `description` | TEXT | - | Channel description |
| `type` | TEXT | NOT NULL CHECK ('genre', 'regional', 'topic', 'custom') | Channel category |
| `icon` | TEXT | - | Channel icon (emoji or URL) |
| `banner_url` | TEXT | - | Banner image URL |
| `member_count` | INTEGER | DEFAULT 0 | Total members |
| `post_count` | INTEGER | DEFAULT 0 | Total posts |
| `moderator_ids` | UUID[] | DEFAULT '{}' | Array of moderator user IDs |
| `rules` | TEXT[] | DEFAULT '{}' | Channel rules |
| `is_official` | BOOLEAN | DEFAULT FALSE | Official channel flag |
| `created_by` | UUID | → `auth.users(id)` ON DELETE SET NULL | Channel creator |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- idx_channels_slug
- idx_channels_type
- idx_channels_member_count (DESC)

**RLS Policies:**
- ✅ Channels are viewable by everyone (SELECT)
- ✅ Authenticated users can create channels (INSERT)
- ✅ Channel creators and moderators can update (UPDATE)
- ✅ Channel creators can delete (DELETE)

**Triggers:**
- `update_channel_member_count` - Auto-update member count

---

### 5. `public.posts`
User posts within channels

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Post ID |
| `channel_id` | UUID | NOT NULL → `channels(id)` ON DELETE CASCADE | Parent channel |
| `author_id` | UUID | NOT NULL → `auth.users(id)` ON DELETE CASCADE | Post author |
| `title` | TEXT | NOT NULL | Post title |
| `content` | TEXT | - | Post content (markdown) |
| `flair` | TEXT | - | Post flair (Discussion, Review, etc.) |
| `thumbnail_url` | TEXT | - | Post thumbnail image |
| `upvotes` | INTEGER | DEFAULT 0 | Upvote count |
| `downvotes` | INTEGER | DEFAULT 0 | Downvote count |
| `score` | INTEGER | DEFAULT 0 | Net score (upvotes - downvotes) |
| `comment_count` | INTEGER | DEFAULT 0 | Total comments |
| `view_count` | INTEGER | DEFAULT 0 | View count |
| `is_pinned` | BOOLEAN | DEFAULT FALSE | Pinned to top |
| `is_spoiler` | BOOLEAN | DEFAULT FALSE | Contains spoilers |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Post creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- idx_posts_channel_id
- idx_posts_author_id
- idx_posts_score (DESC)
- idx_posts_created_at (DESC)
- idx_posts_pinned (DESC, created_at DESC)

**RLS Policies:**
- ✅ Posts are viewable by everyone (SELECT)
- ✅ Authenticated users can create posts (INSERT)
- ✅ Authors can update own posts (UPDATE)
- ✅ Authors and moderators can delete posts (DELETE)

**Triggers:**
- `update_post_comment_count` - Auto-update comment count
- `update_channel_post_count` - Update channel's post count

---

### 6. `public.comments`
Nested comment system (max depth: 10)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Comment ID |
| `post_id` | UUID | NOT NULL → `posts(id)` ON DELETE CASCADE | Parent post |
| `author_id` | UUID | NOT NULL → `auth.users(id)` ON DELETE CASCADE | Comment author |
| `parent_id` | UUID | → `comments(id)` ON DELETE CASCADE | Parent comment (for nesting) |
| `content` | TEXT | NOT NULL | Comment text |
| `upvotes` | INTEGER | DEFAULT 0 | Upvote count |
| `downvotes` | INTEGER | DEFAULT 0 | Downvote count |
| `score` | INTEGER | DEFAULT 0 | Net score |
| `depth` | INTEGER | DEFAULT 0 CHECK (depth <= 10) | Nesting level (0-10) |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Comment creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- idx_comments_post_id
- idx_comments_parent_id
- idx_comments_author_id
- idx_comments_score (DESC)

**RLS Policies:**
- ✅ Comments are viewable by everyone (SELECT)
- ✅ Authenticated users can create comments (INSERT)
- ✅ Authors can update own comments (UPDATE)
- ✅ Authors can delete own comments (DELETE)

---

### 7. `public.channel_members`
Channel membership tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | Member user ID |
| `channel_id` | UUID | → `channels(id)` ON DELETE CASCADE | Channel ID |
| `role` | TEXT | DEFAULT 'member' CHECK ('member', 'moderator', 'admin') | Member role |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW() | Join timestamp |

**Constraints:**
- PRIMARY KEY (user_id, channel_id)

**Indexes:**
- idx_channel_members_user_id
- idx_channel_members_channel_id

**RLS Policies:**
- ✅ Members are viewable by everyone (SELECT)
- ✅ Users can join channels (INSERT)
- ✅ Users can leave channels (DELETE)

**Triggers:**
- `update_channel_member_count` - Update channel's member count

---

### 8. `public.votes`
Universal voting system for posts and comments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | NOT NULL → `auth.users(id)` ON DELETE CASCADE | Voter user ID |
| `votable_id` | UUID | NOT NULL | ID of post or comment |
| `votable_type` | TEXT | NOT NULL CHECK ('post', 'comment') | Type of voted item |
| `vote_type` | TEXT | NOT NULL CHECK ('up', 'down') | Vote direction |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Vote timestamp |

**Constraints:**
- PRIMARY KEY (user_id, votable_id, votable_type)

**Indexes:**
- idx_votes_votable (votable_id, votable_type)

**RLS Policies:**
- ✅ Votes are viewable by everyone (SELECT)
- ✅ Users can vote (INSERT)
- ✅ Users can change their votes (UPDATE)
- ✅ Users can remove their votes (DELETE)

**Triggers:**
- `update_vote_counts` - Update vote counts on posts/comments

---

## Gamification System

### 9. `public.user_stats`
Aggregate user statistics and karma

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY → `auth.users(id)` ON DELETE CASCADE | User ID |
| `karma_points` | INTEGER | DEFAULT 0 | Total karma earned |
| `level` | INTEGER | DEFAULT 1 | User level |
| `xp` | INTEGER | DEFAULT 0 | Experience points |
| `total_reviews` | INTEGER | DEFAULT 0 | Total reviews written |
| `total_posts` | INTEGER | DEFAULT 0 | Total posts created |
| `total_comments` | INTEGER | DEFAULT 0 | Total comments made |
| `channel_posts_count` | INTEGER | DEFAULT 0 | Channel posts count |
| `helpful_count` | INTEGER | DEFAULT 0 | Times marked helpful |
| `followers_count` | INTEGER | DEFAULT 0 | Follower count |
| `following_count` | INTEGER | DEFAULT 0 | Following count |
| `movies_watched` | INTEGER | DEFAULT 0 | Movies watched |
| `streak_days` | INTEGER | DEFAULT 0 | Current activity streak |
| `longest_streak` | INTEGER | DEFAULT 0 | Longest streak achieved |
| `last_activity_date` | DATE | - | Last activity date |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- idx_user_stats_karma (karma_points DESC)
- idx_user_stats_level (level DESC)

**RLS Policies:**
- ✅ Users can view all user stats (SELECT)
- ✅ Users can update own stats (UPDATE)
- ⚠️ **MISSING:** Users can insert own stats (INSERT) - **CAUSES ERROR 42501**

**Triggers:**
- `initialize_user_stats` - Auto-create stats on user signup
- `update_user_stats_timestamp` - Auto-update timestamp

---

### 10. `public.badges`
Badge definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Badge ID |
| `name` | TEXT | NOT NULL UNIQUE | Badge name |
| `description` | TEXT | - | Badge description |
| `icon` | TEXT | - | Badge icon/emoji |
| `color` | TEXT | - | Badge color code |
| `category` | TEXT | CHECK ('newcomer', 'expert', 'master', 'legend', 'special') | Badge tier |
| `karma_required` | INTEGER | DEFAULT 0 | Karma needed to earn |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Badge creation time |

**Indexes:**
- Unique index on `name`

---

### 11. `public.user_badges`
Badges earned by users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | User ID |
| `badge_id` | UUID | → `badges(id)` ON DELETE CASCADE | Badge ID |
| `earned_at` | TIMESTAMPTZ | DEFAULT NOW() | Earn timestamp |

**Constraints:**
- PRIMARY KEY (user_id, badge_id)

---

### 12. `public.achievements`
Achievement definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Achievement ID |
| `name` | TEXT | NOT NULL UNIQUE | Achievement name |
| `description` | TEXT | - | Achievement description |
| `icon` | TEXT | - | Achievement icon |
| `category` | TEXT | CHECK ('social', 'content', 'engagement', 'special') | Achievement category |
| `points` | INTEGER | DEFAULT 0 | Points awarded |
| `requirement_type` | TEXT | - | Type of requirement |
| `requirement_value` | INTEGER | - | Required value |
| `is_hidden` | BOOLEAN | DEFAULT FALSE | Hidden achievement flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Achievement creation time |

---

### 13. `public.user_achievements`
Achievements unlocked by users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | User ID |
| `achievement_id` | UUID | → `achievements(id)` ON DELETE CASCADE | Achievement ID |
| `earned_at` | TIMESTAMPTZ | DEFAULT NOW() | Unlock timestamp |

**Constraints:**
- PRIMARY KEY (user_id, achievement_id)

---

### 14. `public.challenges`
Time-limited challenges

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Challenge ID |
| `name` | TEXT | NOT NULL | Challenge name |
| `description` | TEXT | - | Challenge description |
| `type` | TEXT | CHECK ('daily', 'weekly', 'monthly', 'special') | Challenge duration |
| `goal` | INTEGER | NOT NULL | Target value |
| `reward_karma` | INTEGER | DEFAULT 0 | Karma reward |
| `start_date` | DATE | NOT NULL | Start date |
| `end_date` | DATE | NOT NULL | End date |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Challenge creation time |

---

### 15. `public.user_challenges`
User challenge progress

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | User ID |
| `challenge_id` | UUID | → `challenges(id)` ON DELETE CASCADE | Challenge ID |
| `progress` | INTEGER | DEFAULT 0 | Current progress |
| `completed` | BOOLEAN | DEFAULT FALSE | Completion status |
| `completed_at` | TIMESTAMPTZ | - | Completion timestamp |

**Constraints:**
- PRIMARY KEY (user_id, challenge_id)

---

### 16. `public.karma_transactions`
Karma change audit log

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Transaction ID |
| `user_id` | UUID | NOT NULL → `auth.users(id)` ON DELETE CASCADE | User ID |
| `amount` | INTEGER | NOT NULL | Karma amount (+/-) |
| `reason` | TEXT | NOT NULL | Reason for change |
| `source_type` | TEXT | CHECK ('review', 'post', 'comment', 'vote', 'achievement') | Source type |
| `source_id` | UUID | - | Source entity ID |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Transaction timestamp |

**Indexes:**
- Index on `user_id`
- Index on `created_at` (DESC)

---

## Social Features

### 17. `public.watchlist`
User movie watchlist

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | User ID |
| `movie_id` | INTEGER | NOT NULL | TMDB movie ID |
| `added_at` | TIMESTAMPTZ | DEFAULT NOW() | Addition timestamp |

**Constraints:**
- PRIMARY KEY (user_id, movie_id)

**RLS Policies:**
- ✅ Users can view own watchlist (SELECT)
- ✅ Users can add to watchlist (INSERT)
- ✅ Users can remove from watchlist (DELETE)

---

### 18. `public.favorites`
User favorite movies

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | User ID |
| `movie_id` | INTEGER | NOT NULL | TMDB movie ID |
| `added_at` | TIMESTAMPTZ | DEFAULT NOW() | Addition timestamp |

**Constraints:**
- PRIMARY KEY (user_id, movie_id)

**RLS Policies:**
- ✅ Users can view own favorites (SELECT)
- ✅ Users can add favorites (INSERT)
- ✅ Users can remove favorites (DELETE)

---

### 19. `public.follows`
User follow relationships

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `follower_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | Follower user ID |
| `following_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | Followed user ID |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Follow timestamp |

**Constraints:**
- PRIMARY KEY (follower_id, following_id)
- CHECK (follower_id != following_id) - Cannot follow self

**RLS Policies:**
- ✅ Follow relationships viewable by all (SELECT)
- ✅ Users can follow others (INSERT)
- ✅ Users can unfollow (DELETE)

---

### 20. `public.notifications`
User notification system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Notification ID |
| `user_id` | UUID | NOT NULL → `auth.users(id)` ON DELETE CASCADE | Recipient user ID |
| `type` | TEXT | NOT NULL | Notification type |
| `title` | TEXT | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Notification message |
| `link` | TEXT | - | Action link |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- Index on `user_id`
- Index on `is_read`
- Index on `created_at` (DESC)

**RLS Policies:**
- ✅ Users can view own notifications (SELECT)
- ✅ System can create notifications (INSERT)
- ✅ Users can mark as read (UPDATE)
- ✅ Users can delete notifications (DELETE)

---

### 21. `public.user_activity`
User activity feed

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Activity ID |
| `user_id` | UUID | NOT NULL → `auth.users(id)` ON DELETE CASCADE | Actor user ID |
| `activity_type` | TEXT | NOT NULL CHECK ('movie_view', 'review_posted', 'post_created', 'comment_posted', 'channel_joined', 'watchlist_added') | Activity type |
| `entity_id` | TEXT | NOT NULL | Related entity ID |
| `entity_title` | TEXT | - | Entity title |
| `metadata` | JSONB | - | Additional metadata |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Activity timestamp |

**Indexes:**
- Index on `user_id`
- Index on `activity_type`
- Index on `created_at` (DESC)

---

## Theater Bookings

### 22. `public.theaters`
Physical theater locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Theater ID |
| `name` | TEXT | NOT NULL | Theater name |
| `location` | TEXT | NOT NULL | Street address |
| `city` | TEXT | NOT NULL | City |
| `state` | TEXT | - | State/province |
| `pincode` | TEXT | - | Postal code |
| `latitude` | DECIMAL(9,6) | - | GPS latitude |
| `longitude` | DECIMAL(9,6) | - | GPS longitude |
| `facilities` | TEXT[] | DEFAULT '{}' | Amenities (parking, food court, etc.) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- Index on `city`
- Spatial index on (latitude, longitude)

---

### 23. `public.screens`
Theater screens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Screen ID |
| `theater_id` | UUID | NOT NULL → `theaters(id)` ON DELETE CASCADE | Parent theater |
| `name` | TEXT | NOT NULL | Screen name (Screen 1, IMAX, etc.) |
| `total_seats` | INTEGER | NOT NULL | Total seat capacity |
| `screen_type` | TEXT | CHECK ('2D', '3D', 'IMAX', '4DX', 'Dolby') | Screen technology |
| `seat_layout` | JSONB | - | Seat arrangement matrix |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

---

### 24. `public.showtimes`
Movie screening schedule

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Showtime ID |
| `screen_id` | UUID | NOT NULL → `screens(id)` ON DELETE CASCADE | Screen ID |
| `movie_id` | INTEGER | NOT NULL | TMDB movie ID |
| `show_date` | DATE | NOT NULL | Show date |
| `show_time` | TIME | NOT NULL | Show time |
| `language` | TEXT | NOT NULL | Audio language |
| `subtitle_language` | TEXT | - | Subtitle language |
| `price` | DECIMAL(10,2) | NOT NULL | Ticket price |
| `available_seats` | INTEGER | NOT NULL | Remaining seats |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- Index on `screen_id`
- Index on `movie_id`
- Composite index on (show_date, show_time)

---

### 25. `public.bookings`
User ticket bookings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Booking ID |
| `user_id` | UUID | NOT NULL → `auth.users(id)` ON DELETE CASCADE | User ID |
| `showtime_id` | UUID | NOT NULL → `showtimes(id)` ON DELETE CASCADE | Showtime ID |
| `seats` | TEXT[] | NOT NULL | Selected seat numbers |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Total payment amount |
| `booking_status` | TEXT | CHECK ('pending', 'confirmed', 'cancelled') | Booking status |
| `payment_id` | TEXT | - | Payment gateway transaction ID |
| `payment_status` | TEXT | CHECK ('pending', 'completed', 'failed', 'refunded') | Payment status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Booking creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- Index on `user_id`
- Index on `showtime_id`
- Index on `booking_status`

---

## AI & Recommendations

### 26. `public.watch_history`
User viewing history for AI recommendations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | → `auth.users(id)` ON DELETE CASCADE | User ID |
| `movie_id` | INTEGER | NOT NULL | TMDB movie ID |
| `watched_at` | TIMESTAMPTZ | DEFAULT NOW() | View timestamp |
| `watch_duration` | INTEGER | - | Watch duration (minutes) |

**Constraints:**
- PRIMARY KEY (user_id, movie_id)

**Indexes:**
- Index on `watched_at` (DESC)

---

### 27. `public.movie_similarities`
Pre-computed movie similarity matrix

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `movie_id_1` | INTEGER | NOT NULL | First movie TMDB ID |
| `movie_id_2` | INTEGER | NOT NULL | Second movie TMDB ID |
| `similarity_score` | DECIMAL(3,2) | CHECK (0.00 to 1.00) | Similarity coefficient |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last calculation time |

**Constraints:**
- PRIMARY KEY (movie_id_1, movie_id_2)

---

### 28. `public.user_preferences`
User content preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PRIMARY KEY → `auth.users(id)` ON DELETE CASCADE | User ID |
| `favorite_genres` | TEXT[] | DEFAULT '{}' | Preferred genres |
| `preferred_languages` | TEXT[] | DEFAULT '{}' | Preferred languages |
| `preferred_decades` | INTEGER[] | DEFAULT '{}' | Preferred release decades |
| `min_rating` | DECIMAL(2,1) | CHECK (0.0 to 10.0) | Minimum acceptable rating |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

---

## Cache & Integration

### 29. `public.twitter_cache`
Cached Twitter/X mentions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Cache entry ID |
| `movie_title` | TEXT | NOT NULL | Movie title searched |
| `movie_id` | INTEGER | - | TMDB movie ID |
| `tweet_id` | TEXT | UNIQUE NOT NULL | Twitter tweet ID |
| `content` | TEXT | NOT NULL | Tweet text content |
| `author_name` | TEXT | - | Tweet author display name |
| `author_username` | TEXT | - | Tweet author handle |
| `created_at` | TIMESTAMPTZ | - | Tweet creation time |
| `cached_at` | TIMESTAMPTZ | DEFAULT NOW() | Cache timestamp |

**Indexes:**
- Unique index on `tweet_id`
- Index on `movie_id`
- Index on `cached_at` (for cache invalidation)

---

### 30. `public.social_posts`
Aggregated social media posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | Post ID |
| `platform` | TEXT | NOT NULL CHECK ('twitter', 'reddit', 'letterboxd') | Social platform |
| `movie_id` | INTEGER | - | TMDB movie ID |
| `post_id` | TEXT | UNIQUE NOT NULL | Platform post ID |
| `content` | TEXT | NOT NULL | Post content |
| `author` | TEXT | - | Post author |
| `engagement` | INTEGER | DEFAULT 0 | Likes/upvotes count |
| `url` | TEXT | - | Direct link to post |
| `created_at` | TIMESTAMPTZ | - | Post creation time |
| `cached_at` | TIMESTAMPTZ | DEFAULT NOW() | Cache timestamp |

**Indexes:**
- Index on `platform`
- Index on `movie_id`
- Index on `cached_at` (DESC)

---

## Entity Relationship Diagram

```
┌──────────────┐
│ auth.users   │ (Supabase Auth)
└──────┬───────┘
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
       ▼                                                 ▼
┌─────────────┐                                  ┌──────────────┐
│   users     │                                  │  user_stats  │ ⚠️ Missing INSERT
└──────┬──────┘                                  └──────────────┘
       │
       ├──────────┬──────────┬──────────┬──────────┬──────────┐
       │          │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼          ▼
   reviews    watchlist  favorites  follows  notifications  bookings
       │
       │
┌──────┴───────┐
│   channels   │
└──────┬───────┘
       │
       ├──────────┬──────────────┐
       │          │              │
       ▼          ▼              ▼
    posts     comments    channel_members
       │          │
       └────┬─────┘
            │
            ▼
         votes
```

---

## Known Issues

### 🚨 Critical Issues

#### 1. Missing Foreign Key Relationships
**Error:** `PGRST200 - Could not find a relationship between 'posts' and 'users'`

**Tables Affected:**
- `public.posts` - `author_id` column
- `public.comments` - `author_id` column

**Fix Required:**
```sql
-- Add missing foreign keys
ALTER TABLE public.posts
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.comments
ADD CONSTRAINT comments_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

#### 2. Missing RLS INSERT Policy
**Error:** `42501 - new row violates row-level security policy for table "user_stats"`

**Table Affected:**
- `public.user_stats`

**Fix Required:**
```sql
CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## Database Statistics

- **Total Tables:** 30 tables
- **Core System:** 3 tables (users, movies, reviews)
- **Community:** 5 tables (channels, posts, comments, members, votes)
- **Gamification:** 7 tables (stats, badges, achievements, karma, challenges)
- **Social Features:** 5 tables (watchlist, favorites, follows, notifications, activity)
- **Theater System:** 4 tables (theaters, screens, showtimes, bookings)
- **AI/ML:** 3 tables (watch_history, similarities, preferences)
- **Cache/Integration:** 2 tables (twitter_cache, social_posts)

---

## Triggers Summary

| Trigger | Table | Function | Purpose |
|---------|-------|----------|---------|
| `on_auth_user_created` | auth.users | `handle_new_user()` | Auto-create user profile |
| `update_reviews_updated_at` | reviews | `update_updated_at_column()` | Auto-update timestamp |
| `update_channel_member_count` | channel_members | `update_channel_member_count_fn()` | Update member count |
| `update_post_comment_count` | comments | `update_post_comment_count_fn()` | Update comment count |
| `channel_post_count_trigger` | posts | `update_channel_post_count()` | Update post count |
| `update_vote_counts` | votes | `update_vote_counts_fn()` | Update vote counts |
| `initialize_user_stats` | auth.users | `initialize_user_stats()` | Create user stats |
| `update_user_stats_timestamp` | user_stats | `update_user_stats_timestamp()` | Auto-update timestamp |

---

## Quick Fix SQL Script

Run this in Supabase SQL Editor to fix all critical issues:

```sql
-- Fix 1: Add missing foreign key for posts.author_id
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

ALTER TABLE public.posts
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Fix 2: Add missing foreign key for comments.author_id
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE public.comments
ADD CONSTRAINT comments_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Fix 3: Add INSERT policy for user_stats
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;

CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 4: Make initialize_user_stats SECURITY DEFINER
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix 5: Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'All fixes applied successfully!' as status;
```

---

**Generated:** October 27, 2025  
**Project:** CineVerse  
**Database:** PostgreSQL (Supabase)  
**Version:** 1.0
