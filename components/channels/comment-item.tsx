'use client'

import { useState } from 'react'
import { VoteButtons } from './vote-buttons'
import { CommentForm } from './comment-form'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { CommentWithAuthor } from '@/app/actions/channels'
import Link from 'next/link'
import Image from 'next/image'

interface CommentItemProps {
  comment: CommentWithAuthor
  onReply?: () => void
}

export function CommentItem({ comment, onReply }: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  if (comment.is_deleted) {
    return (
      <div className="py-2 px-4 text-sm text-gray-500 italic">
        [deleted]
      </div>
    )
  }

  return (
    <div className={`border-l-2 ${isCollapsed ? 'border-transparent' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex gap-2 py-2">
        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-shrink-0 w-6 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>

        {/* Vote buttons */}
        <VoteButtons
          votableId={comment.id}
          votableType="comment"
          upvotes={comment.upvotes}
          downvotes={comment.downvotes}
          score={comment.score}
          userVote={comment.user_vote}
          vertical={false}
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          {/* Author and metadata */}
          <div className="flex items-center gap-2 text-sm">
            {comment.author?.avatar_url && (
              <Image
                src={comment.author.avatar_url}
                alt={comment.author.username || 'User'}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <Link
              href={`/profile?user=${comment.author?.id}`}
              className="font-medium hover:underline"
            >
              {comment.author?.username || 'Anonymous'}
            </Link>
            <span className="text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.depth > 0 && (
              <span className="text-xs text-gray-400">
                Level {comment.depth}
              </span>
            )}
          </div>

          {/* Comment content */}
          {!isCollapsed && (
            <>
              <div className="mt-1 text-sm">
                {comment.content}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-2 text-sm">
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  disabled={comment.depth >= 10}
                >
                  <MessageSquare className="w-3 h-3" />
                  Reply
                </button>

                {comment.replies && comment.replies.length > 0 && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showReplies ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                    {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>

              {/* Reply form */}
              {showReplyForm && (
                <div className="mt-3">
                  <CommentForm
                    postId={comment.post_id}
                    parentId={comment.id}
                    onSuccess={() => setShowReplyForm(false)}
                    onCancel={() => setShowReplyForm(false)}
                    placeholder={`Reply to ${comment.author?.username || 'this comment'}...`}
                    autoFocus
                  />
                </div>
              )}

              {/* Nested replies */}
              {showReplies && comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Collapsed state */}
          {isCollapsed && (
            <div className="text-sm text-gray-500">
              {comment.score} points • {comment.replies?.length || 0} replies
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
