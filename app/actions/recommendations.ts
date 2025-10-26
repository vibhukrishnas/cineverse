'use server'

import { createClient } from '@/lib/supabase/server'
import { getMovieDetails, getSimilarMovies, getTrendingMovies } from '@/lib/tmdb/client'

interface MovieRecommendation {
  id: string
  movie_id: number
  movie_title: string
  movie_poster: string | null
  movie_backdrop: string | null
  reason: string
  algorithm_type: string
  confidence_score: number
}

// Get personalized AI recommendations for user
export async function getAIRecommendations(limit: number = 10): Promise<MovieRecommendation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  try {
    // First, generate fresh recommendations
    await generateRecommendations(user.id)

    // Fetch recommendations from database
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching AI recommendations:', error)
      return []
    }

    // Fetch movie details from TMDB
    const recommendations: MovieRecommendation[] = []

    for (const rec of data) {
      try {
        const movie = await getMovieDetails(rec.movie_id)
        recommendations.push({
          id: rec.id,
          movie_id: rec.movie_id,
          movie_title: rec.movie_title,
          movie_poster: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : null,
          movie_backdrop: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : null,
          reason: rec.reason || 'Recommended for you',
          algorithm_type: rec.algorithm_type,
          confidence_score: rec.confidence_score || 0.8
        })
      } catch (error) {
        console.error(`Error fetching movie ${rec.movie_id}:`, error)
      }
    }

    return recommendations
  } catch (error) {
    console.error('Error in getAIRecommendations:', error)
    return []
  }
}

// Generate new recommendations based on user's activity
async function generateRecommendations(userId: string) {
  const supabase = await createClient()

  try {
    // Check if recommendations were generated recently (within last hour)
    const { data: recentRecs } = await supabase
      .from('ai_recommendations')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(1)

    if (recentRecs && recentRecs.length > 0) {
      // Don't regenerate if we have recent recommendations
      return
    }

    // Fetch user's activity
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('tmdb_id')
      .eq('user_id', userId)
      .limit(20)

    const { data: favorites } = await supabase
      .from('favorites')
      .select('tmdb_id')
      .eq('user_id', userId)
      .limit(20)

    const { data: reviews } = await supabase
      .from('reviews')
      .select('movie_id, rating')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get movie IDs user interacted with
    const movieIds = new Set<number>()
    watchlist?.forEach(w => movieIds.add(w.tmdb_id))
    favorites?.forEach(f => movieIds.add(f.tmdb_id))
    reviews?.forEach(r => movieIds.add(r.movie_id))

    const recommendations: Array<{
      movie_id: number
      movie_title: string
      reason: string
      algorithm_type: string
      confidence_score: number
    }> = []

    // Strategy 1: Collaborative Filtering (similar users' favorites)
    if (movieIds.size > 0) {
      const collaborativeRecs = await getCollaborativeRecommendations(
        supabase, 
        userId, 
        Array.from(movieIds)
      )
      recommendations.push(...collaborativeRecs)
    }

    // Strategy 2: Content-Based (similar to user's favorites)
    const highRatedMovies = reviews?.filter(r => r.rating >= 4).map(r => r.movie_id) || []
    if (highRatedMovies.length > 0) {
      for (const movieId of highRatedMovies.slice(0, 3)) {
        try {
          const similar = await getSimilarMovies(movieId)
          similar.results.slice(0, 3).forEach((movie: any) => {
            if (!movieIds.has(movie.id)) {
              recommendations.push({
                movie_id: movie.id,
                movie_title: movie.title,
                reason: `Because you rated "${movie.title}" highly`,
                algorithm_type: 'content_based',
                confidence_score: 0.85
              })
              movieIds.add(movie.id)
            }
          })
        } catch (error) {
          console.error(`Error fetching similar movies for ${movieId}:`, error)
        }
      }
    }

    // Strategy 3: Trending movies (fallback if user has no history)
    if (recommendations.length < 5) {
      try {
        const trending = await getTrendingMovies('week')
        trending.results.slice(0, 10).forEach((movie: any) => {
          if (!movieIds.has(movie.id)) {
            recommendations.push({
              movie_id: movie.id,
              movie_title: movie.title,
              reason: 'Trending this week',
              algorithm_type: 'trending',
              confidence_score: 0.7
            })
            movieIds.add(movie.id)
          }
        })
      } catch (error) {
        console.error('Error fetching trending movies:', error)
      }
    }

    // Save recommendations to database
    if (recommendations.length > 0) {
      const recsToInsert = recommendations.slice(0, 20).map(rec => ({
        user_id: userId,
        movie_id: rec.movie_id,
        movie_title: rec.movie_title,
        reason: rec.reason,
        algorithm_type: rec.algorithm_type,
        confidence_score: rec.confidence_score
      }))

      await supabase
        .from('ai_recommendations')
        .insert(recsToInsert)
    }
  } catch (error) {
    console.error('Error generating recommendations:', error)
  }
}

// Get recommendations based on what similar users liked
async function getCollaborativeRecommendations(
  supabase: any,
  userId: string,
  userMovieIds: number[]
): Promise<Array<{
  movie_id: number
  movie_title: string
  reason: string
  algorithm_type: string
  confidence_score: number
}>> {
  // Find users with similar taste (who favorited same movies)
  const { data: similarUsers } = await supabase
    .from('favorites')
    .select('user_id, tmdb_id')
    .in('tmdb_id', userMovieIds)
    .neq('user_id', userId)

  if (!similarUsers || similarUsers.length === 0) {
    return []
  }

  // Count overlapping favorites per user
  const userScores = new Map<string, number>()
  similarUsers.forEach((fav: any) => {
    const count = userScores.get(fav.user_id) || 0
    userScores.set(fav.user_id, count + 1)
  })

  // Get top 5 similar users
  const topUsers = Array.from(userScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  if (topUsers.length === 0) {
    return []
  }

  // Get their favorites that user hasn't seen
  const { data: recommendations } = await supabase
    .from('favorites')
    .select('tmdb_id, movies!inner(id, title)')
    .in('user_id', topUsers)
    .not('tmdb_id', 'in', `(${userMovieIds.join(',')})`)
    .limit(10)

  return (recommendations || []).map((rec: any) => ({
    movie_id: rec.tmdb_id,
    movie_title: rec.movies.title,
    reason: 'People with similar taste love this',
    algorithm_type: 'collaborative',
    confidence_score: 0.9
  }))
}

// Track when user clicks on a recommendation
export async function trackRecommendationClick(recommendationId: string) {
  const supabase = await createClient()
  
  await supabase
    .from('ai_recommendations')
    .update({
      clicked: true,
      clicked_at: new Date().toISOString()
    })
    .eq('id', recommendationId)
}

// Submit feedback on a recommendation
export async function submitRecommendationFeedback(
  recommendationId: string,
  feedback: 'liked' | 'disliked' | 'not_interested'
) {
  const supabase = await createClient()
  
  await supabase
    .from('ai_recommendations')
    .update({
      feedback,
      feedback_at: new Date().toISOString()
    })
    .eq('id', recommendationId)
}

// Clear old recommendations (older than 7 days)
export async function clearOldRecommendations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  
  await supabase
    .from('ai_recommendations')
    .delete()
    .eq('user_id', user.id)
    .lt('created_at', sevenDaysAgo)
}
