'use client'

import { useState, useEffect } from 'react'
import { getFollowers, getFollowing } from '@/app/actions/follows'
import { UserCard } from './user-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import type { UserProfile } from '@/app/actions/follows'

interface FollowListProps {
  userId: string
  initialTab?: 'followers' | 'following'
}

export function FollowList({ userId, initialTab = 'followers' }: FollowListProps) {
  const [followers, setFollowers] = useState<UserProfile[]>([])
  const [following, setFollowing] = useState<UserProfile[]>([])
  const [followersLoading, setFollowersLoading] = useState(true)
  const [followingLoading, setFollowingLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    loadFollowers()
  }, [userId])

  useEffect(() => {
    if (activeTab === 'following' && following.length === 0) {
      loadFollowing()
    }
  }, [activeTab, userId])

  const loadFollowers = async () => {
    setFollowersLoading(true)
    const result = await getFollowers(userId, 50, 0)
    if (result.success) {
      setFollowers(result.followers)
    }
    setFollowersLoading(false)
  }

  const loadFollowing = async () => {
    setFollowingLoading(true)
    const result = await getFollowing(userId, 50, 0)
    if (result.success) {
      setFollowing(result.following)
    }
    setFollowingLoading(false)
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'followers' | 'following')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="followers">
          Followers {!followersLoading && `(${followers.length})`}
        </TabsTrigger>
        <TabsTrigger value="following">
          Following {!followingLoading && `(${following.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="followers" className="space-y-4">
        {followersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : followers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No followers yet
          </p>
        ) : (
          followers.map((user) => (
            <UserCard key={user.id} user={user} showBio />
          ))
        )}
      </TabsContent>

      <TabsContent value="following" className="space-y-4">
        {followingLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : following.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Not following anyone yet
          </p>
        ) : (
          following.map((user) => (
            <UserCard key={user.id} user={user} showBio />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}
