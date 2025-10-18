# CineVerse Review System - Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Movie Detail Page (/movie/[id])                            │
│  ├─── Movie Info (TMDB API)                                 │
│  └─── Reviews Section ◄── ReviewsSection Component          │
│        ├─── Write Review Button                              │
│        └─── Reviews List                                     │
│                                                               │
│  Profile Page (/profile)                                     │
│  ├─── User Stats                                             │
│  ├─── Reviews Tab ◄── UserReviews Component                 │
│  ├─── Watchlist Tab                                          │
│  └─── Favorites Tab                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  COMPONENT HIERARCHY                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ReviewsSection (Container)                                  │
│  │                                                            │
│  ├─── ReviewForm                                             │
│  │    ├─── StarRating (Overall)                             │
│  │    ├─── StarRating × 5 (Categories)                      │
│  │    ├─── Textarea (Content)                               │
│  │    ├─── Checkbox (Spoiler)                               │
│  │    └─── Button (Submit)                                  │
│  │                                                            │
│  └─── ReviewsList                                            │
│       ├─── Sort/Filter Controls                              │
│       ├─── ReviewCard × 12                                   │
│       │    ├─── StarRating (Display)                        │
│       │    ├─── Content (with markdown)                     │
│       │    ├─── Like Button                                 │
│       │    ├─── Helpful Button                              │
│       │    ├─── Edit Button (if owner)                      │
│       │    └─── Delete Button (if owner)                    │
│       └─── Pagination Controls                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  app/actions/reviews.ts                                      │
│  │                                                            │
│  ├─── createReview()                                         │
│  │    └─── Sentiment Analysis ──► analyzeSentiment()       │
│  │                                                            │
│  ├─── updateReview()                                         │
│  │    └─── Sentiment Analysis ──► analyzeSentiment()       │
│  │                                                            │
│  ├─── deleteReview()                                         │
│  │                                                            │
│  ├─── getReviewsByMovie()                                    │
│  │    ├─── Sort: recent/helpful/highest/lowest              │
│  │    ├─── Filter: by rating                                │
│  │    └─── Paginate: 12 per page                            │
│  │                                                            │
│  ├─── getReviewsByUser()                                     │
│  │                                                            │
│  ├─── getUserReviewStats()                                   │
│  │                                                            │
│  ├─── toggleReviewLike()                                     │
│  │                                                            │
│  ├─── toggleReviewHelpful()                                  │
│  │                                                            │
│  └─── getUserReviewInteractions()                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (Supabase)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐                                         │
│  │    reviews      │                                         │
│  ├─────────────────┤                                         │
│  │ id (PK)         │                                         │
│  │ user_id (FK)    │◄───────────┐                           │
│  │ movie_id        │             │                           │
│  │ rating          │             │                           │
│  │ content         │             │                           │
│  │ story_rating    │             │  RLS Policies:            │
│  │ acting_rating   │             │  • Everyone can read      │
│  │ direction_rating│             │  • Auth users can create  │
│  │ cinematography  │             │  • Users edit/delete own  │
│  │ music_rating    │             │                           │
│  │ is_spoiler      │             │                           │
│  │ sentiment       │             │                           │
│  │ helpful_count   │◄──┐         │                           │
│  │ like_count      │◄┐ │         │                           │
│  │ created_at      │ │ │         │                           │
│  │ updated_at      │ │ │         │                           │
│  └─────────────────┘ │ │         │                           │
│                      │ │         │                           │
│  ┌──────────────────┐│ │         │                           │
│  │  review_likes    ││ │         │                           │
│  ├──────────────────┤│ │         │                           │
│  │ id (PK)          ││ │         │                           │
│  │ user_id (FK)     ││ │         │                           │
│  │ review_id (FK)   │┘ │         │                           │
│  │ created_at       │  │         │                           │
│  └──────────────────┘  │         │                           │
│         │               │         │                           │
│         └─Trigger───────┘         │                           │
│           (auto-update            │                           │
│            like_count)            │                           │
│                                   │                           │
│  ┌──────────────────┐             │                           │
│  │ review_helpful   │             │                           │
│  ├──────────────────┤             │                           │
│  │ id (PK)          │             │                           │
│  │ user_id (FK)     │             │                           │
│  │ review_id (FK)   │─────────────┘                           │
│  │ created_at       │                                         │
│  └──────────────────┘                                         │
│         │                                                      │
│         └─Trigger─────────┘                                   │
│           (auto-update                                        │
│            helpful_count)                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Review

