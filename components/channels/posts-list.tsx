'use client'

import { useState, useEffect } from 'react'
import { PostCard } from './post-card'
import { Button } from '@/components/ui/button'
import type { PostWithAuthor } from '@/app/actions/channels'
import { Loader2 } from 'lucide-react'

interface PostsListProps {
  initialPosts: PostWithAuthor[]
  channelId?: string
  sort?: 'hot' | 'top' | 'new' | 'controversial'
  showChannel?: boolean
}

export function PostsList({ 
  initialPosts, 
  channelId, 
  sort = 'hot',
  showChannel = true 
}: PostsListProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts)
  const [offset, setOffset] = useState(initialPosts.length)
  const [hasMore, setHasMore] = useState(initialPosts.length === 20)
  const [isLoading, setIsLoading] = useState(false)

  const loadMore = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/posts?channelId=${channelId || ''}&sort=${sort}&offset=${offset}&limit=20`
      )
      const newPosts = await response.json()

      if (newPosts.length < 20) {
        setHasMore(false)
      }

      setPosts([...posts, ...newPosts])
      setOffset(offset + newPosts.length)
    } catch (error) {
      console.error('Failed to load more posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [offset, hasMore, isLoading])

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showChannel={showChannel} />
      ))}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more posts
        </div>
      )}

      {!isLoading && hasMore && posts.length > 0 && (
        <div className="text-center py-4">
          <Button onClick={loadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No posts yet
        </div>
      )}
    </div>
  )
}
