'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Channel, Post, Comment, ChannelMember, Vote } from '@/types/database.types'

// ============================================
// Channel Actions
// ============================================

export interface ChannelWithStats extends Channel {
  is_member?: boolean
  is_moderator?: boolean
}

export async function getChannels(options?: {
  type?: 'genre' | 'regional' | 'topic' | 'custom'
  limit?: number
  offset?: number
  search?: string
  sort?: 'members' | 'posts' | 'recent'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('channels')
    .select('*')

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  if (options?.sort === 'members') {
    query = query.order('member_count', { ascending: false })
  } else if (options?.sort === 'posts') {
    query = query.order('post_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: channels, error } = await query
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 19))

  if (error) throw error

  // Check membership and moderator status
  if (user && channels) {
    const channelIds = channels.map(c => c.id)
    const { data: memberships } = await supabase
      .from('channel_members')
      .select('channel_id, role')
      .eq('user_id', user.id)
      .in('channel_id', channelIds)

    const membershipMap = new Map(memberships?.map(m => [m.channel_id, m.role]))

    return channels.map(channel => ({
      ...channel,
      is_member: membershipMap.has(channel.id),
      is_moderator: membershipMap.get(channel.id) === 'moderator' || 
                    channel.moderator_ids.includes(user.id)
    })) as ChannelWithStats[]
  }

  return channels
}

export async function getChannel(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: channel, error } = await supabase
    .from('channels')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error

  if (user) {
    const { data: membership } = await supabase
      .from('channel_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('channel_id', channel.id)
      .single()

    return {
      ...channel,
      is_member: !!membership,
      is_moderator: membership?.role === 'moderator' || channel.moderator_ids.includes(user.id)
    } as ChannelWithStats
  }

  return channel
}

export async function createChannel(data: {
  name: string
  slug: string
  description?: string
  type: 'genre' | 'regional' | 'topic' | 'custom'
  icon?: string
  banner_url?: string
  rules?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: channel, error } = await supabase
    .from('channels')
    .insert({
      ...data,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error

  // Auto-join creator as moderator
  await supabase
    .from('channel_members')
    .insert({
      user_id: user.id,
      channel_id: channel.id,
      role: 'moderator'
    })

  revalidatePath('/channels')
  return channel
}

export async function updateChannel(channelId: string, data: Partial<Channel>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: channel, error } = await supabase
    .from('channels')
    .update(data)
    .eq('id', channelId)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/channel/${channel.slug}`)
  return channel
}

export async function joinChannel(channelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('channel_members')
    .insert({
      user_id: user.id,
      channel_id: channelId
    })

  if (error) throw error

  revalidatePath(`/channel`)
}

export async function leaveChannel(channelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('channel_members')
    .delete()
    .eq('user_id', user.id)
    .eq('channel_id', channelId)

  if (error) throw error

  revalidatePath(`/channel`)
}

export async function getChannelMembers(channelId: string, limit = 20, offset = 0) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('channel_members')
    .select(`
      user_id,
      role,
      joined_at,
      users (
        id,
        username,
        avatar_url,
        bio
      )
    `)
    .eq('channel_id', channelId)
    .order('joined_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

// ============================================
// Post Actions
// ============================================

export interface PostWithAuthor extends Post {
  author?: {
    id: string
    username: string | null
    avatar_url: string | null
  }
  channel?: {
    name: string
    slug: string
    icon: string | null
  }
  user_vote?: 'up' | 'down' | null
}

export async function getPosts(options: {
  channelId?: string
  authorId?: string
  limit?: number
  offset?: number
  sort?: 'hot' | 'top' | 'new' | 'controversial'
  includeAuthor?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('posts')
    .select(`
      *,
      ${options.includeAuthor !== false ? `
      author:users!author_id (
        id,
        username,
        avatar_url
      ),
      channel:channels!channel_id (
        name,
        slug,
        icon
      )
      ` : ''}
    `)
    .eq('is_deleted', false)

  if (options.channelId) {
    query = query.eq('channel_id', options.channelId)
  }

  if (options.authorId) {
    query = query.eq('author_id', options.authorId)
  }

  // Pinned posts first, then sort by chosen method
  query = query.order('is_pinned', { ascending: false })

  switch (options.sort) {
    case 'hot':
      // Hot = score / age (simplified - just use score for now)
      query = query.order('score', { ascending: false })
      break
    case 'top':
      query = query.order('score', { ascending: false })
      break
    case 'controversial':
      // Posts with similar upvotes and downvotes
      query = query.order('comment_count', { ascending: false })
      break
    case 'new':
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: posts, error } = await query
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 19))

  if (error) throw error

  // Get user votes for these posts
  if (user && posts) {
    const postIds = posts.map(p => p.id)
    const { data: votes } = await supabase
      .from('votes')
      .select('votable_id, vote_type')
      .eq('user_id', user.id)
      .eq('votable_type', 'post')
      .in('votable_id', postIds)

    const voteMap = new Map(votes?.map(v => [v.votable_id, v.vote_type]))

    return posts.map(post => ({
      ...post,
      user_vote: voteMap.get(post.id) || null
    })) as PostWithAuthor[]
  }

  return posts as PostWithAuthor[]
}

export async function getPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!author_id (
        id,
        username,
        avatar_url
      ),
      channel:channels!channel_id (
        name,
        slug,
        icon
      )
    `)
    .eq('id', postId)
    .eq('is_deleted', false)
    .single()

  if (error) throw error

  if (user) {
    const { data: vote } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('user_id', user.id)
      .eq('votable_id', postId)
      .eq('votable_type', 'post')
      .single()

    return {
      ...post,
      user_vote: vote?.vote_type || null
    } as PostWithAuthor
  }

  return post as PostWithAuthor
}

export async function createPost(data: {
  channel_id: string
  title: string
  content?: string
  flair?: string
  thumbnail_url?: string
  is_spoiler?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      ...data,
      author_id: user.id
    })
    .select(`
      *,
      channel:channels!channel_id (
        slug
      )
    `)
    .single()

  if (error) {
    // Surface Supabase error with more context so the client can show it
    console.error('createPost error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: (error as any)?.code
    })
    // Throw a JS Error with the Supabase message for the client to display
    throw new Error(error.message || 'Failed to create post')
  }

  // Revalidate both the channel page and channels list
  revalidatePath(`/channel/${(post as any).channel.slug}`)
  revalidatePath('/channels')
  
  return post
}

