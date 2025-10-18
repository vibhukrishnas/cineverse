'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { FollowButton } from './follow-button'
import type { UserProfile } from '@/app/actions/follows'

interface UserCardProps {
  user: UserProfile
  showFollowButton?: boolean
  showBio?: boolean
  showStats?: boolean
}

export function UserCard({ 
  user, 
  showFollowButton = true,
  showBio = true,
  showStats = false
}: UserCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/profile/${user.id}`}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.username.substring(0, 2).toUpperCase()
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Name and username */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link 
                href={`/profile/${user.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {user.full_name || user.username}
              </Link>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            {showFollowButton && user.is_following !== undefined && (
              <FollowButton
                userId={user.id}
                initialIsFollowing={user.is_following}
                size="sm"
              />
            )}
          </div>

          {/* Bio */}
          {showBio && user.bio && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Stats */}
          {showStats && (user.followers_count !== undefined || user.following_count !== undefined) && (
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              {user.followers_count !== undefined && (
                <span>
                  <strong className="text-foreground">{user.followers_count}</strong> followers
                </span>
              )}
              {user.following_count !== undefined && (
                <span>
                  <strong className="text-foreground">{user.following_count}</strong> following
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
