'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMovieDetails } from '@/lib/tmdb/client'
import { TMDBMovieDetail } from '@/types/tmdb.types'

export async function addToWatchlist(movieId: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        movie_id: movieId,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Movie already in watchlist' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to add to watchlist:', error)
    return { success: false, error: 'Failed to add to watchlist' }
  }
}

export async function removeFromWatchlist(movieId: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to remove from watchlist:', error)
    return { success: false, error: 'Failed to remove from watchlist' }
  }
}

export async function isInWatchlist(movieId: number): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return false
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single()

    return !!data && !error
  } catch (error) {
    return false
  }
}

export async function getUserWatchlist() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated', data: [] }
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('movie_id, added_at')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Failed to get watchlist:', error)
    return { success: false, error: 'Failed to get watchlist', data: [] }
  }
}

// Get watchlist with full movie details from TMDB
export async function getUserWatchlistWithDetails() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated', movies: [] }
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('movie_id, added_at')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
      .limit(20) // Limit to prevent too many API calls

    if (error) {
      return { success: false, error: error.message, movies: [] }
    }

    if (!data || data.length === 0) {
      return { success: true, movies: [] }
    }

    // Fetch movie details from TMDB for each movie
    const moviePromises = data.map(async (item) => {
      try {
        const movieDetails = await getMovieDetails(item.movie_id)
        return movieDetails
      } catch (error) {
        console.error(`Failed to fetch movie ${item.movie_id}:`, error)
        return null
      }
    })

    const movies = await Promise.all(moviePromises)
    const validMovies = movies.filter((movie): movie is TMDBMovieDetail => movie !== null)

    return { success: true, movies: validMovies }
  } catch (error) {
    console.error('Failed to get watchlist with details:', error)
    return { success: false, error: 'Failed to get watchlist', movies: [] }
  }
}

export async function addToFavorites(movieId: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        movie_id: movieId,
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Movie already in favorites' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to add to favorites:', error)
    return { success: false, error: 'Failed to add to favorites' }
  }
}

export async function removeFromFavorites(movieId: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to remove from favorites:', error)
    return { success: false, error: 'Failed to remove from favorites' }
  }
}

export async function isInFavorites(movieId: number): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return false
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .single()

    return !!data && !error
  } catch (error) {
    return false
  }
}

export async function getUserFavorites() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Not authenticated', data: [] }
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('movie_id, added_at')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Failed to get favorites:', error)
    return { success: false, error: 'Failed to get favorites', data: [] }
  }
}
