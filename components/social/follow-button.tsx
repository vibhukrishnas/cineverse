'use client'

import { useState } from 'react'
import { followUser, unfollowUser } from '@/app/actions/follows'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showIcon?: boolean
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  userId,
  initialIsFollowing,
  size = 'default',
  variant = 'default',
  showIcon = true,
  className,
  onFollowChange
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)

    // Optimistic update
    const previousState = isFollowing
    setIsFollowing(!isFollowing)
    onFollowChange?.(!isFollowing)

    try {
      const result = isFollowing
        ? await unfollowUser(userId)
        : await followUser(userId)

      if (!result.success) {
        // Revert on error
        setIsFollowing(previousState)
        onFollowChange?.(previousState)
        alert(result.error || 'An error occurred')
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState)
      onFollowChange?.(previousState)
      console.error('Follow/unfollow error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size={size}
      variant={isFollowing ? 'outline' : variant}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserMinus className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )
          )}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  )
}
