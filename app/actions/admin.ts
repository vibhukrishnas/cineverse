'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =====================================================
// PERMISSION CHECKS
// =====================================================

export async function checkAdminPermission(requiredRole: 'moderator' | 'admin' | 'super_admin' = 'admin') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { authorized: false, error: 'Not authenticated' }
  }

  const { data: hasPermission } = await supabase.rpc('has_permission', {
    check_user_id: user.id,
    required_role: requiredRole
  })

  if (!hasPermission) {
    return { authorized: false, error: 'Insufficient permissions' }
  }

  return { authorized: true, user }
}

export async function getUserRole(userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const targetUserId = userId || user?.id
  if (!targetUserId) return { role: 'user' }

  const { data: role } = await supabase.rpc('get_user_role', {
    check_user_id: targetUserId
  })

  return { role: role || 'user' }
}

// =====================================================
// ADMIN LOG
// =====================================================

export async function createAdminLog(
  action: string,
  targetType: string,
  targetId: string,
  reason?: string,
  metadata?: Record<string, any>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('admin_logs')
    .insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      reason,
      metadata: metadata || {}
    })

  if (error) {
    console.error('Failed to create admin log:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// =====================================================
// USER MANAGEMENT
// =====================================================

export async function getAdminUsers(params: {
  search?: string
  role?: string
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, users: [], total: 0 }
  }

  const supabase = await createClient()
  const page = params.page || 1
  const limit = params.limit || 25
  const offset = (page - 1) * limit

  // Get users with their roles and stats
  let query = supabase
    .from('user_stats')
    .select(`
      user_id,
      karma_points,
      review_count,
      helpful_votes,
      created_at,
      user_roles!inner(role)
    `, { count: 'exact' })

  // Apply filters
  if (params.role && params.role !== 'all') {
    query = query.eq('user_roles.role', params.role)
  }

  // Apply search (we'll need to join with auth.users in a separate query)
  // For now, just get the data and we'll enrich it

  const { data, count, error } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, users: [], total: 0 }
  }

  // Get user metadata from auth.users
  const userIds = data?.map(u => u.user_id) || []
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  
  const enrichedUsers = data?.map(user => {
    const authUser = authUsers?.users.find(u => u.id === user.user_id)
    return {
      ...user,
      email: authUser?.email,
      created_at: authUser?.created_at || user.created_at
    }
  })

  return {
    success: true,
    users: enrichedUsers || [],
    total: count || 0,
    page,
    limit
  }
}

export async function banUser(params: {
  userId: string
  reason: string
  banType: 'temporary' | 'permanent' | 'shadow' | 'ip'
  duration?: number // days
  ipAddress?: string
}) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const bannedUntil = params.banType === 'temporary' && params.duration
    ? new Date(Date.now() + params.duration * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('bans')
    .insert({
      user_id: params.userId,
      admin_id: authCheck.user!.id,
      reason: params.reason,
      ban_type: params.banType,
      duration: params.duration,
      banned_until: bannedUntil,
      ip_address: params.ipAddress,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Log the action
  await createAdminLog('ban_user', 'user', params.userId, params.reason, {
    ban_type: params.banType,
    duration: params.duration
  })

  revalidatePath('/admin')
  return { success: true, data }
}

export async function unbanUser(userId: string, reason?: string) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('bans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('unban_user', 'user', userId, reason)
  revalidatePath('/admin')
  
  return { success: true }
}

export async function updateUserRole(userId: string, newRole: string) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  // Check if user already has a role
  const { data: existing } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: newRole,
        assigned_by: authCheck.user!.id
      })

    if (error) {
      return { success: false, error: error.message }
    }
  }

  await createAdminLog('update_role', 'user', userId, `Changed role to ${newRole}`)
  revalidatePath('/admin')
  
  return { success: true }
}

export async function deleteUser(userId: string, reason: string) {
  const authCheck = await checkAdminPermission('super_admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  // Log before deletion
  await createAdminLog('delete_user', 'user', userId, reason)

  // Delete user (cascade will handle related data)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

// =====================================================
// DASHBOARD STATS
// =====================================================

export async function getDashboardStats() {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  // Total users
  const { data: usersData } = await supabase.auth.admin.listUsers()
  const totalUsers = usersData?.users.length || 0

  // Active users (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: activeUsers } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', oneDayAgo)

  // Total reviews
  const { count: totalReviews } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })

  // Pending reports
  const { count: pendingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Total channels
  const { count: totalChannels } = await supabase
    .from('channels')
    .select('*', { count: 'exact', head: true })

  // Get growth stats (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  
  const { count: newUsersThisWeek } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)

  const { count: reviewsThisWeek } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)

  return {
    success: true,
    stats: {
      totalUsers,
      activeUsers: activeUsers || 0,
      totalReviews: totalReviews || 0,
      pendingReports: pendingReports || 0,
      totalChannels: totalChannels || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      reviewsThisWeek: reviewsThisWeek || 0,
      userGrowth: totalUsers > 0 ? ((newUsersThisWeek || 0) / totalUsers * 100).toFixed(1) : '0',
      reviewGrowth: totalReviews ? ((reviewsThisWeek || 0) / totalReviews! * 100).toFixed(1) : '0'
    }
  }
}

