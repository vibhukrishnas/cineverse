import { getPost, getComments } from '@/app/actions/channels'
import { VoteButtons } from '@/components/channels/vote-buttons'
import { CommentForm } from '@/components/channels/comment-form'
import { CommentItem } from '@/components/channels/comment-item'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Pin,
  AlertCircle,
  MessageSquare,
  Share,
  MoreHorizontal,
  Shield
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'

async function buildCommentTree(postId: string) {
  const topLevel = await getComments(postId, null)
  
  const withReplies = await Promise.all(
    topLevel.map(async (comment) => {
      const replies = await getComments(postId, comment.id)
      return {
        ...comment,
        replies
      }
    })
  )
  
  return withReplies
}

export default async function PostPage({
  params
}: {
  params: { id: string }
}) {
  const post = await getPost(params.id)
  if (!post) notFound()

  const comments = await buildCommentTree(params.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Post Card */}
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            {post.channel && (
              <Link
                href={`/channel/${post.channel.slug}`}
                className="flex items-center gap-2 text-sm font-medium hover:underline"
              >
                {post.channel.icon && (
                  <span className="text-xl">{post.channel.icon}</span>
                )}
                {post.channel.name}
              </Link>
            )}
            {post.author && (
              <span className="text-sm text-gray-500">
                • Posted by{' '}
                <Link
                  href={`/profile?user=${post.author.id}`}
                  className="hover:underline"
                >
                  {post.author.username || 'Anonymous'}
                </Link>
                {' '}•{' '}
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Title and badges */}
          <div className="flex items-start gap-4">
            <VoteButtons
              votableId={post.id}
              votableType="post"
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              score={post.score}
              userVote={post.user_vote}
              vertical
            />

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {post.is_pinned && (
                  <Pin className="w-5 h-5 text-green-600" />
                )}
                {post.is_spoiler && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Spoiler</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-3">{post.title}</h1>

              {post.flair && (
                <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full">
                  {post.flair}
                </span>
              )}

              {/* Thumbnail */}
              {post.thumbnail_url && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  <Image
                    src={post.thumbnail_url}
                    alt=""
                    width={800}
                    height={400}
                    className="w-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              {post.content && (
                <div
                  className={`mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${
                    post.is_spoiler ? 'blur-md hover:blur-none transition-all cursor-pointer' : ''
                  }`}
                >
                  {post.content}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageSquare className="w-4 h-4" />
                  {post.comment_count} comments
                </span>
                <Button variant="ghost" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Comment Form */}
        <Card className="p-6 mt-6" id="comments">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          <CommentForm postId={params.id} />
        </Card>

        {/* Comments List */}
        <div className="mt-6 space-y-2">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <Card key={comment.id} className="p-4">
                <CommentItem comment={comment} />
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
