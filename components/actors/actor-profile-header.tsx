'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { followActor, unfollowActor } from '@/app/actions/actors'
import { ActorWithCredits } from '@/types/actor'
import { UserPlus, UserMinus, Share2, ExternalLink, Users } from 'lucide-react'

interface ActorProfileHeaderProps {
  actor: ActorWithCredits
  isFollowing: boolean
  followerCount: number
}

export function ActorProfileHeader({ 
  actor, 
  isFollowing: initialIsFollowing,
  followerCount: initialFollowerCount,
}: ActorProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFollowToggle = async () => {
    setIsLoading(true)
    try {
      if (isFollowing) {
        const result = await unfollowActor(actor.id)
        if (result.success) {
          setIsFollowing(false)
          setFollowerCount((prev) => Math.max(0, prev - 1))
          toast({
            title: 'Unfollowed',
            description: `You unfollowed ${actor.name}`,
          })
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to unfollow',
            variant: 'destructive',
          })
        }
      } else {
        const result = await followActor(
          actor.id,
          actor.name,
          actor.profile_path,
          actor.popularity
        )
        if (result.success) {
          setIsFollowing(true)
          setFollowerCount((prev) => prev + 1)
          toast({
            title: 'Following',
            description: `You are now following ${actor.name}`,
          })
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to follow',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: actor.name,
          text: `Check out ${actor.name} on CineVerse`,
          url,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url)
      toast({
        title: 'Link Copied',
        description: 'Profile link copied to clipboard',
      })
    }
  }

  const profileImageUrl = actor.profile_path
    ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
    : '/placeholder-actor.png'

  return (
    <div className="relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background -z-10" />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Image */}
          <div className="relative w-64 h-80 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
            <Image
              src={profileImageUrl}
              alt={actor.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-6">
            {/* Name and Known For */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{actor.name}</h1>
              <Badge variant="secondary" className="text-base">
                {actor.known_for_department}
              </Badge>
            </div>

            {/* Bio Preview */}
            {actor.biography && (
              <p className="text-muted-foreground leading-relaxed line-clamp-3 max-w-3xl">
                {actor.biography}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>{followerCount}</strong> followers
                </span>
              </div>
              {actor.credits?.cast && (
                <div>
                  <strong>{actor.credits.cast.length}</strong> movies
                </div>
              )}
              <div>
                Popularity: <strong>{actor.popularity.toFixed(1)}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleFollowToggle}
                disabled={isLoading}
                size="lg"
                variant={isFollowing ? 'outline' : 'default'}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>

              <Button onClick={handleShare} size="lg" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {actor.homepage && (
                <Button size="lg" variant="outline" asChild>
                  <a href={actor.homepage} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Official Site
                  </a>
                </Button>
              )}

              {actor.imdb_id && (
                <Button size="lg" variant="outline" asChild>
                  <a
                    href={`https://www.imdb.com/name/${actor.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    IMDb
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
