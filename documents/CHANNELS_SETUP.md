# CineVerse Channels - Quick Setup

## 🚀 Installation (3 Steps)

### Step 1: Run Database Migration

1. Open **Supabase Dashboard** → SQL Editor
2. Click **"+ New query"**
3. Copy **ALL** content from `supabase/channels_schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. You should see: **"Success. No rows returned"**

### Step 2: Verify Installation

Run this query in Supabase:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('channels', 'posts', 'comments', 'channel_members', 'votes');
```

**Expected:** 5 rows (all tables created)

Check default channels:

```sql
SELECT name, slug, type, member_count FROM channels;
```

**Expected:** 11 channels (Horror, Sci-Fi, Comedy, Drama, Action, Hollywood, Bollywood, International, New Releases, Classic Cinema, Indie Films)

### Step 3: Test the App

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Channels:**
   - Go to `http://localhost:3000/channels`
   - You should see 11 channels

3. **Join a Channel:**
   - Click on "Horror" channel
   - Click "Join" button
   - Member count should increase by 1

4. **Create a Post:**
   - Click "Create Post" button (only visible after joining)
   - Fill in title: "The best horror movie of 2024"
   - Add content (optional)
   - Select flair: "Discussion"
   - Click "Post"

5. **Vote and Comment:**
   - Click upvote arrow on your post
   - Add a comment
   - Reply to your own comment (test nesting)

## ✅ Success Criteria

If you can do all of these, the system is working:

- [x] View channels list at `/channels`
- [x] Join a channel (member count increases)
- [x] Create a post (with title, content, flair)
- [x] Upvote/downvote a post (score changes)
- [x] Add a comment to a post
- [x] Reply to a comment (nested threading)
- [x] View post detail page at `/post/[id]`
- [x] See "Channels" in navigation menu
- [x] Access moderation dashboard (after promoting to moderator)

## 🎯 Quick Feature Tour

### For Regular Users:
1. **Browse Channels** → `/channels` - Filter by genre, region, topic
2. **Join Channels** → Click "Join" button on any channel
3. **Create Posts** → Click "Create Post" (members only)
4. **Vote** → Upvote/downvote posts and comments
5. **Comment** → Add comments and replies (nested up to 10 levels)
6. **Sort Posts** → Hot, New, Top, Controversial

### For Moderators:
1. **Pin Posts** → Keep important posts at the top
2. **Remove Content** → Delete spam or inappropriate posts
3. **Ban Users** → Remove troublemakers from channel
4. **Edit Channel** → Update description, rules, settings
5. **View Mod Dashboard** → `/channel/[slug]/mod`

## 📊 What Was Built

**Files Created: 17**
- Database schema: 1 file (450 lines)
- Server actions: 2 files (750 lines)
- UI components: 6 files (900 lines)
- Pages: 5 files (600 lines)
- Types: Updated (250 lines)
- Documentation: 2 files (this + complete guide)

**Database Objects:**
- Tables: 5 (channels, posts, comments, channel_members, votes)
- RLS Policies: 15 (secure access control)
- Indexes: 15 (performance optimization)
- Triggers: 3 (auto-update counters)
- Functions: 8 (helper functions)
- Default Channels: 11 (ready to use)

**Total Lines of Code: ~3,000+**

## 🔧 Common Issues & Fixes

### Issue: "channels table does not exist"
**Fix:** Run the migration SQL file in Supabase

### Issue: Can't see "Channels" in menu
**Fix:** Check `app/dashboard/layout.tsx` is updated

### Issue: Can't create posts
**Fix:** Make sure you've joined the channel first

### Issue: Votes not updating
**Fix:** Check that vote trigger was created successfully

### Issue: TypeScript errors
**Fix:** Run `npm install` to ensure all dependencies are installed

## 🎨 Customization Tips

### Add Your Own Channel:
```sql
INSERT INTO channels (name, slug, description, type, icon, is_official)
VALUES ('Anime', 'anime', 'Discuss anime and manga adaptations', 'topic', '🎌', false);
```

### Make a User a Moderator:
```sql
UPDATE channels 
SET moderator_ids = moderator_ids || ARRAY['USER_ID_HERE']::uuid[]
WHERE slug = 'horror';
```

### Change Channel Rules:
```sql
UPDATE channels 
SET rules = ARRAY[
  'Be respectful to all members',
  'No spoilers without tags',
  'Stay on topic',
  'No spam or self-promotion'
]
WHERE slug = 'horror';
```

## 📖 Full Documentation

See `CHANNELS_COMPLETE.md` for:
- Complete API reference
- Database schema details
- Component documentation
- Advanced features
- Future enhancements
- Troubleshooting guide

## 🎉 You're All Set!

The community channels system is ready to use. Start by:
1. Joining some channels
2. Creating your first post
3. Engaging with the community
4. Exploring moderation tools

**Need help?** Check the complete guide in `CHANNELS_COMPLETE.md`

---

Built with ❤️ for CineVerse
