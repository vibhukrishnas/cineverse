'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Eye, ExternalLink, RefreshCw, Loader2 } from 'lucide-react'
import { getRecentSocialPosts, fetchAndStoreStudioTweets } from '@/app/actions/social'

interface SocialPost {
  id: string
  platform: 'twitter' | 'youtube' | 'instagram'
  content: string
  author_name: string
  author_handle: string
  author_avatar: string
  likes_count: number
  comments_count: number
  views_count: number
  external_url: string
  created_at: string
}

export function SocialFeedContent() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    const result = await getRecentSocialPosts(50)
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Latest Updates</h2>
          {posts.length > 0 && (
            <Badge variant="secondary">{posts.length} posts</Badge>
          )}
        </div>
        <Button 
          variant="outline"
          onClick={refreshPosts}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Feed
            </>
          )}
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No social posts yet. Click "Refresh Feed" to fetch latest movie updates from studios!
            </p>
            <Button onClick={refreshPosts} disabled={refreshing}>
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching from 𝕏...
                </>
              ) : (
                <>Fetch Studio Updates</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

function SocialPostCard({ post }: { post: SocialPost }) {
  const timeAgo = getTimeAgo(post.created_at)

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author_avatar} alt={post.author_name} />
              <AvatarFallback>{post.author_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{post.author_name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {post.author_handle}
              </p>
            </div>
          </div>
          <Badge variant="secondary">𝕏</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            <span>{formatNumber(post.likes_count)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span>{formatNumber(post.comments_count)}</span>
          </div>
          {post.views_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{formatNumber(post.views_count)}</span>
            </div>
          )}
          <span className="ml-auto">{timeAgo}</span>
        </div>

        <a
          href={post.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
        >
          View on 𝕏
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}
