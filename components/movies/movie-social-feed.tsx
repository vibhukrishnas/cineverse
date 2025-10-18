'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, MessageCircle, Eye, ExternalLink, RefreshCw, Loader2 } from 'lucide-react'
import { getMovieSocialPosts, fetchAndStoreMovieTweets } from '@/app/actions/social'

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

export function MovieSocialFeed({ 
  movieId, 
  movieTitle,
  movieYear 
}: { 
  movieId: number
  movieTitle: string
  movieYear?: number 
}) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadPosts()
  }, [movieId])

  async function loadPosts() {
    setLoading(true)
    const result = await getMovieSocialPosts(movieId)
    if (result.success) {
      setPosts(result.posts)
    }
    setLoading(false)
  }

  async function refreshPosts() {
    setRefreshing(true)
    const result = await fetchAndStoreMovieTweets(movieId, movieTitle, movieYear)
    if (result.success) {
      await loadPosts()
    }
    setRefreshing(false)
  }

  const twitterPosts = posts.filter(p => p.platform === 'twitter')

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading social buzz...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">Social Buzz 🔥</h3>
          {posts.length > 0 && (
            <Badge variant="secondary">{posts.length} posts</Badge>
          )}
        </div>
        <Button 
          variant="outline" 
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
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No social media posts found yet for this movie.
            </p>
            <Button onClick={refreshPosts} disabled={refreshing}>
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching from 𝕏...
                </>
              ) : (
                <>Fetch Latest Posts from 𝕏</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="twitter">
              𝕏 Twitter ({twitterPosts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            {posts.map(post => (
              <SocialPostCard key={post.id} post={post} />
            ))}
          </TabsContent>

          <TabsContent value="twitter" className="space-y-4 mt-4">
            {twitterPosts.map(post => (
              <SocialPostCard key={post.id} post={post} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function SocialPostCard({ post }: { post: SocialPost }) {
  const platformIcon = post.platform === 'twitter' ? '𝕏' : post.platform
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
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="shrink-0">
              {platformIcon}
            </Badge>
          </div>
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
          View on {post.platform === 'twitter' ? '𝕏' : post.platform}
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
