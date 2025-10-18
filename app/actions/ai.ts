'use server'

import { getAIRecommendations, summarizeReviews, searchMoviesWithAI, getPersonalizedRecommendations as getGeminiRecommendations } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'
import { searchMovies } from '@/lib/tmdb/client'
import { TMDBMovie } from '@/types/tmdb.types'

/**
 * Get AI-powered movie recommendations (exported for widgets)
 */
export async function getAIMovieRecommendations(limit: number = 6) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return []
    }

    const { data: watchHistory } = await supabase
      .from('watchlist')
      .select('movie_id, movie_title, rating')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const recommendations = await getGeminiRecommendations(
      watchHistory || [],
      userPreferences
    )

    return recommendations
  } catch (error) {
    console.error('Error getting AI recommendations:', error)
    return []
  }
}

/**
 * Get AI recommendations based on selected genres
 */
export async function getAIRecommendationsByGenres(genres: string[], limit: number = 12, language?: string) {
  try {
    console.log(`🎬 getAIRecommendationsByGenres called with genres: ${genres.join(', ')}, limit: ${limit}, language: ${language || 'all'}`)
    
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('👤 No user logged in, using fallback recommendations')
      // For non-authenticated users, use genre preferences
      return getGenreBasedRecommendations(genres, limit, language)
    }

    console.log(`👤 User logged in: ${user.id}`)

    const { data: watchHistory } = await supabase
      .from('watchlist')
      .select('movie_id, movie_title, rating')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log(`📚 Watch history: ${watchHistory?.length || 0} movies`)

    const recommendations = await getGeminiRecommendations(
      watchHistory || [],
      { preferred_genres: genres },
      limit,
      language
    )

    console.log(`✨ Gemini returned ${recommendations.length} recommendations`)

    return recommendations
  } catch (error) {
    console.error('❌ Error getting AI recommendations by genres:', error)
    return getGenreBasedRecommendations(genres, limit, language)
  }
}

async function getGenreBasedRecommendations(genres: string[], limit: number, language?: string) {
  console.log(`🎯 getGenreBasedRecommendations called with genres: ${genres.join(', ')}, limit: ${limit}, language: ${language || 'all'}`)
  
  // Fallback: Use Gemini AI with just genres
  const recommendations = await getGeminiRecommendations(
    [],
    { preferred_genres: genres },
    limit,
    language
  )

  console.log(`✨ Genre-based recommendations: ${recommendations.length} movies`)
  return recommendations
}

export async function getPersonalizedRecommendations(genres?: string[], limit: number = 10) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Not authenticated', recommendations: [] }
    }

    // Get user's watchlist and reviews to build history
    const { data: watchlistData } = await supabase
      .from('watchlist')
      .select('movie_id, movie_title, rating')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('movie_id, movie_title, rating')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Combine and deduplicate history
    const historyMap = new Map()
    
    watchlistData?.forEach(item => {
      historyMap.set(item.movie_id, {
        movieId: item.movie_id,
        title: item.movie_title,
        rating: item.rating
      })
    })
    
    reviewsData?.forEach(item => {
      if (!historyMap.has(item.movie_id)) {
        historyMap.set(item.movie_id, {
          movieId: item.movie_id,
          title: item.movie_title,
          rating: item.rating
        })
      }
    })

    const userHistory = Array.from(historyMap.values()).slice(0, 10)

    // If no history, return popular movies as fallback
    if (userHistory.length === 0) {
      return {
        success: true,
        recommendations: [],
        movies: [],
        message: 'Add movies to your watchlist to get personalized recommendations!'
      }
    }

    // Get AI recommendations with optional genre filtering
    const recommendations = await getAIRecommendations(userHistory, undefined, genres)

    // Search TMDB for each recommended movie title to get full movie details
    const moviePromises = recommendations.slice(0, 5).map(async (rec) => {
      try {
        const searchResult = await searchMovies(rec.title, 1)
        if (searchResult.results && searchResult.results.length > 0) {
          // Return the first match with AI metadata
          const movie = searchResult.results[0]
          return {
            ...movie,
            aiReason: rec.reason,
            aiSimilarity: rec.similarity
          }
        }
        return null
      } catch (error) {
        console.error(`Failed to search movie "${rec.title}":`, error)
        return null
      }
    })

    const movies = await Promise.all(moviePromises)
    const validMovies = movies.filter((movie): movie is TMDBMovie & { aiReason: string; aiSimilarity: number } => movie !== null)

    return {
      success: true,
      recommendations: recommendations.slice(0, 5),
      movies: validMovies
    }
  } catch (error) {
    console.error('Failed to get recommendations:', error)
    return {
      success: false,
      error: 'Failed to load recommendations',
      recommendations: [],
      movies: []
    }
  }
}

export async function getAIMovieSummary(movieId: number) {
  try {
    const supabase = await createClient()
    
    // Get reviews for this movie
    const { data: reviews } = await supabase
      .from('reviews')
      .select('content, rating, helpful_count')
      .eq('movie_id', movieId)
      .order('helpful_count', { ascending: false })
      .limit(10)

    if (!reviews || reviews.length === 0) {
      return { success: false, error: 'No reviews available' }
    }

    // Generate AI summary
    const summary = await summarizeReviews(
      reviews.map(r => ({
        content: r.content,
        rating: r.rating,
        helpful: r.helpful_count || 0
      }))
    )

    return {
      success: true,
      summary
    }
  } catch (error) {
    console.error('Failed to get AI summary:', error)
    return { success: false, error: 'Failed to generate summary' }
  }
}

export async function searchMoviesWithNaturalLanguage(query: string) {
  try {
    // Get AI-suggested movie titles
    const movieTitles = await searchMoviesWithAI(query)

    if (!movieTitles || movieTitles.length === 0) {
      return { success: false, results: [] }
    }

    // For now, return the titles
    // In production, you'd want to match these with TMDB API
    return {
      success: true,
      results: movieTitles
    }
  } catch (error) {
    console.error('Failed AI search:', error)
    return { success: false, results: [] }
  }
}
