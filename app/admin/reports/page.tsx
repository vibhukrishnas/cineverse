'use client'

import { useState, useEffect } from 'react'
import { getReports, updateReport } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Flag,
  MessageSquare,
  FileText,
  User,
  Search
} from 'lucide-react'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState({
    status: 'pending',
    reportedType: 'all',
    page: 1,
    limit: 25
  })

  useEffect(() => {
    loadReports()
  }, [filter])

  const loadReports = async () => {
    setLoading(true)
    const result = await getReports(filter)
    if (result.success) {
      setReports(result.reports || [])
      setTotal(result.total || 0)
    }
    setLoading(false)
  }

  const handleAction = async (reportId: string, status: 'approved' | 'removed' | 'dismissed') => {
    const reason = prompt(`Reason for ${status}:`)
    if (!reason) return

    const result = await updateReport(reportId, status, reason)

    if (result.success) {
      alert(`Report ${status} successfully`)
      loadReports()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const pendingReports = reports.filter(r => r.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Reports</h1>
        <p className="text-muted-foreground">Review and moderate user-submitted reports</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports.length}</div>
            <p className="text-xs text-red-600 mt-1">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spam Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.reason === 'spam').length}
            </div>
            <p className="text-xs text-orange-600 mt-1">Most common</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reviewed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.status !== 'pending').length}
            </div>
            <p className="text-xs text-green-600 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any, page: 1 })}
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="removed">Removed</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All Status</option>
            </select>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filter.reportedType}
              onChange={(e) => setFilter({ ...filter, reportedType: e.target.value as any, page: 1 })}
            >
              <option value="all">All Types</option>
              <option value="review">Reviews</option>
              <option value="comment">Comments</option>
              <option value="post">Posts</option>
              <option value="user">Users</option>
            </select>

            <div className="col-span-2">
              <Button onClick={loadReports} variant="outline" className="w-full">
                Refresh Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reports ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium">No reports found</p>
              <p className="text-muted-foreground">Change filters to see more</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportItem
                  key={report.id}
                  report={report}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > filter.limit && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(filter.page - 1) * filter.limit + 1} to{' '}
                {Math.min(filter.page * filter.limit, total)} of {total}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
                  disabled={filter.page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
                  disabled={filter.page * filter.limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReportItem({ 
  report, 
  onAction 
}: { 
  report: any
  onAction: (id: string, action: 'approved' | 'removed' | 'dismissed') => void 
}) {
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'spam': return AlertTriangle
      case 'toxicity': return Flag
      case 'harassment': return AlertTriangle
      case 'inappropriate': return XCircle
      default: return Flag
    }
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam': return 'bg-orange-100 text-orange-800'
      case 'toxicity': return 'bg-red-100 text-red-800'
      case 'harassment': return 'bg-red-100 text-red-800'
      case 'inappropriate': return 'bg-yellow-100 text-yellow-800'
      case 'misinformation': return 'bg-purple-100 text-purple-800'
      case 'copyright': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const ReasonIcon = getReasonIcon(report.reason)

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <ReasonIcon className="h-5 w-5 text-muted-foreground" />
            <Badge variant="outline" className="capitalize">
              {report.reported_type}
            </Badge>
            <Badge className={`capitalize ${getReasonColor(report.reason)}`}>
              {report.reason}
            </Badge>
            {report.status === 'pending' && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Pending Review
              </Badge>
            )}
          </div>

          {/* Description */}
          {report.description && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Report Description:</p>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </div>
          )}

          {/* Reporter & Reported User */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Reporter:</span>
              <div className="font-medium">{report.reporter?.email || 'Unknown'}</div>
            </div>
            {report.reported_user && (
              <div className="text-sm">
                <span className="text-muted-foreground">Reported User:</span>
                <div className="font-medium">{report.reported_user.email}</div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Reported ID: {report.reported_id}</span>
            <span>•</span>
            <span>Created: {new Date(report.created_at).toLocaleString()}</span>
            {report.reviewed_at && (
              <>
                <span>•</span>
                <span>Reviewed: {new Date(report.reviewed_at).toLocaleString()}</span>
              </>
            )}
          </div>

          {/* Admin Notes */}
          {report.admin_notes && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Admin Notes:
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {report.admin_notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {report.status === 'pending' && (
          <div className="flex flex-col space-y-2 ml-4">
            <Button
              size="sm"
              variant="default"
              onClick={() => onAction(report.id, 'approved')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onAction(report.id, 'removed')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Remove
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(report.id, 'dismissed')}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Status Badge */}
        {report.status !== 'pending' && (
          <Badge 
            variant={
              report.status === 'approved' ? 'default' :
              report.status === 'removed' ? 'destructive' :
              'secondary'
            }
            className="capitalize"
          >
            {report.status}
          </Badge>
        )}
      </div>
    </div>
  )
}