export async function updatePost(postId: string, data: Partial<Post>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: post, error } = await supabase
    .from('posts')
    .update(data)
    .eq('id', postId)
    .eq('author_id', user.id)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/post/${postId}`)
  return post
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', postId)
    .eq('author_id', user.id)

  if (error) throw error

  revalidatePath(`/post/${postId}`)
}

// ============================================
// Comment Actions
// ============================================

export interface CommentWithAuthor extends Comment {
  author?: {
    id: string
    username: string | null
    avatar_url: string | null
  }
  user_vote?: 'up' | 'down' | null
  replies?: CommentWithAuthor[]
}

export async function getComments(postId: string, parentId?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:users!author_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .is('parent_id', parentId || null)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error

  // Get user votes
  if (user && comments) {
    const commentIds = comments.map(c => c.id)
    const { data: votes } = await supabase
      .from('votes')
      .select('votable_id, vote_type')
      .eq('user_id', user.id)
      .eq('votable_type', 'comment')
      .in('votable_id', commentIds)

    const voteMap = new Map(votes?.map(v => [v.votable_id, v.vote_type]))

    return comments.map(comment => ({
      ...comment,
      user_vote: voteMap.get(comment.id) || null
    })) as CommentWithAuthor[]
  }

  return comments as CommentWithAuthor[]
}

export async function createComment(data: {
  post_id: string
  content: string
  parent_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Calculate depth if this is a reply
  let depth = 0
  if (data.parent_id) {
    const { data: parent } = await supabase
      .from('comments')
      .select('depth')
      .eq('id', data.parent_id)
      .single()

    if (parent) {
      depth = Math.min(parent.depth + 1, 10) // Max depth of 10
    }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      ...data,
      author_id: user.id,
      depth
    })
    .select(`
      *,
      author:users!author_id (
        id,
        username,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  revalidatePath(`/post/${data.post_id}`)
  return comment
}

export async function updateComment(commentId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: comment, error } = await supabase
    .from('comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('author_id', user.id)
    .select()
    .single()

  if (error) throw error
  return comment
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true, content: '[deleted]' })
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) throw error
}

// ============================================
// Vote Actions
// ============================================

