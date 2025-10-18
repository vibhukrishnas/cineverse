'use client'

import { useEffect, useState } from 'react'
import { TwitterFeedWidget } from '@/components/social/twitter-feed-widget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Twitter, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChannelTwitterFeedProps {
  channelName: string
  twitterHandle?: string | null
  tmdbId?: number | null
  channelType: string
}

export function ChannelTwitterFeed({ 
  channelName, 
  twitterHandle, 
  tmdbId,
  channelType 
}: ChannelTwitterFeedProps) {
  const [socialAccounts, setSocialAccounts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [handle, setHandle] = useState<string | null>(twitterHandle || null)

  useEffect(() => {
    const fetchSocialMedia = async () => {
      // If we already have a Twitter handle, use it
      if (twitterHandle) {
        setHandle(twitterHandle)
        setLoading(false)
        return
      }

      // If we have a TMDB ID, fetch social media info
      if (tmdbId) {
        try {
          const response = await fetch(`/api/tmdb/social-media?id=${tmdbId}&type=movie`)
          if (response.ok) {
            const data = await response.json()
            setSocialAccounts(data)
            if (data.twitter_id) {
              setHandle(data.twitter_id)
            }
          }
        } catch (error) {
          console.error('Error fetching social media:', error)
        }
      }
      
      setLoading(false)
    }

    fetchSocialMedia()
  }, [twitterHandle, tmdbId])

  // Construct search query based on channel info
  const getSearchQuery = () => {
    if (handle) {
      return `from:${handle}`
    }
    
    // Fallback to channel-specific searches
    return `${channelName} movies OR ${channelName} film`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            Social Buzz
          </CardTitle>
          <CardDescription>Latest tweets about {channelName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading feed...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {handle && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Twitter className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Official Account</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://twitter.com/${handle}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                @{handle}
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          </div>
        </Card>
      )}

      <TwitterFeedWidget 
        movieTitle={channelName}
        limit={10}
        showHeader={true}
      />

      {socialAccounts && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">More Social Media</h4>
          <div className="space-y-2">
            {socialAccounts.instagram_id && (
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <a 
                  href={`https://instagram.com/${socialAccounts.instagram_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mr-2">📷</span>
                  @{socialAccounts.instagram_id}
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            )}
            {socialAccounts.facebook_id && (
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <a 
                  href={`https://facebook.com/${socialAccounts.facebook_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mr-2">👥</span>
                  Facebook
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
