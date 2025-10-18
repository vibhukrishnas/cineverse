'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Notification } from '@/types/database.types'

export interface NotificationWithActor extends Notification {
  actor?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to view notifications',
        notifications: [],
        unreadCount: 0
      }
    }

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Get notifications error:', error)
      return { 
        success: false, 
        error: 'Failed to fetch notifications',
        notifications: [],
        unreadCount: 0
      }
    }

    // Get actor details for notifications with actor_id
    const actorIds = notifications
      ?.filter(n => n.actor_id)
      .map(n => n.actor_id!) || []

    let actors: Record<string, any> = {}
    if (actorIds.length > 0) {
      const { data: actorsData, error: actorsError } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .in('id', actorIds)

      if (!actorsError && actorsData) {
        actors = actorsData.reduce((acc, actor) => {
          acc[actor.id] = actor
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Combine notifications with actor data
    const notificationsWithActors: NotificationWithActor[] = (notifications || []).map(n => ({
      ...n,
      actor: n.actor_id ? actors[n.actor_id] || null : null
    }))

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return { 
      success: true, 
      notifications: notificationsWithActors,
      unreadCount: unreadCount || 0
    }
  } catch (error) {
    console.error('Get notifications error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      notifications: [],
      unreadCount: 0
    }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to update notifications' 
      }
    }

    // Update notification
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user owns this notification

    if (error) {
      console.error('Mark notification as read error:', error)
      return { 
        success: false, 
        error: 'Failed to mark notification as read' 
      }
    }

    revalidatePath('/notifications')
    return { success: true }
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to update notifications' 
      }
    }

    // Update all unread notifications
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Mark all notifications as read error:', error)
      return { 
        success: false, 
        error: 'Failed to mark notifications as read' 
      }
    }

    revalidatePath('/notifications')
    return { success: true }
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to delete notifications' 
      }
    }

    // Delete notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user owns this notification

    if (error) {
      console.error('Delete notification error:', error)
      return { 
        success: false, 
        error: 'Failed to delete notification' 
      }
    }

    revalidatePath('/notifications')
    return { success: true }
  } catch (error) {
    console.error('Delete notification error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to delete notifications' 
      }
    }

    // Delete all read notifications
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('is_read', true)

    if (error) {
      console.error('Delete read notifications error:', error)
      return { 
        success: false, 
        error: 'Failed to delete notifications' 
      }
    }

    revalidatePath('/notifications')
    return { success: true }
  } catch (error) {
    console.error('Delete read notifications error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: true, 
        count: 0 
      }
    }

    // Get unread count
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Get unread notification count error:', error)
      return { 
        success: false, 
        error: 'Failed to get notification count',
        count: 0 
      }
    }

    return { 
      success: true, 
      count: count || 0 
    }
  } catch (error) {
    console.error('Get unread notification count error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred',
      count: 0 
    }
  }
}

/**
 * Create a manual notification (for testing or admin purposes)
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  content?: string | null,
  link?: string | null,
  actorId?: string | null,
  referenceId?: string | null
) {
  try {
    const supabase = await createClient()
    
    // Get current user (for verification if needed)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in to create notifications' 
      }
    }

    // Create notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        link,
        actor_id: actorId,
        reference_id: referenceId
      })
      .select()
      .single()

    if (error) {
      console.error('Create notification error:', error)
      return { 
        success: false, 
        error: 'Failed to create notification' 
      }
    }

    revalidatePath('/notifications')
    return { success: true, notification: data }
  } catch (error) {
    console.error('Create notification error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}
