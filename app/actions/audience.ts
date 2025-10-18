'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  AudienceType,
  MovieAudienceClassification,
  UserAudiencePreference,
  AudienceEvent,
  MovieAudienceScore,
} from '@/types/audience.types'

// ============================================
// Audience Types
// ============================================

export async function getAudienceTypes(): Promise<AudienceType[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audience_types')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching audience types:', error)
    return []
  }

  return data || []
}

export async function getAudienceTypeByName(name: string): Promise<AudienceType | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audience_types')
    .select('*')
    .eq('name', name)
    .single()

  if (error) {
    console.error('Error fetching audience type:', error)
    return null
  }

  return data
}

// ============================================
// Movie Classifications
// ============================================

export async function getMovieAudienceClassifications(
  tmdbId: number
): Promise<MovieAudienceScore[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_movie_audience_classifications', {
    movie_tmdb_id: tmdbId,
  })

  if (error) {
    console.error('Error fetching movie classifications:', error)
    return []
  }

  return data || []
}

export async function autoClassifyMovie(
  tmdbId: number,
  genres: string[],
  voteAverage: number,
  budget: number = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('auto_classify_movie', {
      movie_tmdb_id: tmdbId,
      genres,
      vote_average: voteAverage,
      budget,
    })

    if (error) {
      console.error('Error auto-classifying movie:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/movie/${tmdbId}`)
    return { success: true }
  } catch (error) {
    console.error('Error auto-classifying movie:', error)
    return { success: false, error: 'Failed to classify movie' }
  }
}

export async function getRecommendedMoviesByAudience(
  audienceType: string,
  minScore: number = 0.7,
  limit: number = 20
): Promise<number[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_recommended_movies_by_audience', {
    audience_type_name: audienceType,
    min_score: minScore,
    limit_count: limit,
  })

  if (error) {
    console.error('Error fetching recommended movies:', error)
    return []
  }

  return data?.map((item: any) => item.tmdb_id) || []
}

// ============================================
// User Preferences
// ============================================

export async function getUserAudiencePreferences(): Promise<UserAudiencePreference[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_audience_preferences')
    .select('*, audience_type:audience_types(*)')
    .eq('user_id', user.id)
    .order('preference_level', { ascending: false })

  if (error) {
    console.error('Error fetching user preferences:', error)
    return []
  }

  return data || []
}

export async function setUserAudiencePreference(
  audienceTypeId: string,
  preferenceLevel: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase.from('user_audience_preferences').upsert(
      {
        user_id: user.id,
        audience_type_id: audienceTypeId,
        preference_level: preferenceLevel,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,audience_type_id',
      }
    )

    if (error) {
      console.error('Error setting preference:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error setting preference:', error)
    return { success: false, error: 'Failed to set preference' }
  }
}

export async function deleteUserAudiencePreference(
  audienceTypeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('user_audience_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('audience_type_id', audienceTypeId)

    if (error) {
      console.error('Error deleting preference:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error deleting preference:', error)
    return { success: false, error: 'Failed to delete preference' }
  }
}

// ============================================
// Audience Events
// ============================================

export async function getAudienceEvents(
  tmdbId: number,
  audienceType?: string
): Promise<AudienceEvent[]> {
  const supabase = await createClient()
  let query = supabase
    .from('audience_events')
    .select('*, audience_type:audience_types(*)')
    .eq('tmdb_id', tmdbId)
    .eq('is_active', true)
    .gte('screening_time', new Date().toISOString())
    .order('screening_time')

  if (audienceType) {
    const audienceTypeData = await getAudienceTypeByName(audienceType)
    if (audienceTypeData) {
      query = query.eq('audience_type_id', audienceTypeData.id)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audience events:', error)
    return []
  }

  return data || []
}

export async function getAllUpcomingAudienceEvents(
  audienceType?: string,
  limit: number = 50
): Promise<AudienceEvent[]> {
  const supabase = await createClient()
  let query = supabase
    .from('audience_events')
    .select('*, audience_type:audience_types(*)')
    .eq('is_active', true)
    .gte('screening_time', new Date().toISOString())
    .order('screening_time')
    .limit(limit)

  if (audienceType) {
    const audienceTypeData = await getAudienceTypeByName(audienceType)
    if (audienceTypeData) {
      query = query.eq('audience_type_id', audienceTypeData.id)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audience events:', error)
    return []
  }

  return data || []
}
