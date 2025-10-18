'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, ExternalLink, RefreshCw, Loader2 } from 'lucide-react'
import { getRecentSocialPosts, fetchAndStoreStudioTweets } from '@/app/actions/social'
import Link from 'next/link'

interface SocialPost {
  id: string
  platform: 'twitter' | 'youtube' | 'instagram'
  content: string
  author_name: string
  author_handle: string
  author_avatar: string
  likes_count: number
  comments_count: number
  external_url: string
  created_at: string
}

export function SocialFeedWidget() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    const result = await getRecentSocialPosts(5)
    if (result.success) {
      setPosts(result.posts)
    }
    setLoading(false)
  }

  async function refreshPosts() {
    setRefreshing(true)
    await fetchAndStoreStudioTweets()
    await loadPosts()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movie Buzz 🔥</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Movie Buzz 🔥
            {posts.length > 0 && (
              <Badge variant="secondary" className="text-xs">{posts.length}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={refreshPosts}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Link href="/social">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No posts yet. Fetch latest movie updates!
            </p>
            <Button onClick={refreshPosts} disabled={refreshing} size="sm">
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>Fetch from 𝕏</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 5).map(post => (
              <div key={post.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author_avatar} alt={post.author_name} />
                    <AvatarFallback>{post.author_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{post.author_name}</p>
                      <Badge variant="secondary" className="text-xs">𝕏</Badge>
                    </div>
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{formatNumber(post.likes_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{formatNumber(post.comments_count)}</span>
                      </div>
                      <a
                        href={post.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline ml-auto"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