export async function vote(
  votableId: string,
  votableType: 'post' | 'comment',
  voteType: 'up' | 'down'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('user_id', user.id)
    .eq('votable_id', votableId)
    .eq('votable_type', votableType)
    .single()

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote if clicking same button
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('votable_id', votableId)
        .eq('votable_type', votableType)
    } else {
      // Change vote
      await supabase
        .from('votes')
        .update({ vote_type: voteType })
        .eq('user_id', user.id)
        .eq('votable_id', votableId)
        .eq('votable_type', votableType)
    }
  } else {
    // Create new vote
    await supabase
      .from('votes')
      .insert({
        user_id: user.id,
        votable_id: votableId,
        votable_type: votableType,
        vote_type: voteType
      })
  }

  revalidatePath('/', 'layout')
}

export async function getUserVotes(votableIds: string[], votableType: 'post' | 'comment') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new Map()

  const { data: votes } = await supabase
    .from('votes')
    .select('votable_id, vote_type')
    .eq('user_id', user.id)
    .eq('votable_type', votableType)
    .in('votable_id', votableIds)

  return new Map(votes?.map(v => [v.votable_id, v.vote_type]))
}

// ============================================
// User Channel Management
// ============================================

// Get channels created by a specific user
export async function getUserCreatedChannels(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: channels, error } = await supabase
      .from('channels')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, channels: channels || [] }
  } catch (error) {
    console.error('Failed to get user channels:', error)
    return { success: false, error: 'Failed to get user channels', channels: [] }
  }
}

// Get channel analytics for admin/moderator
export async function getChannelAnalytics(channelId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated', analytics: null }
    }

    // Check if user is moderator or creator
    const { data: channel } = await supabase
      .from('channels')
      .select('created_by, moderator_ids')
      .eq('id', channelId)
      .single()

    if (!channel || (channel.created_by !== user.id && !channel.moderator_ids.includes(user.id))) {
      return { success: false, error: 'Not authorized', analytics: null }
    }

    // Get channel stats
    const { data: channelData } = await supabase
      .from('channels')
      .select('name, slug, description, member_count, post_count, created_at, type, icon')
      .eq('id', channelId)
      .single()

    // Get post engagement stats
    const { data: posts } = await supabase
      .from('posts')
      .select('score, view_count, comment_count, created_at')
      .eq('channel_id', channelId)
      .eq('is_deleted', false)

    // Get member growth (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: newMembersCount } = await supabase
      .from('channel_members')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId)
      .gte('joined_at', thirtyDaysAgo.toISOString())

    // Get top posts
    const { data: topPosts } = await supabase
      .from('posts')
      .select('id, title, score, view_count, comment_count, created_at')
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('score', { ascending: false })
      .limit(5)

    // Calculate engagement metrics
    const totalViews = posts?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0
    const totalEngagement = posts?.reduce((sum, p) => sum + (p.score || 0) + (p.comment_count || 0), 0) || 0
    const avgPostScore = posts?.length ? posts.reduce((sum, p) => sum + (p.score || 0), 0) / posts.length : 0

    // Get recent activity (posts per day last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentPostsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channelId)
      .gte('created_at', sevenDaysAgo.toISOString())

    const analytics = {
      channel: channelData,
      stats: {
        totalMembers: channelData?.member_count || 0,
        totalPosts: channelData?.post_count || 0,
        totalViews,
        totalEngagement,
        avgPostScore: Math.round(avgPostScore * 10) / 10,
        newMembersThisMonth: newMembersCount || 0,
        postsThisWeek: recentPostsCount || 0,
        engagementRate: channelData?.member_count 
          ? Math.round((totalEngagement / channelData.member_count) * 100) / 100
          : 0
      },
      topPosts: topPosts || [],
      growthTrend: newMembersCount && newMembersCount > 0 ? 'growing' : 'stable'
    }

    return { success: true, analytics }
  } catch (error) {
    console.error('Failed to get channel analytics:', error)
    return { success: false, error: 'Failed to get channel analytics', analytics: null }
  }
}

// Get all channels where user is a moderator
export async function getUserModeratedChannels(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data: memberships, error } = await supabase
      .from('channel_members')
      .select(`
        channel_id,
        role,
        channels (
          id,
          name,
          slug,
          description,
          icon,
          member_count,
          post_count,
          created_at,
          type
        )
      `)
      .eq('user_id', userId)
      .eq('role', 'moderator')

    if (error) throw error

    const channels = memberships?.map(m => (m as any).channels).filter(Boolean) || []

    return { success: true, channels }
  } catch (error) {
    console.error('Failed to get moderated channels:', error)
    return { success: false, error: 'Failed to get moderated channels', channels: [] }
  }
}
