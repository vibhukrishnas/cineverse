'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  Eye, 
  TrendingUp, 
  Activity,
  BarChart3,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface ChannelAnalyticsProps {
  analytics: {
    channel: {
      name: string
      slug: string
      description: string | null
      member_count: number
      post_count: number
      created_at: string
      type: string
      icon: string | null
    }
    stats: {
      totalMembers: number
      totalPosts: number
      totalViews: number
      totalEngagement: number
      avgPostScore: number
      newMembersThisMonth: number
      postsThisWeek: number
      engagementRate: number
    }
    topPosts: Array<{
      id: string
      title: string
      score: number
      view_count: number
      comment_count: number
      created_at: string
    }>
    growthTrend: 'growing' | 'stable'
  }
}

export function ChannelAnalytics({ analytics }: ChannelAnalyticsProps) {
  const { channel, stats, topPosts, growthTrend } = analytics

  return (
    <div className="space-y-6">
      {/* Channel Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {channel.icon ? (
              <img 
                src={channel.icon} 
                alt={channel.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                {channel.name[0]}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold">{channel.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{channel.slug} • {channel.type}
              </p>
              {channel.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {channel.description}
                </p>
              )}
            </div>
          </div>
          <Link href={`/channel/${channel.slug}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Channel
            </Button>
          </Link>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                +{stats.newMembersThisMonth} this month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {stats.postsThisWeek} this week
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
              <p className="text-xs text-gray-500">
                Avg: {Math.round(stats.totalViews / (stats.totalPosts || 1))} per post
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgPostScore}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Post Score</p>
              <p className="text-xs text-gray-500">
                {stats.engagementRate} engagement rate
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Growth Indicator */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <TrendingUp className={`w-6 h-6 ${growthTrend === 'growing' ? 'text-green-600' : 'text-gray-600'}`} />
          <div>
            <h4 className="font-semibold">Channel Status</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {growthTrend === 'growing' ? '🚀 Growing - Active member growth detected' : '📊 Stable - Consistent activity'}
            </p>
          </div>
        </div>
      </Card>

      {/* Top Posts */}
      {topPosts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold">Top Performing Posts</h4>
          </div>
          <div className="space-y-3">
            {topPosts.map((post, index) => (
              <div 
                key={post.id} 
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <Link href={`/post/${post.id}`}>
                    <h5 className="font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      {post.title}
                    </h5>
                  </Link>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>⬆️ {post.score} points</span>
                    <span>💬 {post.comment_count} comments</span>
                    <span>👁️ {post.view_count} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
