'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// Moderation Actions
// ============================================

export async function isChannelModerator(channelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: channel } = await supabase
    .from('channels')
    .select('moderator_ids, created_by')
    .eq('id', channelId)
    .single()

  if (!channel) return false

  return channel.moderator_ids.includes(user.id) || channel.created_by === user.id
}

export async function pinPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get post to check channel
  const { data: post } = await supabase
    .from('posts')
    .select('channel_id')
    .eq('id', postId)
    .single()

  if (!post) throw new Error('Post not found')

  // Check if user is moderator
  const isMod = await isChannelModerator(post.channel_id)
  if (!isMod) throw new Error('Not authorized')

  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: true })
    .eq('id', postId)

  if (error) throw error

  revalidatePath(`/post/${postId}`)
}

export async function unpinPost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: post } = await supabase
    .from('posts')
    .select('channel_id')
    .eq('id', postId)
    .single()

  if (!post) throw new Error('Post not found')

  const isMod = await isChannelModerator(post.channel_id)
  if (!isMod) throw new Error('Not authorized')

  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: false })
    .eq('id', postId)

  if (error) throw error

  revalidatePath(`/post/${postId}`)
}

export async function removePost(postId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: post } = await supabase
    .from('posts')
    .select('channel_id, author_id')
    .eq('id', postId)
    .single()

  if (!post) throw new Error('Post not found')

  const isMod = await isChannelModerator(post.channel_id)
  if (!isMod) throw new Error('Not authorized')

  const { error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', postId)

  if (error) throw error

  // Log moderation action (you could add a mod_logs table)
  revalidatePath(`/post/${postId}`)
}

export async function removeComment(commentId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get comment and post to check channel
  const { data: comment } = await supabase
    .from('comments')
    .select(`
      post_id,
      posts!inner (
        channel_id
      )
    `)
    .eq('id', commentId)
    .single()

  if (!comment) throw new Error('Comment not found')

  const isMod = await isChannelModerator((comment as any).posts.channel_id)
  if (!isMod) throw new Error('Not authorized')

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true, content: '[removed by moderator]' })
    .eq('id', commentId)

  if (error) throw error

  revalidatePath(`/post/${comment.post_id}`)
}

export async function banUserFromChannel(
  userId: string,
  channelId: string,
  reason?: string,
  duration?: number // days, undefined = permanent
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const isMod = await isChannelModerator(channelId)
  if (!isMod) throw new Error('Not authorized')

  // Remove user from channel
  const { error } = await supabase
    .from('channel_members')
    .delete()
    .eq('user_id', userId)
    .eq('channel_id', channelId)

  if (error) throw error

  // TODO: Add to banned_users table (create if needed)
  // This would store ban info and prevent re-joining

  revalidatePath(`/channel`)
}

export async function addModerator(userId: string, channelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Check if current user is moderator
  const isMod = await isChannelModerator(channelId)
  if (!isMod) throw new Error('Not authorized')

  // Update channel moderator_ids
  const { data: channel } = await supabase
    .from('channels')
    .select('moderator_ids')
    .eq('id', channelId)
    .single()

  if (!channel) throw new Error('Channel not found')

  const moderatorIds = [...channel.moderator_ids, userId]

  const { error } = await supabase
    .from('channels')
    .update({ moderator_ids: moderatorIds })
    .eq('id', channelId)

  if (error) throw error

  // Update user's role in channel_members
  await supabase
    .from('channel_members')
    .update({ role: 'moderator' })
    .eq('user_id', userId)
    .eq('channel_id', channelId)

  revalidatePath(`/channel`)
}

export async function removeModerator(userId: string, channelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const isMod = await isChannelModerator(channelId)
  if (!isMod) throw new Error('Not authorized')

  // Remove from channel moderator_ids
  const { data: channel } = await supabase
    .from('channels')
    .select('moderator_ids')
    .eq('id', channelId)
    .single()

  if (!channel) throw new Error('Channel not found')

  const moderatorIds = channel.moderator_ids.filter(id => id !== userId)

  const { error } = await supabase
    .from('channels')
    .update({ moderator_ids: moderatorIds })
    .eq('id', channelId)

  if (error) throw error

  // Update user's role in channel_members
  await supabase
    .from('channel_members')
    .update({ role: 'member' })
    .eq('user_id', userId)
    .eq('channel_id', channelId)

  revalidatePath(`/channel`)
}

export async function getModeratedChannels() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: channels, error } = await supabase
    .from('channels')
    .select('*')
    .contains('moderator_ids', [user.id])

  if (error) throw error
  return channels
}

export async function getFlaggedContent(channelId: string) {
  // TODO: Implement when you add a reports/flags table
  // This would return posts/comments that users have reported
  return []
}

export async function getModerationLog(channelId: string, limit = 50) {
  // TODO: Implement when you add a mod_logs table
  // This would return history of moderation actions
  return []
}
