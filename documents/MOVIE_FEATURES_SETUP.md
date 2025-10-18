# Movie Features Setup Instructions

You now have a complete movie browsing experience with TMDB integration! Here's what to do next:

## 1. Install Dependencies

Run this command to install all required packages:

```powershell
npm install
```

This will install:
- `@tanstack/react-query` - Data fetching and caching
- `react-intersection-observer` - Infinite scroll
- `@radix-ui/react-tabs` - Tab component
- All other required dependencies

## 2. Configure TMDB API Key

Add your TMDB API key to `.env.local`:

```
NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
TMDB_API_KEY=your_api_key_here
```

**Note:** You can reuse the same TMDB API key across multiple projects - it's not URL-restricted!

## 3. Set Up Database Tables

Run the watchlist schema in your Supabase SQL Editor:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/watchlist_schema.sql`
6. Click **Run** to create the tables

This creates:
- `watchlist` table - Movies users want to watch
- `favorites` table - Movies users love
- Row Level Security (RLS) policies for secure access

## 4. Restart Development Server

After setting up environment variables:

```powershell
npm run dev
```

## What's Been Built

### Pages Created

1. **Movie Search** (`/search`)
   - Debounced search input (500ms delay)
   - Filter sidebar with:
     - Genre checkboxes (fetched from TMDB)
     - Year dropdown (last 50 years)
     - Rating filter (7+, 8+, 9+)
     - Sort options (popularity, rating, release date)
   - Infinite scroll for results
   - Animated filter panel
   - Responsive grid (2-5 columns)

2. **Movie Detail** (`/movie/[id]`)
   - Hero section with backdrop image
   - Movie poster and title
   - Tagline and overview
   - Release year, runtime, rating
   - Genre badges
   - Cast carousel (horizontal scroll)
   - Movie information cards (status, language, budget, revenue, website)
   - Similar movies grid
   - Action buttons:
     - Add to Watchlist
     - Add to Favorites
     - Share
     - Watch Trailer (YouTube link)

3. **Explore** (`/explore`)
   - Tabs for different categories:
     - 🔥 Trending Today
     - ⭐ Popular
     - 🏆 Top Rated
     - 🎬 Upcoming
     - 🎭 By Genre
   - Genre filter buttons
   - Animated movie grid
   - Staggered card animations

### Components Created

- `MovieCard` - Reusable movie card with hover effects
- `RatingStars` - Star rating display (converts TMDB 0-10 to 5 stars)
- `GenreBadge` - Styled genre tags
- `CastCard` - Cast member display with photo
- `Loading Skeletons` - Loading states for all components

### Server Actions Created

All database operations in `app/actions/watchlist.ts`:

- `addToWatchlist(movieId)` - Add movie to watchlist
- `removeFromWatchlist(movieId)` - Remove movie from watchlist
- `isInWatchlist(movieId)` - Check if movie is in watchlist
- `getUserWatchlist()` - Get user's watchlist
- `addToFavorites(movieId)` - Add movie to favorites
- `removeFromFavorites(movieId)` - Remove movie from favorites
- `isInFavorites(movieId)` - Check if movie is in favorites
- `getUserFavorites()` - Get user's favorites

### TMDB API Client

Complete API integration in `lib/tmdb/client.ts`:

- `searchMovies(query)` - Search by title
- `getTrendingMovies()` - Trending today
- `getPopularMovies()` - Popular movies
- `getTopRatedMovies()` - Top rated
- `getUpcomingMovies()` - Upcoming releases
- `getMovieDetails(id)` - Full movie details
- `getMovieCredits(id)` - Cast and crew
- `getSimilarMovies(id)` - Similar movies
- `getMovieVideos(id)` - Trailers and videos
- `getMovieGenres()` - All genres
- `discoverMovies(filters)` - Filter-based discovery

## Testing the Features

### 1. Test Movie Search

```
http://localhost:3000/search
```

Try:
- Searching for movies
- Filtering by genre
- Filtering by year
- Filtering by rating
- Sorting results
- Scrolling to load more movies

### 2. Test Movie Details

Click any movie card to view details:
```
http://localhost:3000/movie/[id]
```

You should see:
- Full movie information
- Cast members
- Similar movies
- Action buttons

### 3. Test Explore Page

```
http://localhost:3000/explore
```

Try:
- Switching between tabs
- Filtering by genre
- Viewing different categories

### 4. Test Watchlist/Favorites

**Note:** These buttons are visible but won't work until you're logged in and have run the database schema!

After running the SQL schema:
1. Log in to your account
2. Click "Add to Watchlist" on any movie
3. Click the heart icon to favorite a movie
4. Check your Supabase database to see the entries

## Next Steps

### Optional Enhancements

1. **React Query Setup** - Add QueryClientProvider to `app/layout.tsx` for better caching
2. **Watchlist Page** - Create a page to view your saved watchlist
3. **Favorites Page** - Create a page to view your favorites
4. **User Reviews** - Add ability to write and view movie reviews
5. **Movie Ratings** - Allow users to rate movies
6. **Social Features** - Share watchlists with friends

### Add to Navigation

Update your navigation menu to include links to:
- Search: `/search`
- Explore: `/explore`
- Watchlist: `/dashboard/watchlist` (to be created)
- Favorites: `/dashboard/favorites` (to be created)

## Troubleshooting

### "Cannot find module 'react-intersection-observer'"
Run `npm install` to install dependencies.

### TMDB Images Not Loading
Make sure you added both environment variables:
- `NEXT_PUBLIC_TMDB_API_KEY` (for client components)
- `TMDB_API_KEY` (for server components)

Then restart the dev server.

### Watchlist Buttons Not Working
1. Make sure you're logged in
2. Run the SQL schema in Supabase
3. Check browser console for errors

### SQL Errors in Editor
The red squiggly lines in `watchlist_schema.sql` are just VS Code linter warnings - the SQL syntax is correct for PostgreSQL/Supabase.

## Questions?

- TMDB API Documentation: https://developer.themoviedb.org/docs
- Supabase Docs: https://supabase.com/docs
- Next.js 14 Docs: https://nextjs.org/docs

Enjoy building your movie platform! 🎬🍿