```
User fills form
    │
    ▼
ReviewForm validates
    │
    ▼
createReview() action
    │
    ├─► Authenticate user
    ├─► Analyze sentiment
    └─► Insert to DB
        │
        ▼
    RLS checks permissions
        │
        ▼
    Review created
        │
        ▼
    Page revalidated
        │
        ▼
    UI updates
```

### Liking a Review

```
User clicks heart
    │
    ▼
Optimistic UI update (instant)
    │
    ▼
toggleReviewLike() action
    │
    ├─► Check if already liked
    ├─► Insert or delete from review_likes
    └─► Trigger auto-updates like_count
        │
        ▼
    Success/Error
        │
        ├─► Success: UI stays updated
        └─► Error: Rollback UI
```

### Sentiment Analysis

```
Review content
    │
    ▼
analyzeSentiment()
    │
    ├─► Count positive keywords
    ├─► Count negative keywords
    └─► Calculate score
        │
        ├─► Score > 2: Positive
        ├─► Score < -2: Negative
        └─► Otherwise: Neutral
            │
            ▼
        Sentiment stored in DB
            │
            ▼
        Badge displayed on card
```

## Security Model

```
┌──────────────────────────────────────┐
│         Authentication               │
│   (Supabase Auth + JWT)             │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Row Level Security (RLS)        │
├──────────────────────────────────────┤
│                                      │
│  Read Reviews:                       │
│  ✓ Anyone (even unauthenticated)    │
│                                      │
│  Create Review:                      │
│  ✓ Authenticated users only          │
│  ✓ One per user per movie           │
│                                      │
│  Update Review:                      │
│  ✓ Owner only (user_id = auth.uid())│
│                                      │
│  Delete Review:                      │
│  ✓ Owner only (user_id = auth.uid())│
│                                      │
│  Like/Helpful:                       │
│  ✓ Authenticated users only          │
│  ✓ One per user per review          │
│                                      │
└──────────────────────────────────────┘
```

## Performance Optimizations

```
┌─────────────────────────────────────┐
│     Database Indexes                │
├─────────────────────────────────────┤
│ • reviews.movie_id                  │
│ • reviews.user_id                   │
│ • reviews.created_at (DESC)         │
│ • reviews.rating (DESC)             │
│ • reviews.helpful_count (DESC)      │
│ • review_likes.review_id            │
│ • review_helpful.review_id          │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│     Automatic Triggers              │
├─────────────────────────────────────┤
│ • Auto-update like_count            │
│ • Auto-update helpful_count         │
│ • Auto-update updated_at            │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│     Client Optimizations            │
├─────────────────────────────────────┤
│ • Optimistic UI updates             │
│ • Pagination (12 per page)          │
│ • Lazy loading                      │
│ • Server-side rendering             │
└─────────────────────────────────────┘
```

## Key Technologies

```
Frontend:
├── Next.js 14 (App Router)
├── React 18 (Client Components)
├── TypeScript
├── Tailwind CSS
└── shadcn/ui Components

Backend:
├── Next.js Server Actions
├── Supabase (PostgreSQL)
├── Row Level Security
└── Database Triggers

Additional:
├── date-fns (date formatting)
└── Lucide Icons
```

## File Structure

```
CineVerse/
├── app/
│   ├── actions/
│   │   └── reviews.ts ................. Server actions
│   ├── movie/[id]/
│   │   └── page.tsx .................. Movie detail + reviews
│   └── profile/
│       └── page.tsx .................. User profile
├── components/
│   └── reviews/
│       ├── star-rating.tsx ........... Star rating component
│       ├── review-form.tsx ........... Create/edit form
│       ├── review-card.tsx ........... Individual review
│       ├── reviews-list.tsx .......... List with sort/filter
│       ├── reviews-section.tsx ....... Main wrapper
│       └── user-reviews.tsx .......... Profile reviews tab
├── supabase/
│   └── reviews_schema.sql ............ Database schema
├── types/
│   └── database.types.ts ............. TypeScript types
└── Documentation/
    ├── REVIEWS_SETUP.md .............. Quick start
    ├── REVIEWS_SYSTEM_GUIDE.md ....... Full guide
    ├── REVIEWS_COMPLETE.md ........... Summary
    └── README_REVIEWS.md ............. Action items
```

---

**Implementation Status: ✅ COMPLETE**
**Ready for Production: ✅ YES**
**Database Migration Required: ⚠️ YES (run reviews_schema.sql)**
