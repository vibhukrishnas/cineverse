'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Heart, MessageCircle, Twitter } from 'lucide-react'
import Image from 'next/image'
import { TwitterPost } from '@/lib/social/twitter'

interface TwitterFeedWidgetProps {
  movieTitle?: string
  movieYear?: number
  limit?: number
  showHeader?: boolean
}

export function TwitterFeedWidget({ 
  movieTitle, 
  movieYear, 
  limit = 10,
  showHeader = true 
}: TwitterFeedWidgetProps) {
  const [tweets, setTweets] = useState<TwitterPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTweets()
  }, [movieTitle, movieYear])

  const loadTweets = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })

      if (movieTitle) {
        params.append('title', movieTitle)
      }
      if (movieYear) {
        params.append('year', movieYear.toString())
      }

      const response = await fetch(`/api/social/twitter?${params}`)
      const data = await response.json()

      if (data.success) {
        setTweets(data.tweets || [])
      } else {
        setError(data.error || 'Failed to load tweets')
      }
    } catch (err) {
      console.error('Error loading tweets:', err)
      setError('Failed to load social feed')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  if (!showHeader && tweets.length === 0 && !loading) {
    return null
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
            {movieTitle ? `${movieTitle} on X` : 'Movie Discussions on X'}
          </CardTitle>
          <CardDescription>
            See what people are saying{movieTitle ? ` about ${movieTitle}` : ' about movies'}
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {loading ? (
          // Loading skeletons
          [1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-8">
            <Twitter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={loadTweets}>
              Try Again
            </Button>
          </div>
        ) : tweets.length > 0 ? (
          tweets.map((tweet) => (
            <a
              key={tweet.post_id}
              href={tweet.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Author Avatar */}
                {tweet.author_avatar && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                    {tweet.author_avatar.startsWith('http') ? (
                      <Image
                        src={tweet.author_avatar}
                        alt={tweet.author_name}
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {tweet.author_avatar}
                      </div>
                    )}
                  </div>
                )}

                {/* Tweet Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">
                      {tweet.author_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {tweet.author_handle}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(tweet.created_at)}
                    </span>
                  </div>

                  <p className="text-sm mb-3 line-clamp-3">
                    {tweet.content}
                  </p>

                  {/* Tweet Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {tweet.comments_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {tweet.likes_count.toLocaleString()}
                    </span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </div>
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="text-center py-8">
            <Twitter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No discussions found{movieTitle ? ` for ${movieTitle}` : ''}
            </p>
          </div>
        )}

        {tweets.length > 0 && (
          <Button variant="outline" className="w-full" size="sm" asChild>
            <a
              href={movieTitle 
                ? `https://twitter.com/search?q=${encodeURIComponent(`"${movieTitle}" movie`)}`
                : 'https://twitter.com/search?q=movie%20OR%20film'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter className="w-4 h-4 mr-2" />
              View more on X
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
