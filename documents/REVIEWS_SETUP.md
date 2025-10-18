# 🎬 CineVerse - Review System Setup Instructions

## Quick Start

### 1️⃣ Install Dependencies

```bash
npm install date-fns
```

### 2️⃣ Set Up Database

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase/reviews_schema.sql` in VS Code
5. Copy ALL the content from that file
6. Paste it into the Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for the success message

### 3️⃣ Verify Database Setup

Run this query in Supabase SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reviews', 'review_likes', 'review_helpful');

-- Check a sample query works
SELECT COUNT(*) FROM public.reviews;
```

You should see 3 tables listed and a count of 0 (since no reviews exist yet).

### 4️⃣ Start Development Server

```bash
npm run dev
```

### 5️⃣ Test the Review System

1. **Sign in** to your account (or create one at `/auth/signup`)
2. **Go to a movie page**: Navigate to `/movie/[any-movie-id]` (e.g., `/movie/550` for Fight Club)
3. **Scroll down** to the Reviews section
4. **Click "Write a Review"**
5. **Fill in the form**:
   - Rate the movie (required)
   - Add category ratings (optional)
   - Write your review (minimum 50 characters)
   - Check spoiler box if needed
6. **Submit** your review
7. **Test interactions**:
   - Like your review (heart icon)
   - Mark as helpful (thumbs up)
   - Edit your review (edit icon)
   - Delete your review (trash icon)

### 6️⃣ Check Your Profile

1. Go to `/profile`
2. View your reviews statistics
3. Click the **Reviews** tab to see all your reviews

## ✅ Features Checklist

Test each feature to ensure everything works:

### Review Creation
- [ ] Star rating (click and drag for half stars)
- [ ] Category ratings for Story, Acting, Direction, Cinematography, Music
- [ ] Text content with markdown formatting (bold, italic, headings)
- [ ] Character counter shows correct count
- [ ] Spoiler checkbox works
- [ ] Form validation (minimum 50 chars, maximum 5000)
- [ ] Submit button shows loading state
- [ ] Success: Review appears in the list

### Review Display
- [ ] Reviews show with correct user info
- [ ] Star ratings display correctly
- [ ] Category ratings show when present
- [ ] Long reviews have "Read More" button
- [ ] Spoiler reviews show warning with reveal button
- [ ] Sentiment badge displays (positive/neutral/negative)
- [ ] Like count shows correctly
- [ ] Helpful count shows correctly

### Review Interactions
- [ ] Like button toggles (heart fills/unfills)
- [ ] Like count updates immediately
- [ ] Helpful button toggles (thumbs up)
- [ ] Helpful count updates immediately
- [ ] Edit opens form with existing data
- [ ] Delete shows confirmation dialog
- [ ] Delete removes review

### Sorting & Filtering
- [ ] Sort by Recent (default)
- [ ] Sort by Most Helpful
- [ ] Sort by Highest Rating
- [ ] Sort by Lowest Rating
- [ ] Filter by All ratings
- [ ] Filter by 5 stars only
- [ ] Filter by 4+ stars
- [ ] Filter by 3+ stars

### Pagination
- [ ] Reviews paginate at 12 per page
- [ ] Previous/Next buttons work
- [ ] Page number displays correctly

### User Profile
- [ ] Profile page shows at `/profile`
- [ ] Statistics display (total reviews, average rating)
- [ ] Reviews tab shows all user's reviews
- [ ] Reviews link to movie pages

## 🎨 Customization Options

### Change Review Length Limits

Edit `app/actions/reviews.ts`:

```typescript
// Change minimum characters (default: 50)
content TEXT NOT NULL CHECK (char_length(content) >= 50 AND ...)

// Change maximum characters (default: 5000)
maxLength={5000}
```

### Change Pagination Size

Edit `components/reviews/reviews-list.tsx`:

```typescript
// Change reviews per page (default: 12)
limit: 12,
```

### Customize Sentiment Analysis

Edit `app/actions/reviews.ts`, function `analyzeSentiment()`:

```typescript
// Add more words to positive/negative lists
const positiveWords = ['great', 'amazing', ...yourWords]
const negativeWords = ['bad', 'terrible', ...yourWords]
```

### Change Color Scheme

Edit sentiment badge colors in `components/reviews/review-card.tsx`:

```typescript
const colors = {
  positive: 'bg-green-100 text-green-800 ...',
  neutral: 'bg-gray-100 text-gray-800 ...',
  negative: 'bg-red-100 text-red-800 ...',
}
```

## 🐛 Troubleshooting

### "Cannot find module '@/components/reviews/...'"

This is a TypeScript cache issue. Solutions:
1. Restart VS Code
2. Run: `npm run dev` to rebuild
3. Delete `.next` folder and restart

### Reviews not loading

1. Check Supabase SQL ran successfully
2. Verify you're signed in
3. Check browser console for errors
4. Verify TMDB API is working (movies load)

### Can't create review

1. Make sure you're signed in
2. Check you haven't already reviewed this movie (one review per user per movie)
3. Verify minimum 50 characters
4. Check browser console for errors

### Dates showing wrong format

Make sure date-fns is installed:
```bash
npm install date-fns
```

### SQL errors in VS Code

Ignore SQL file errors - they're false positives because VS Code treats them as MSSQL, but they're PostgreSQL. The SQL will run fine in Supabase.

## 📚 Database Schema

### `reviews` table
- Main review content
- User ID, Movie ID, Rating, Content
- Category ratings (optional)
- Spoiler flag
- Sentiment analysis result
- Like/helpful counts
- Timestamps

### `review_likes` table
- Tracks which users liked which reviews
- Unique constraint: one like per user per review

### `review_helpful` table
- Tracks which users marked reviews as helpful
- Unique constraint: one helpful mark per user per review

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only edit/delete their own reviews
- Everyone can read all reviews
- Authenticated users can like/helpful
- One review per user per movie enforced at DB level

## 🚀 What's Next?

Your review system is fully functional! Consider these enhancements:

1. **Add movie title to reviews** - Fetch and display movie titles in profile
2. **Email notifications** - Notify users when reviews get interactions
3. **Admin moderation** - Add ability to report/moderate reviews
4. **Reply system** - Let users reply to reviews
5. **Rich text editor** - Integrate TipTap or similar for better formatting
6. **Image uploads** - Allow users to attach images
7. **Review analytics** - Add charts for review trends

## 📞 Need Help?

- Check the detailed guide: `REVIEWS_SYSTEM_GUIDE.md`
- Review the database schema: `supabase/reviews_schema.sql`
- Check component files in: `components/reviews/`
- Review actions in: `app/actions/reviews.ts`

---

**Happy Reviewing! 🎬⭐**
