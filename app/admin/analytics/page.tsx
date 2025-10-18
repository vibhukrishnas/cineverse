import { getDashboardStats, getUserSignupTrend, getReviewsTrend } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  TrendingUp, 
  FileText, 
  Activity,
  Eye,
  Heart,
  MessageSquare,
  Star
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const { stats } = await getDashboardStats()
  const { data: signupTrend } = await getUserSignupTrend(30)
  const { data: reviewTrend } = await getReviewsTrend(30)

  // Calculate additional analytics
  const totalSignups30d = signupTrend?.reduce((sum: number, day: any) => sum + day.signups, 0) || 0
  const avgSignupsPerDay = totalSignups30d / 30
  const totalReviews7d = reviewTrend?.slice(-7).reduce((sum: number, day: any) => sum + day.reviews, 0) || 0
  const avgReviewsPerDay = totalReviews7d / 7

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Detailed platform metrics and insights</p>
      </div>

      {/* User Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">User Analytics</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
              {stats?.userGrowth !== undefined && (
                <p className="text-xs text-green-600 mt-1">
                  +{typeof stats.userGrowth === 'number' ? stats.userGrowth.toFixed(1) : stats.userGrowth}% from last week
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Users (24h)
                </CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.activeUsers && stats?.totalUsers 
                  ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) 
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New Signups (30d)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSignups30d.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {avgSignupsPerDay.toFixed(1)} per day avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Retention Rate
                </CardTitle>
                <Heart className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.activeUsers && totalSignups30d 
                  ? ((stats.activeUsers / totalSignups30d) * 100).toFixed(1) 
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active vs new users
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Signup Trend */}
      <Card>
        <CardHeader>
          <CardTitle>User Registrations (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {signupTrend && signupTrend.length > 0 ? (
            <div className="space-y-2">
              <div className="h-64 flex items-end space-x-1">
                {signupTrend.map((day: any, index: number) => {
                  const maxSignups = Math.max(...signupTrend.map((d: any) => d.signups))
                  const height = (day.signups / maxSignups) * 100
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div 
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all relative"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.signups} users
                        </div>
                      </div>
                      {index % 5 === 0 && (
                        <span className="text-xs text-muted-foreground mt-2">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No signup data available</p>
          )}
        </CardContent>
      </Card>

      {/* Content Analytics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Content Analytics</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reviews
                </CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReviews?.toLocaleString() || 0}</div>
              {stats?.reviewGrowth !== undefined && (
                <p className="text-xs text-green-600 mt-1">
                  +{typeof stats.reviewGrowth === 'number' ? stats.reviewGrowth.toFixed(1) : stats.reviewGrowth}% from last week
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reviews (7d)
                </CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews7d.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {avgReviewsPerDay.toFixed(1)} per day avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Channels
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalChannels?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active communities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Rating
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2</div>
              <p className="text-xs text-muted-foreground mt-1">Out of 5 stars</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Review Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewTrend && reviewTrend.length > 0 ? (
            <div className="space-y-3">
              {reviewTrend.slice(-7).map((day: any) => {
                const maxReviews = Math.max(...reviewTrend.slice(-7).map((d: any) => d.reviews))
                const percentage = (day.reviews / maxReviews) * 100
                
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="font-medium">{day.reviews} reviews</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No review data available</p>
          )}
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Engagement Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reviews per User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalUsers && stats?.totalReviews 
                  ? (stats.totalReviews / stats.totalUsers).toFixed(2)
                  : '0.00'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Average content contribution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Active Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.activeUsers && stats?.totalUsers 
                  ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Users active in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {avgReviewsPerDay.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Reviews per day (7d avg)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Moderation Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium mb-3">Content Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Reports</span>
                  <Badge variant="destructive">{stats?.pendingReports || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Auto-Flagged Content</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Bans</span>
                  <Badge variant="outline">0</Badge>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Platform Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Content Approval Rate</span>
                  <span className="font-medium">98.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="font-medium">2.3 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User Satisfaction</span>
                  <span className="font-medium">4.2/5</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
