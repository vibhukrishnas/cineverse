'use server'

import { createClient } from '@/lib/supabase/server'
import { awardKarma } from './gamification'

export interface Badge {
  id: string
  badge_type: string
  name: string
  description: string
  icon: string
  color: string
  requirement_type: string
  requirement_value: number
  requirement_meta?: any
  tier: string
  rarity: string
  karma_reward: number
}

export interface UserAchievement {
  id: string
  user_id: string
  badge_id: string
  progress: number
  required: number
  completed: boolean
  earned_at?: string
  badge?: Badge
}

// Get all available badges
export async function getAllBadges() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('requirement_value', { ascending: true })

    if (error) throw error

    return { success: true, badges: data }
  } catch (error) {
    console.error('Failed to get badges:', error)
    return { success: false, error, badges: [] }
  }
}

// Get user's achievements
export async function getUserAchievements(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error} = await supabase
      .from('user_achievements')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false, nullsFirst: false })

    if (error) throw error

    return { success: true, achievements: data }
  } catch (error) {
    console.error('Failed to get user achievements:', error)
    return { success: false, error, achievements: [] }
  }
}

// Get user's earned badges only
export async function getUserBadges(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .eq('completed', true)
      .order('earned_at', { ascending: false })

    if (error) throw error

    return { success: true, badges: data }
  } catch (error) {
    console.error('Failed to get user badges:', error)
    return { success: false, error, badges: [] }
  }
}

// Initialize achievement tracking for a user
export async function initializeUserAchievements(userId: string) {
  try {
    const supabase = await createClient()

    // Get all badges
    const { data: badges } = await supabase.from('badges').select('*')

    if (!badges) return { success: false }

    // Create achievement entries for all badges
    const achievements = badges.map(badge => ({
      user_id: userId,
      badge_id: badge.id,
      progress: 0,
      required: badge.requirement_value,
      completed: false,
    }))

    const { error } = await supabase
      .from('user_achievements')
      .upsert(achievements, { onConflict: 'user_id,badge_id' })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Failed to initialize achievements:', error)
    return { success: false, error }
  }
}

// Update achievement progress
export async function updateAchievementProgress(
  userId: string,
  badgeType: string,
  newProgress: number
) {
  try {
    const supabase = await createClient()

    // Get the badge
    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('badge_type', badgeType)
      .single()

    if (!badge) return { success: false, error: 'Badge not found' }

    // Get current achievement
    const { data: achievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single()

    if (!achievement) {
      // Create achievement entry
      const { data: newAchievement, error: createError } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          progress: newProgress,
          required: badge.requirement_value,
          completed: newProgress >= badge.requirement_value,
          earned_at: newProgress >= badge.requirement_value ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (createError) throw createError

      // Check if badge was earned
      if (newAchievement.completed) {
        await awardKarma(userId, badge.karma_reward, `Badge earned: ${badge.name}`, badge.id, 'badge')
      }

      return { success: true, badgeEarned: newAchievement.completed, badge }
    }

    // Don't update if already completed
    if (achievement.completed) {
      return { success: true, badgeEarned: false }
    }

    // Update progress
    const completed = newProgress >= badge.requirement_value
    const { error } = await supabase
      .from('user_achievements')
      .update({
        progress: newProgress,
        completed,
        earned_at: completed ? new Date().toISOString() : null,
      })
      .eq('user_id', userId)
      .eq('badge_id', badge.id)

    if (error) throw error

    // Award karma if badge was just earned
    if (completed && !achievement.completed) {
      await awardKarma(userId, badge.karma_reward, `Badge earned: ${badge.name}`, badge.id, 'badge')
    }

    return { success: true, badgeEarned: completed && !achievement.completed, badge }
  } catch (error) {
    console.error('Failed to update achievement progress:', error)
    return { success: false, error, badgeEarned: false }
  }
}

// Check and update multiple achievements based on user stats
export async function checkAndUpdateAchievements(userId: string) {
  try {
    const supabase = await createClient()

    // Get user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!stats) return { success: false }

    const newBadges: Badge[] = []

    // Check review count badges
    const reviewBadges = [
      { type: 'first_review', count: 1 },
      { type: 'prolific_critic', count: 50 },
      { type: 'master_reviewer', count: 200 },
      { type: 'legendary_critic', count: 500 },
    ]

    for (const { type, count } of reviewBadges) {
      if (stats.reviews_count >= count) {
        const result = await updateAchievementProgress(userId, type, stats.reviews_count)
        if (result.badgeEarned && result.badge) {
          newBadges.push(result.badge)
        }
      }
    }

    // Check follower badges
    const followerBadges = [
      { type: 'social_butterfly', count: 100 },
      { type: 'influencer', count: 500 },
    ]

    for (const { type, count } of followerBadges) {
      if (stats.followers_count >= count) {
        const result = await updateAchievementProgress(userId, type, stats.followers_count)
        if (result.badgeEarned && result.badge) {
          newBadges.push(result.badge)
        }
      }
    }

    // Check helpful votes badges
    const helpfulBadges = [
      { type: 'helpful_helper', count: 100 },
      { type: 'community_hero', count: 500 },
    ]

    for (const { type, count } of helpfulBadges) {
      if (stats.helpful_votes_received >= count) {
        const result = await updateAchievementProgress(userId, type, stats.helpful_votes_received)
        if (result.badgeEarned && result.badge) {
          newBadges.push(result.badge)
        }
      }
    }

    return { success: true, newBadges }
  } catch (error) {
    console.error('Failed to check achievements:', error)
    return { success: false, error, newBadges: [] }
  }
}

// Check genre expert badges
export async function checkGenreExpertBadge(userId: string, genreName: string) {
  try {
    const supabase = await createClient()

    // Count reviews for this genre
    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .contains('genres', [genreName])

    if (error) throw error

    // Badge type map
    const genreBadgeMap: Record<string, string> = {
      'Action': 'action_expert',
      'Comedy': 'comedy_expert',
      'Drama': 'drama_expert',
      'Science Fiction': 'scifi_expert',
      'Horror': 'horror_expert',
    }

    const badgeType = genreBadgeMap[genreName]
    if (!badgeType) return { success: true, badgeEarned: false }

    const result = await updateAchievementProgress(userId, badgeType, count || 0)
    
    return {
      success: true,
      badgeEarned: result.badgeEarned,
      badge: result.badge,
    }
  } catch (error) {
    console.error('Failed to check genre badge:', error)
    return { success: false, error, badgeEarned: false }
  }
}

// Get achievement progress for display
export async function getAchievementProgress(userId: string, badgeType: string) {
  try {
    const supabase = await createClient()

    const { data: badge } = await supabase
      .from('badges')
      .select('*')
      .eq('badge_type', badgeType)
      .single()

    if (!badge) return { success: false, progress: 0 }

    const { data: achievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single()

    if (!achievement) return { success: true, progress: 0, required: badge.requirement_value }

    const percentage = (achievement.progress / achievement.required) * 100

    return {
      success: true,
      progress: achievement.progress,
      required: achievement.required,
      percentage: Math.round(percentage),
      completed: achievement.completed,
      earned_at: achievement.earned_at,
    }
  } catch (error) {
    console.error('Failed to get achievement progress:', error)
    return { success: false, error, progress: 0 }
  }
}
