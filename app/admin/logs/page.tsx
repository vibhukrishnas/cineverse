import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  User, 
  Ban, 
  Trash2, 
  UserCog,
  Flag,
  Settings,
  Star,
  Bell
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
  const supabase = await createClient()
  
  // Get recent logs
  const { data: logs } = await supabase
    .from('admin_logs')
    .select(`
      *,
      admin:admin_id(email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate stats
  const actionCounts = logs?.reduce((acc: Record<string, number>, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {})

  const uniqueAdmins = new Set(logs?.map(log => log.admin_id)).size
  const last24h = logs?.filter(log => 
    new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Complete history of admin actions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 24 Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{last24h}</div>
            <p className="text-xs text-muted-foreground mt-1">Recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAdmins}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Common Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">
              {actionCounts && Object.keys(actionCounts).length > 0
                ? Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0][0].replace(/_/g, ' ')
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {actionCounts && Object.keys(actionCounts).length > 0
                ? `${Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0][1]} times`
                : 'No actions yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Action Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {actionCounts && Object.entries(actionCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([action, count]) => (
                <div key={action} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm capitalize">{action.replace(/_/g, ' ')}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No audit logs yet</p>
              <p className="text-muted-foreground">Admin actions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LogItem({ log }: { log: any }) {
  const getActionIcon = (action: string) => {
    if (action.includes('ban')) return Ban
    if (action.includes('delete')) return Trash2
    if (action.includes('role')) return UserCog
    if (action.includes('flag') || action.includes('report')) return Flag
    if (action.includes('setting')) return Settings
    if (action.includes('feature')) return Star
    if (action.includes('announcement')) return Bell
    return FileText
  }

  const getActionColor = (action: string) => {
    if (action.includes('ban') || action.includes('delete')) return 'text-red-600 bg-red-50'
    if (action.includes('approve')) return 'text-green-600 bg-green-50'
    if (action.includes('remove')) return 'text-orange-600 bg-orange-50'
    if (action.includes('update') || action.includes('setting')) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  const Icon = getActionIcon(log.action)

  return (
    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium capitalize">
            {log.action.replace(/_/g, ' ')}
          </span>
          <Badge variant="outline" className="text-xs">
            {log.target_type}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          By: <span className="font-medium">{log.admin?.email || 'Unknown'}</span>
        </p>
        
        {log.reason && (
          <p className="text-sm text-muted-foreground mt-1">
            Reason: {log.reason}
          </p>
        )}
        
        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
          <span>Target ID: {log.target_id.slice(0, 8)}...</span>
          <span>•</span>
          <span>{new Date(log.created_at).toLocaleString()}</span>
          {log.ip_address && (
            <>
              <span>•</span>
              <span>IP: {log.ip_address}</span>
            </>
          )}
        </div>
        
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              View metadata
            </summary>
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
