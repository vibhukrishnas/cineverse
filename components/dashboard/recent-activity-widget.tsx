'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, MessageSquare, Users, Bookmark, Eye, FileText } from 'lucide-react'
import { getRecentActivity, type UserActivity } from '@/app/actions/activity'
import Link from 'next/link'

const ActivityIcon = ({ type }: { type: UserActivity['activity_type'] }) => {
  switch (type) {
    case 'movie_view':
      return <Eye className="h-4 w-4" />
    case 'review_posted':
      return <MessageSquare className="h-4 w-4" />
    case 'post_created':
      return <FileText className="h-4 w-4" />
    case 'channel_joined':
      return <Users className="h-4 w-4" />
    case 'watchlist_added':
      return <Bookmark className="h-4 w-4" />
    default:
      return <Film className="h-4 w-4" />
  }
}

const getActivityText = (activity: UserActivity) => {
  switch (activity.activity_type) {
    case 'movie_view':
      return `Viewed ${activity.entity_title}`
    case 'review_posted':
      return `Posted a review for ${activity.entity_title}`
    case 'post_created':
      return `Created a post: ${activity.entity_title}`
    case 'channel_joined':
      return `Joined ${activity.entity_title}`
    case 'watchlist_added':
      return `Added ${activity.entity_title} to watchlist`
    default:
      return activity.entity_title || 'Activity'
  }
}

const getActivityLink = (activity: UserActivity) => {
  switch (activity.activity_type) {
    case 'movie_view':
    case 'review_posted':
    case 'watchlist_added':
      return `/movie/${activity.entity_id}`
    case 'post_created':
      return `/post/${activity.entity_id}`
    case 'channel_joined':
      return `/channel/${activity.entity_id}`
    default:
      return '#'
  }
}

const getTimeAgo = (date: string) => {
  const now = new Date()
  const activityDate = new Date(date)
  const seconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return activityDate.toLocaleDateString()
}

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    const { activities } = await getRecentActivity(10)
    setActivities(activities)
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest movie reviews and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest movie reviews and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-muted-foreground mb-4">
              Start exploring movies and writing reviews to see your activity here
            </p>
            <Link href="/explore">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Explore Movies
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your recent interactions and discoveries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={getActivityLink(activity)}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="mt-0.5 p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ActivityIcon type={activity.activity_type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getTimeAgo(activity.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
