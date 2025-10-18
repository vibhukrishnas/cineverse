'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { RatingStars } from '@/components/movies/rating-stars'
import { Heart, MessageSquare, Eye, ExternalLink } from 'lucide-react'
import type { FeedItem as FeedItemType } from '@/app/actions/feed'

interface FeedItemProps {
  item: FeedItemType
}

export function FeedItem({ item }: FeedItemProps) {
  return (
    <Card className="p-6 hover:bg-muted/50 transition-colors">
      {/* User header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/profile/${item.user.id}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity">
            {item.user.avatar_url ? (
              <img
                src={item.user.avatar_url}
                alt={item.user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              item.user.username.substring(0, 2).toUpperCase()
            )}
          </div>
        </Link>

        <div className="flex-1">
          <Link 
            href={`/profile/${item.user.id}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {item.user.full_name || item.user.username}
          </Link>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Review content */}
      {item.type === 'review' && item.review && item.movie && (
        <div className="space-y-3">
          <div className="flex gap-4">
            {/* Movie poster */}
            {item.movie.poster_path && (
              <Link href={`/movie/${item.movie.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w200${item.movie.poster_path}`}
                  alt={item.movie.title}
                  className="w-20 h-30 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            )}

            {/* Review details */}
            <div className="flex-1 min-w-0">
              <Link 
                href={`/movie/${item.movie.id}`}
                className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
              >
                {item.movie.title}
              </Link>
              
              <div className="flex items-center gap-2 mt-1">
                <RatingStars rating={item.review.rating} size="sm" />
                <span className="text-sm font-semibold">{item.review.rating.toFixed(1)}</span>
              </div>

              {item.review.title && (
                <p className="font-medium mt-2">{item.review.title}</p>
              )}
              
              {item.review.content && (
                <p className={`text-sm text-muted-foreground mt-1 ${
                  item.review.is_spoiler ? 'blur-sm hover:blur-none transition-all' : 'line-clamp-3'
                }`}>
                  {item.review.is_spoiler && <span className="font-semibold text-red-500">[SPOILER] </span>}
                  {item.review.content}
                </p>
              )}

              {/* Review stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {item.review.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {item.review.helpful_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social post content */}
      {item.type === 'social_post' && item.social_post && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase">
              {item.social_post.platform}
            </span>
            {item.social_post.author_name && (
              <span className="text-sm text-muted-foreground">
                by {item.social_post.author_name}
              </span>
            )}
          </div>

          {item.social_post.media_url && (
            <img
              src={item.social_post.media_url}
              alt="Social media content"
              className="w-full rounded-lg object-cover max-h-96"
            />
          )}

          {item.social_post.content && (
            <p className="text-sm">{item.social_post.content}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {item.social_post.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {item.social_post.comments_count}
            </span>
            {item.social_post.views_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {item.social_post.views_count}
              </span>
            )}
            {item.social_post.external_url && (
              <a
                href={item.social_post.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
              >
                View original
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Follow activity */}
      {item.type === 'follow' && item.target_user && (
        <div className="text-sm">
          <span className="text-muted-foreground">started following</span>
          {' '}
          <Link 
            href={`/profile/${item.target_user.id}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {item.target_user.full_name || item.target_user.username}
          </Link>
        </div>
      )}
    </Card>
  )
}
