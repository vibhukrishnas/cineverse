'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  getPersonDetails, 
  getPersonExternalIds, 
  getPersonMovieCredits,
  getPersonImages,
  searchPeople,
  getPopularPeople
} from '@/lib/tmdb/client'
import { revalidatePath } from 'next/cache'

// Get complete actor profile with all details
export async function getActorProfile(actorId: number) {
  try {
    const [details, externalIds, credits, images] = await Promise.all([
      getPersonDetails(actorId),
      getPersonExternalIds(actorId),
      getPersonMovieCredits(actorId),
      getPersonImages(actorId),
    ])

    return {
      success: true,
      data: {
        ...details,
        social: externalIds,
        credits,
        images: images.profiles || [],
      },
    }
  } catch (error) {
    console.error('Error fetching actor profile:', error)
    return {
      success: false,
      error: 'Failed to fetch actor profile',
    }
  }
}

// Follow an actor
export async function followActor(
  actorId: number,
  actorName: string,
  actorProfilePath: string | null,
  actorPopularity: number = 0
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('actor_follows')
      .insert({
        user_id: user.id,
        actor_id: actorId,
        actor_name: actorName,
        actor_profile_path: actorProfilePath,
        actor_popularity: actorPopularity,
      })

    if (error) {
      // Check if already following (unique constraint violation)
      if (error.code === '23505') {
        return { success: false, error: 'Already following this actor' }
      }
      throw error
    }

    revalidatePath(`/actor/${actorId}`)
    revalidatePath('/profile')
    
    return { success: true }
  } catch (error) {
    console.error('Error following actor:', error)
    return { success: false, error: 'Failed to follow actor' }
  }
}

// Unfollow an actor
export async function unfollowActor(actorId: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('actor_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('actor_id', actorId)

    if (error) throw error

    revalidatePath(`/actor/${actorId}`)
    revalidatePath('/profile')
    
    return { success: true }
  } catch (error) {
    console.error('Error unfollowing actor:', error)
    return { success: false, error: 'Failed to unfollow actor' }
  }
}

// Check if current user follows an actor
export async function isFollowingActor(actorId: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: true, isFollowing: false }
    }

    const { data, error } = await supabase
      .from('actor_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('actor_id', actorId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return { success: true, isFollowing: !!data }
  } catch (error) {
    console.error('Error checking follow status:', error)
    return { success: false, error: 'Failed to check follow status' }
  }
}

// Get follower count for an actor
export async function getActorFollowerCount(actorId: number) {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('actor_follows')
      .select('*', { count: 'exact', head: true })
      .eq('actor_id', actorId)

    if (error) throw error

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Error getting follower count:', error)
    return { success: false, count: 0 }
  }
}

// Get all actors followed by current user
export async function getUserFollowedActors() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('actor_follows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching followed actors:', error)
    return { success: false, error: 'Failed to fetch followed actors', data: [] }
  }
}

// Search actors by name (uses TMDB API)
export async function searchActors(query: string, page: number = 1) {
  try {
    const results = await searchPeople(query, page)
    return { success: true, data: results }
  } catch (error) {
    console.error('Error searching actors:', error)
    return { success: false, error: 'Failed to search actors' }
  }
}

// Get popular actors (uses TMDB API)
export async function getPopularActors(page: number = 1) {
  try {
    const results = await getPopularPeople(page)
    return { success: true, data: results }
  } catch (error) {
    console.error('Error fetching popular actors:', error)
    return { success: false, error: 'Failed to fetch popular actors' }
  }
}

// Get recent movies from followed actors
export async function getFollowedActorsRecentMovies(limit: number = 10) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: true, data: [] }
    }

    // Get followed actors
    const { data: followedActors, error } = await supabase
      .from('actor_follows')
      .select('actor_id, actor_name, actor_profile_path')
      .eq('user_id', user.id)
      .order('actor_popularity', { ascending: false })
      .limit(limit)

    if (error) throw error

    if (!followedActors || followedActors.length === 0) {
      return { success: true, data: [] }
    }

    // Fetch recent movies for each actor from TMDB
    const actorsWithMovies = await Promise.all(
      followedActors.map(async (actor) => {
        try {
          const credits = await getPersonMovieCredits(actor.actor_id)
          
          // Get movies from last 2 years
          const twoYearsAgo = new Date()
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
          
          const recentMovies = credits.cast
            .filter((movie) => {
              const releaseDate = movie.release_date ? new Date(movie.release_date) : null
              return releaseDate && releaseDate >= twoYearsAgo
            })
            .sort((a, b) => {
              const dateA = new Date(a.release_date || 0)
              const dateB = new Date(b.release_date || 0)
              return dateB.getTime() - dateA.getTime()
            })
            .slice(0, 3) // Top 3 recent movies per actor

          return {
            actor_id: actor.actor_id,
            actor_name: actor.actor_name,
            actor_profile_path: actor.actor_profile_path,
            recent_movies: recentMovies,
          }
        } catch (err) {
          console.error(`Error fetching movies for actor ${actor.actor_id}:`, err)
          return {
            actor_id: actor.actor_id,
            actor_name: actor.actor_name,
            actor_profile_path: actor.actor_profile_path,
            recent_movies: [],
          }
        }
      })
    )

    // Filter out actors with no recent movies
    const actorsWithRecentMovies = actorsWithMovies.filter(
      (actor) => actor.recent_movies.length > 0
    )

    return { success: true, data: actorsWithRecentMovies }
  } catch (error) {
    console.error('Error fetching followed actors recent movies:', error)
    return { success: false, error: 'Failed to fetch recent movies', data: [] }
  }
}

// Get actor follow stats for profile page
export async function getActorFollowStats() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: true, totalFollowing: 0, recentlyFollowed: [] }
    }

    // Get total following count
    const { count } = await supabase
      .from('actor_follows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get recently followed actors (last 5)
    const { data: recentlyFollowed } = await supabase
      .from('actor_follows')
      .select('actor_id, actor_name, actor_profile_path, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      success: true,
      totalFollowing: count || 0,
      recentlyFollowed: recentlyFollowed || [],
    }
  } catch (error) {
    console.error('Error fetching actor follow stats:', error)
    return { success: false, totalFollowing: 0, recentlyFollowed: [] }
  }
}