export async function getUserSignupTrend(days: number = 30) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, data: [] }
  }

  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('user_stats')
    .select('created_at')
    .gte('created_at', startDate)
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  // Group by day
  const grouped = data?.reduce((acc: Record<string, number>, user) => {
    const date = new Date(user.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const trend = Object.entries(grouped || {}).map(([date, count]) => ({
    date,
    signups: count
  }))

  return { success: true, data: trend }
}

export async function getReviewsTrend(days: number = 30) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, data: [] }
  }

  const supabase = await createClient()
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('reviews')
    .select('created_at')
    .gte('created_at', startDate)
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, error: error.message, data: [] }
  }

  // Group by day
  const grouped = data?.reduce((acc: Record<string, number>, review) => {
    const date = new Date(review.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const trend = Object.entries(grouped || {}).map(([date, count]) => ({
    date,
    reviews: count
  }))

  return { success: true, data: trend }
}

// =====================================================
// REPORTS MANAGEMENT
// =====================================================

export async function getReports(params: {
  status?: 'pending' | 'reviewed' | 'approved' | 'removed' | 'dismissed' | 'all'
  reportedType?: 'review' | 'comment' | 'post' | 'user' | 'all'
  page?: number
  limit?: number
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, reports: [], total: 0 }
  }

  const supabase = await createClient()
  const page = params.page || 1
  const limit = params.limit || 25
  const offset = (page - 1) * limit

  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(id, email),
      reported_user:reported_user_id(id, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.reportedType && params.reportedType !== 'all') {
    query = query.eq('reported_type', params.reportedType)
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, reports: [], total: 0 }
  }

  return { success: true, reports: data || [], total: count || 0, page, limit }
}

export async function updateReport(reportId: string, status: 'approved' | 'removed' | 'dismissed', reason?: string) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('reports')
    .update({
      status,
      reviewed_by: authCheck.user!.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: reason
    })
    .eq('id', reportId)

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('review_report', 'report', reportId, reason)
  revalidatePath('/admin/moderation')

  return { success: true }
}

// =====================================================
// FLAGS MANAGEMENT
// =====================================================

export async function getFlags(params: {
  status?: 'pending' | 'approved' | 'removed' | 'dismissed' | 'all'
  contentType?: 'review' | 'comment' | 'post' | 'all'
  flagType?: 'ai_toxicity' | 'ai_spam' | 'ai_nsfw' | 'manual' | 'multiple_reports' | 'all'
  page?: number
  limit?: number
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, flags: [], total: 0 }
  }

  const supabase = await createClient()
  const page = params.page || 1
  const limit = params.limit || 25
  const offset = (page - 1) * limit

  let query = supabase
    .from('flags')
    .select(`
      *,
      author:author_id(id, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.contentType && params.contentType !== 'all') {
    query = query.eq('content_type', params.contentType)
  }

  if (params.flagType && params.flagType !== 'all') {
    query = query.eq('flag_type', params.flagType)
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, flags: [], total: 0 }
  }

  return { success: true, flags: data || [], total: count || 0, page, limit }
}

export async function updateFlag(flagId: string, status: 'approved' | 'removed' | 'dismissed', reason?: string) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  // Get flag details
  const { data: flag } = await supabase
    .from('flags')
    .select('*')
    .eq('id', flagId)
    .single()

  if (!flag) {
    return { success: false, error: 'Flag not found' }
  }

  // Update flag status
  const { error: flagError } = await supabase
    .from('flags')
    .update({
      status,
      reviewed_by: authCheck.user!.id,
      reviewed_at: new Date().toISOString(),
      is_hidden: status === 'removed',
      action_taken: reason
    })
    .eq('id', flagId)

  if (flagError) {
    return { success: false, error: flagError.message }
  }

  // If removing, delete the actual content
  if (status === 'removed') {
    const tableName = flag.content_type === 'review' ? 'reviews' : 
                      flag.content_type === 'comment' ? 'comments' : 
                      flag.content_type === 'post' ? 'posts' : null

    if (tableName) {
      await supabase.from(tableName).delete().eq('id', flag.content_id)
    }
  }

  await createAdminLog(`${status}_flag`, flag.content_type, flag.content_id, reason)
  revalidatePath('/admin/moderation')

  return { success: true }
}

// =====================================================
// APPEALS MANAGEMENT
// =====================================================

export async function getAppeals(params: {
  status?: 'pending' | 'approved' | 'denied' | 'all'
  page?: number
  limit?: number
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, appeals: [], total: 0 }
  }

  const supabase = await createClient()
  const page = params.page || 1
  const limit = params.limit || 25
  const offset = (page - 1) * limit

  let query = supabase
    .from('appeals')
    .select(`
      *,
      user:user_id(id, email),
      ban:ban_id(*),
      reviewer:reviewed_by(id, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, appeals: [], total: 0 }
  }

  return { success: true, appeals: data || [], total: count || 0, page, limit }
}

