import { getDashboardStats, getUserSignupTrend, getReviewsTrend } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, FileText, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { stats } = await getDashboardStats()
  const { data: signupTrend } = await getUserSignupTrend(30)
  const { data: reviewTrend } = await getReviewsTrend(30)

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth ? `+${typeof stats.userGrowth === 'number' ? stats.userGrowth.toFixed(1) : stats.userGrowth}%` : null,
      trend: stats?.userGrowth && (typeof stats.userGrowth === 'number' ? stats.userGrowth > 0 : parseFloat(stats.userGrowth) > 0) ? 'up' : 'neutral',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      subtitle: 'Last 24 hours',
      icon: Activity,
      color: 'text-green-600',
    },
    {
      title: 'Total Reviews',
      value: stats?.totalReviews || 0,
      change: stats?.reviewGrowth ? `+${typeof stats.reviewGrowth === 'number' ? stats.reviewGrowth.toFixed(1) : stats.reviewGrowth}%` : null,
      trend: stats?.reviewGrowth && (typeof stats.reviewGrowth === 'number' ? stats.reviewGrowth > 0 : parseFloat(stats.reviewGrowth) > 0) ? 'up' : 'neutral',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports || 0,
      trend: (stats?.pendingReports || 0) > 10 ? 'down' : 'neutral',
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : null

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                {stat.change && (
                  <div className="flex items-center mt-1">
                    {TrendIcon && <TrendIcon className={`h-4 w-4 mr-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />}
                    <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} from last week
                    </p>
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Signups (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {signupTrend && signupTrend.length > 0 ? (
              <div className="space-y-2">
                {signupTrend.slice(-7).map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-2 bg-blue-500 rounded"
                        style={{ width: `${Math.min(day.signups * 10, 200)}px` }}
                      />
                      <span className="text-sm font-medium w-8 text-right">{day.signups}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews Per Day (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewTrend && reviewTrend.length > 0 ? (
              <div className="space-y-2">
                {reviewTrend.slice(-7).map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-2 bg-purple-500 rounded"
                        style={{ width: `${Math.min(day.reviews * 5, 200)}px` }}
                      />
                      <span className="text-sm font-medium w-8 text-right">{day.reviews}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickActionCard
          title="Manage Users"
          description="View and moderate user accounts"
          href="/admin/users"
          icon={Users}
        />
        <QuickActionCard
          title="Review Reports"
          description="Check pending content reports"
          href="/admin/moderation"
          icon={AlertCircle}
        />
        <QuickActionCard
          title="View Analytics"
          description="Detailed platform analytics"
          href="/admin/analytics"
          icon={Activity}
        />
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: any
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <a href={href}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Icon className="h-6 w-6 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </a>
    </Card>
  )
}
