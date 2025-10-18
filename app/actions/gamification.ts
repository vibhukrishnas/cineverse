'use server'

import { createClient } from '@/lib/supabase/server'
import { KARMA_VALUES, USER_LEVELS, calculateLevelSync } from '@/lib/gamification/constants'

// Async wrapper for server action compatibility
export async function calculateLevel(karma: number) {
  return calculateLevelSync(karma)
}

// Get karma values (server action wrapper)
export async function getKarmaValues() {
  return KARMA_VALUES
}

// Get user levels (server action wrapper)
export async function getUserLevels() {
  return USER_LEVELS
}

// Award karma points to a user
export async function awardKarma(
  userId: string,
  points: number,
  reason: string,
  referenceId?: string,
  referenceType?: string
) {
  try {
    const supabase = await createClient()

    // Call the database function to award karma
    const { error } = await supabase.rpc('award_karma', {
      p_user_id: userId,
      p_points: points,
      p_reason: reason,
      p_reference_id: referenceId || null,
      p_reference_type: referenceType || null,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Failed to award karma:', error)
    return { success: false, error }
  }
}

// Get user stats
export async function getUserStats(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return { success: true, stats: data }
  } catch (error) {
    console.error('Failed to get user stats:', error)
    return { success: false, error, stats: null }
  }
}

// Initialize user stats (call when user signs up)
export async function initializeUserStats(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        karma_points: 0,
        level: 1,
        level_name: 'Newbie',
      })
      .select()
      .single()

    if (error) {
      // If user stats already exist, just return them
      if (error.code === '23505') {
        return await getUserStats(userId)
      }
      throw error
    }

    return { success: true, stats: data }
  } catch (error) {
    console.error('Failed to initialize user stats:', error)
    return { success: false, error, stats: null }
  }
}

// Update specific stat counts
export async function updateUserStat(
  userId: string,
  statField: string,
  increment: number = 1
) {
  try {
    const supabase = await createClient()

    // Get current value
    const { data: current } = await supabase
      .from('user_stats')
      .select(statField)
      .eq('user_id', userId)
      .single()

    if (!current) {
      // Initialize if doesn't exist
      await initializeUserStats(userId)
      return updateUserStat(userId, statField, increment)
    }

    const currentValue = (current as any)[statField] || 0
    const newValue = Math.max(0, currentValue + increment)

    const { error } = await supabase
      .from('user_stats')
      .update({ [statField]: newValue })
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Failed to update user stat:', error)
    return { success: false, error }
  }
}

// Get karma transactions history
export async function getKarmaHistory(userId: string, limit: number = 50) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('karma_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, transactions: data }
  } catch (error) {
    console.error('Failed to get karma history:', error)
    return { success: false, error, transactions: [] }
  }
}

// Get leaderboard (top users by karma)
export async function getKarmaLeaderboard(limit: number = 100) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        *,
        user:auth.users!inner(email, raw_user_meta_data)
      `)
      .order('karma_points', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, leaderboard: data }
  } catch (error) {
    console.error('Failed to get leaderboard:', error)
    return { success: false, error, leaderboard: [] }
  }
}

// Get most helpful users leaderboard
export async function getHelpfulLeaderboard(limit: number = 100) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        *,
        user:auth.users!inner(email, raw_user_meta_data)
      `)
      .order('helpful_votes_received', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, leaderboard: data }
  } catch (error) {
    console.error('Failed to get helpful leaderboard:', error)
    return { success: false, error, leaderboard: [] }
  }
}

// Get most active users leaderboard
export async function getActiveLeaderboard(limit: number = 100) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_stats')
      .select(`
        *,
        user:auth.users!inner(email, raw_user_meta_data)
      `)
      .order('reviews_count', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, leaderboard: data }
  } catch (error) {
    console.error('Failed to get active leaderboard:', error)
    return { success: false, error, leaderboard: [] }
  }
}

// Calculate progress to next level
export async function getLevelProgress(userId: string) {
  try {
    const result = await getUserStats(userId)
    if (!result.success || !result.stats) {
      return { success: false, progress: 0, nextLevel: null }
    }

    const currentKarma = result.stats.karma_points
    const currentLevel = await calculateLevel(currentKarma)
    const nextLevelIndex = USER_LEVELS.findIndex(l => l.level === currentLevel.level) + 1

    if (nextLevelIndex >= USER_LEVELS.length) {
      // Max level reached
      return {
        success: true,
        progress: 100,
        nextLevel: null,
        currentLevel,
        karmaNeeded: 0,
      }
    }

    const nextLevel = USER_LEVELS[nextLevelIndex]
    const karmaInCurrentLevel = currentKarma - currentLevel.minKarma
    const karmaNeededForNextLevel = nextLevel.minKarma - currentLevel.minKarma
    const progress = (karmaInCurrentLevel / karmaNeededForNextLevel) * 100

    return {
      success: true,
      progress: Math.round(progress),
      nextLevel,
      currentLevel,
      karmaNeeded: nextLevel.minKarma - currentKarma,
    }
  } catch (error) {
    console.error('Failed to calculate level progress:', error)
    return { success: false, error, progress: 0, nextLevel: null }
  }
}
