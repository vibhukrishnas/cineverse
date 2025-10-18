'use client'

import { useState } from 'react'
import { Bookmark, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  addToWatchlist,
  removeFromWatchlist,
  addToFavorites,
  removeFromFavorites,
} from '@/app/actions/watchlist'

interface MovieActionsProps {
  movieId: number
  movieTitle: string
  isInWatchlist: boolean
  isInFavorites: boolean
  isAuthenticated: boolean
}

export function MovieActions({
  movieId,
  movieTitle,
  isInWatchlist: initialInWatchlist,
  isInFavorites: initialInFavorites,
  isAuthenticated,
}: MovieActionsProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialInWatchlist)
  const [isInFavorites, setIsInFavorites] = useState(initialInFavorites)
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)
  const { toast } = useToast()

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to add movies to your watchlist.',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingWatchlist(true)
    try {
      const result = isInWatchlist
        ? await removeFromWatchlist(movieId)
        : await addToWatchlist(movieId)

      if (result.success) {
        setIsInWatchlist(!isInWatchlist)
        toast({
          title: isInWatchlist ? 'Removed from Watchlist' : 'Added to Watchlist',
          description: isInWatchlist
            ? `${movieTitle} has been removed from your watchlist.`
            : `${movieTitle} has been added to your watchlist.`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update watchlist.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingWatchlist(false)
    }
  }

  const handleFavoritesToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to favorite movies.',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingFavorites(true)
    try {
      const result = isInFavorites
        ? await removeFromFavorites(movieId)
        : await addToFavorites(movieId)

      if (result.success) {
        setIsInFavorites(!isInFavorites)
        toast({
          title: isInFavorites ? 'Removed from Favorites' : 'Added to Favorites',
          description: isInFavorites
            ? `${movieTitle} has been removed from your favorites.`
            : `${movieTitle} has been added to your favorites.`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update favorites.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    // Try native share API first (mobile/PWA)
    if (navigator.share) {
      try {
        await navigator.share({
          title: movieTitle,
          text: `Check out ${movieTitle} on CineVerse!`,
          url: url,
        })
        toast({
          title: 'Shared Successfully',
          description: 'Movie has been shared!',
        })
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink(url)
        }
      }
    } else {
      // Fallback to clipboard
      handleCopyLink(url)
    }
  }

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link Copied',
        description: 'Movie link has been copied to clipboard!',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        size="lg"
        className="gap-2"
        onClick={handleWatchlistToggle}
        disabled={isLoadingWatchlist}
        variant={isInWatchlist ? 'default' : 'outline'}
      >
        <Bookmark className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
        {isLoadingWatchlist ? 'Loading...' : isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
      </Button>
      
      <Button
        size="lg"
        variant={isInFavorites ? 'default' : 'outline'}
        className="gap-2"
        onClick={handleFavoritesToggle}
        disabled={isLoadingFavorites}
      >
        <Heart className={`h-4 w-4 ${isInFavorites ? 'fill-current' : ''}`} />
        {isLoadingFavorites ? 'Loading...' : isInFavorites ? 'Favorited' : 'Favorite'}
      </Button>
      
      <Button
        size="lg"
        variant="outline"
        className="gap-2"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  )
}
