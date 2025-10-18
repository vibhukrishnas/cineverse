'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getFollowingFeed, getDiscoverFeed } from '@/app/actions/feed'
import { FeedItem } from './feed-item'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, Users } from 'lucide-react'
import type { FeedItem as FeedItemType } from '@/app/actions/feed'

const ITEMS_PER_PAGE = 10

export function FeedList() {
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('following')
  const [followingFeed, setFollowingFeed] = useState<FeedItemType[]>([])
  const [discoverFeed, setDiscoverFeed] = useState<FeedItemType[]>([])
  const [followingLoading, setFollowingLoading] = useState(true)
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [followingHasMore, setFollowingHasMore] = useState(true)
  const [discoverHasMore, setDiscoverHasMore] = useState(true)
  const [followingPage, setFollowingPage] = useState(0)
  const [discoverPage, setDiscoverPage] = useState(0)

  const observerTarget = useRef<HTMLDivElement>(null)

  // Load initial feed
  useEffect(() => {
    loadFollowingFeed(0)
  }, [])

  // Load discover feed when tab is clicked
  useEffect(() => {
    if (activeTab === 'discover' && discoverFeed.length === 0) {
      loadDiscoverFeed(0)
    }
  }, [activeTab])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'following' && followingHasMore && !followingLoading) {
            loadFollowingFeed(followingPage + 1)
          } else if (activeTab === 'discover' && discoverHasMore && !discoverLoading) {
            loadDiscoverFeed(discoverPage + 1)
          }
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [activeTab, followingHasMore, discoverHasMore, followingLoading, discoverLoading, followingPage, discoverPage])

  const loadFollowingFeed = async (page: number) => {
    setFollowingLoading(true)
    const result = await getFollowingFeed(ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    
    if (result.success) {
      if (page === 0) {
        setFollowingFeed(result.feed)
      } else {
        setFollowingFeed(prev => [...prev, ...result.feed])
      }
      setFollowingPage(page)
      setFollowingHasMore(result.feed.length === ITEMS_PER_PAGE)
    }
    
    setFollowingLoading(false)
  }

  const loadDiscoverFeed = async (page: number) => {
    setDiscoverLoading(true)
    const result = await getDiscoverFeed(ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    
    if (result.success) {
      if (page === 0) {
        setDiscoverFeed(result.feed)
      } else {
        setDiscoverFeed(prev => [...prev, ...result.feed])
      }
      setDiscoverPage(page)
      setDiscoverHasMore(result.feed.length === ITEMS_PER_PAGE)
    }
    
    setDiscoverLoading(false)
  }

  const currentFeed = activeTab === 'following' ? followingFeed : discoverFeed
  const currentLoading = activeTab === 'following' ? followingLoading : discoverLoading
  const isInitialLoad = currentFeed.length === 0 && currentLoading

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'following' | 'discover')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Following
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="space-y-4 mt-6">
          {isInitialLoad ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : followingFeed.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Your feed is empty
              </p>
              <p className="text-sm text-muted-foreground">
                Follow other users to see their reviews and activity here!
              </p>
            </div>
          ) : (
            <>
              {followingFeed.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
              
              {followingHasMore && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4 mt-6">
          {isInitialLoad ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : discoverFeed.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No reviews yet
              </p>
              <p className="text-sm text-muted-foreground">
                Be the first to write a review!
              </p>
            </div>
          ) : (
            <>
              {discoverFeed.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
              
              {discoverHasMore && (
                <div ref={observerTarget} className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