export async function reviewAppeal(appealId: string, decision: 'approved' | 'denied', notes?: string) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  // Get appeal details
  const { data: appeal } = await supabase
    .from('appeals')
    .select('*, ban:ban_id(*)')
    .eq('id', appealId)
    .single()

  if (!appeal) {
    return { success: false, error: 'Appeal not found' }
  }

  // Update appeal
  const { error: appealError } = await supabase
    .from('appeals')
    .update({
      status: decision,
      reviewed_by: authCheck.user!.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes
    })
    .eq('id', appealId)

  if (appealError) {
    return { success: false, error: appealError.message }
  }

  // If approved, lift the ban
  if (decision === 'approved' && appeal.ban_id) {
    await supabase
      .from('bans')
      .update({ is_active: false })
      .eq('id', appeal.ban_id)
  }

  await createAdminLog(`${decision}_appeal`, 'appeal', appealId, notes)
  revalidatePath('/admin/appeals')

  return { success: true }
}

// =====================================================
// PLATFORM SETTINGS
// =====================================================

export async function getPlatformSettings() {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, settings: {} }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .order('key', { ascending: true })

  if (error) {
    return { success: false, error: error.message, settings: {} }
  }

  // Convert to key-value object
  const settings = data?.reduce((acc: Record<string, any>, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})

  return { success: true, settings: settings || {} }
}

export async function updatePlatformSetting(key: string, value: any) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('platform_settings')
    .update({
      value,
      updated_by: authCheck.user!.id,
      updated_at: new Date().toISOString()
    })
    .eq('key', key)

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('update_setting', 'setting', key, `Changed to: ${JSON.stringify(value)}`)
  revalidatePath('/admin/settings')

  return { success: true }
}

// =====================================================
// FEATURED CONTENT
// =====================================================

export async function getFeaturedContent(params: {
  contentType?: 'movie' | 'channel' | 'user' | 'review' | 'all'
  isActive?: boolean
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, content: [] }
  }

  const supabase = await createClient()

  let query = supabase
    .from('featured_content')
    .select('*')
    .order('display_order', { ascending: true })

  if (params.contentType && params.contentType !== 'all') {
    query = query.eq('content_type', params.contentType)
  }

  if (params.isActive !== undefined) {
    query = query.eq('is_active', params.isActive)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, content: [] }
  }

  return { success: true, content: data || [] }
}

export async function createFeaturedContent(params: {
  contentType: 'movie' | 'channel' | 'user' | 'review'
  contentId: string
  title: string
  description?: string
  imageUrl?: string
  displayOrder?: number
  startDate?: string
  endDate?: string
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('featured_content')
    .insert({
      content_type: params.contentType,
      content_id: params.contentId,
      title: params.title,
      description: params.description,
      image_url: params.imageUrl,
      display_order: params.displayOrder || 0,
      start_date: params.startDate,
      end_date: params.endDate,
      created_by: authCheck.user!.id,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('feature_content', params.contentType, params.contentId)
  revalidatePath('/')

  return { success: true, data }
}

export async function updateFeaturedContent(id: string, updates: {
  isActive?: boolean
  displayOrder?: number
  startDate?: string
  endDate?: string
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const updateData: any = {}
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder
  if (updates.startDate) updateData.start_date = updates.startDate
  if (updates.endDate) updateData.end_date = updates.endDate

  const { error } = await supabase
    .from('featured_content')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('update_featured_content', 'featured_content', id)
  revalidatePath('/')

  return { success: true }
}

export async function deleteFeaturedContent(id: string) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('featured_content')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('delete_featured_content', 'featured_content', id)
  revalidatePath('/')

  return { success: true }
}

// =====================================================
// MODERATION NOTES
// =====================================================

export async function getModerationNotes(targetType: string, targetId: string) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, notes: [] }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('moderation_notes')
    .select(`
      *,
      moderator:moderator_id(id, email)
    `)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message, notes: [] }
  }

  return { success: true, notes: data || [] }
}

