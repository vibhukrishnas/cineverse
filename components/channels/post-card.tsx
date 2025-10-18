'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { VoteButtons } from './vote-buttons'
import { MessageSquare, Pin, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { PostWithAuthor } from '@/app/actions/channels'
import Image from 'next/image'

interface PostCardProps {
  post: PostWithAuthor
  showChannel?: boolean
  compact?: boolean
}

export function PostCard({ post, showChannel = true, compact = false }: PostCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-4">
        {/* Vote buttons */}
        <VoteButtons
          votableId={post.id}
          votableType="post"
          upvotes={post.upvotes}
          downvotes={post.downvotes}
          score={post.score}
          userVote={post.user_vote}
          vertical
          className="pt-1"
        />

        {/* Thumbnail */}
        {post.thumbnail_url && !compact && (
          <div className="w-24 h-24 relative rounded overflow-hidden flex-shrink-0">
            <Image
              src={post.thumbnail_url}
              alt=""
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            {showChannel && post.channel && (
              <Link
                href={`/channel/${post.channel.slug}`}
                className="text-sm font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {post.channel.icon} {post.channel.name}
              </Link>
            )}
            {post.author && (
              <span className="text-sm text-gray-500">
                Posted by{' '}
                <Link
                  href={`/profile?user=${post.author.id}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.author.username || 'Anonymous'}
                </Link>
                {' '}•{' '}
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            )}
          </div>

          <Link href={`/post/${post.id}`} className="block mt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {post.is_pinned && (
                <Pin className="w-4 h-4 text-green-600" />
              )}
              {post.is_spoiler && (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}
              <h3 className={compact ? 'text-base font-medium' : 'text-lg font-semibold'}>
                {post.title}
              </h3>
            </div>

            {post.flair && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-full">
                {post.flair}
              </span>
            )}

            {post.content && !compact && (
              <div
                className={`mt-2 text-gray-600 dark:text-gray-400 ${
                  post.is_spoiler ? 'blur-sm hover:blur-none transition-all' : ''
                }`}
              >
                <p className="line-clamp-3">{post.content}</p>
              </div>
            )}
          </Link>

          {/* Footer */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <Link
              href={`/post/${post.id}#comments`}
              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <MessageSquare className="w-4 h-4" />
              {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