export async function createModerationNote(params: {
  targetType: string
  targetId: string
  note: string
  severity?: 'info' | 'warning' | 'critical'
  isInternal?: boolean
}) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('moderation_notes')
    .insert({
      target_type: params.targetType,
      target_id: params.targetId,
      note: params.note,
      severity: params.severity || 'info',
      is_internal: params.isInternal !== false,
      moderator_id: authCheck.user!.id
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('add_moderation_note', params.targetType, params.targetId)

  return { success: true, data }
}

// =====================================================
// ANNOUNCEMENTS
// =====================================================

export async function getAnnouncements(isActive?: boolean) {
  const supabase = await createClient()

  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
    
    // Filter by date if active
    if (isActive) {
      const now = new Date().toISOString()
      query = query
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
    }
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message, announcements: [] }
  }

  return { success: true, announcements: data || [] }
}

export async function createAnnouncement(params: {
  title: string
  content: string
  severity?: 'info' | 'warning' | 'critical'
  targetAudience?: 'all' | 'users' | 'moderators' | 'admins'
  displayLocation?: 'banner' | 'modal' | 'email'
  scheduledFor?: string
  expiresAt?: string
}) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: params.title,
      content: params.content,
      severity: params.severity || 'info',
      target_audience: params.targetAudience || 'all',
      display_location: params.displayLocation || 'banner',
      scheduled_for: params.scheduledFor,
      expires_at: params.expiresAt,
      created_by: authCheck.user!.id,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('create_announcement', 'announcement', data.id)
  revalidatePath('/')

  return { success: true, data }
}

export async function updateAnnouncement(id: string, updates: {
  isActive?: boolean
  expiresAt?: string
}) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const updateData: any = {}
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  if (updates.expiresAt) updateData.expires_at = updates.expiresAt

  const { error } = await supabase
    .from('announcements')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('update_announcement', 'announcement', id)
  revalidatePath('/')

  return { success: true }
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export async function bulkBanUsers(params: {
  userIds: string[]
  reason: string
  banType: 'temporary' | 'permanent' | 'shadow'
  duration?: number
}) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()
  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const userId of params.userIds) {
    const result = await banUser({
      userId,
      reason: params.reason,
      banType: params.banType,
      duration: params.duration
    })

    if (result.success) {
      results.success++
    } else {
      results.failed++
      results.errors.push(`${userId}: ${result.error}`)
    }
  }

  await createAdminLog('bulk_ban_users', 'user', params.userIds.join(','), params.reason, {
    count: params.userIds.length,
    results
  })

  return { success: true, results }
}

export async function bulkDeleteContent(params: {
  contentType: 'review' | 'comment' | 'post'
  contentIds: string[]
  reason: string
}) {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()
  const tableName = params.contentType + 's'

  const { error } = await supabase
    .from(tableName)
    .delete()
    .in('id', params.contentIds)

  if (error) {
    return { success: false, error: error.message }
  }

  await createAdminLog('bulk_delete_content', params.contentType, params.contentIds.join(','), params.reason, {
    count: params.contentIds.length
  })

  revalidatePath('/admin/moderation')

  return { success: true, deleted: params.contentIds.length }
}

// =====================================================
// ANALYTICS & EXPORTS
// =====================================================

export async function getModeratorStats(moderatorId?: string) {
  const authCheck = await checkAdminPermission('moderator')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error, stats: null }
  }

  const supabase = await createClient()
  const targetId = moderatorId || authCheck.user!.id

  // Get action counts
  const { data: actionCounts } = await supabase
    .from('admin_logs')
    .select('action')
    .eq('admin_id', targetId)

  const actions = actionCounts?.reduce((acc: Record<string, number>, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {})

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('admin_logs')
    .select('*')
    .eq('admin_id', targetId)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    success: true,
    stats: {
      totalActions: actionCounts?.length || 0,
      actionBreakdown: actions || {},
      recentActivity: recentActivity || []
    }
  }
}

export async function exportUserData(format: 'csv' | 'json' = 'csv') {
  const authCheck = await checkAdminPermission('admin')
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const result = await getAdminUsers({ limit: 10000 })
  
  if (!result.success) {
    return result
  }

  if (format === 'json') {
    return { success: true, data: result.users }
  }

  // Convert to CSV
  const headers = ['ID', 'Email', 'Created At', 'Status']
  const rows = result.users.map((user: any) => [
    user.id,
    user.email,
    new Date(user.created_at).toISOString(),
    user.is_banned ? 'Banned' : 'Active'
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

  await createAdminLog('export_user_data', 'export', 'users', `Format: ${format}`)

  return { success: true, data: csv, format }
}
