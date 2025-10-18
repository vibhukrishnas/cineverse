'use client'

import { useState, useEffect } from 'react'
import { getFlags, updateFlag } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  FileText,
  Share2
} from 'lucide-react'

export default function ModerationPage() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [filter, setFilter] = useState({
    status: 'pending',
    contentType: 'all',
    flagType: 'all',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    loadFlags()
  }, [filter])

  const loadFlags = async () => {
    setLoading(true)
    const result = await getFlags(filter)
    if (result.success) {
      setFlags(result.flags || [])
    }
    setLoading(false)
  }

  const handleAction = async (flagId: string, action: 'approved' | 'removed' | 'dismissed') => {
    const reason = action === 'removed' 
      ? prompt('Reason for removal:')
      : action === 'dismissed'
      ? prompt('Reason for dismissal:')
      : 'Content approved by moderator'

    if (action !== 'approved' && !reason) return

    const result = await updateFlag(flagId, action, reason)

    if (result.success) {
      alert(`Content ${action} successfully`)
      loadFlags()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const getToxicityColor = (score: number) => {
    if (score >= 0.9) return 'text-red-600 bg-red-50'
    if (score >= 0.7) return 'text-orange-600 bg-orange-50'
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getToxicityLabel = (score: number) => {
    if (score >= 0.9) return 'Very High'
    if (score >= 0.7) return 'High'
    if (score >= 0.5) return 'Medium'
    return 'Low'
  }

  const pendingFlags = flags.filter(f => f.status === 'pending')
  const reviewedFlags = flags.filter(f => f.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground">Review flagged content and AI toxicity alerts</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFlags.length}</div>
            <p className="text-xs text-red-600 mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Toxicity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flags.filter(f => f.ai_toxicity_score >= 0.7).length}
            </div>
            <p className="text-xs text-orange-600 mt-1">AI flagged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Auto-Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flags.filter(f => f.auto_flagged).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">By AI system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reviewed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewedFlags.length}</div>
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
              <option value="approved">Approved</option>
              <option value="removed">Removed</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All Status</option>
            </select>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filter.contentType}
              onChange={(e) => setFilter({ ...filter, contentType: e.target.value as any, page: 1 })}
            >
              <option value="all">All Types</option>
              <option value="review">Reviews</option>
              <option value="comment">Comments</option>
              <option value="post">Posts</option>
            </select>

            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filter.flagType}
              onChange={(e) => setFilter({ ...filter, flagType: e.target.value as any, page: 1 })}
            >
              <option value="all">All Flags</option>
              <option value="ai_toxicity">AI Toxicity</option>
              <option value="ai_spam">AI Spam</option>
              <option value="ai_nsfw">AI NSFW</option>
              <option value="manual">Manual Report</option>
              <option value="multiple_reports">Multiple Reports</option>
            </select>

            <Button onClick={loadFlags} variant="outline">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue ({flags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading flagged content...</p>
            </div>
          ) : flags.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium">All clear!</p>
              <p className="text-muted-foreground">No flagged content to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flags.map((flag) => (
                <ModerationItem
                  key={flag.id}
                  flag={flag}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ModerationItem({ 
  flag, 
  onAction 
}: { 
  flag: any
  onAction: (id: string, action: 'approved' | 'removed' | 'dismissed') => void 
}) {
  const [expanded, setExpanded] = useState(false)

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'review': return FileText
      case 'comment': return MessageSquare
      case 'post': return Share2
      default: return FileText
    }
  }

  const getToxicityColor = (score: number) => {
    if (score >= 0.9) return 'bg-red-100 text-red-800 border-red-300'
    if (score >= 0.7) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getToxicityLabel = (score: number) => {
    if (score >= 0.9) return 'Critical'
    if (score >= 0.7) return 'High'
    if (score >= 0.5) return 'Medium'
    return 'Low'
  }

  const ContentIcon = getContentIcon(flag.content_type)

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <ContentIcon className="h-5 w-5 text-muted-foreground" />
            <Badge variant="outline" className="capitalize">
              {flag.content_type}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {flag.flag_type.replace('_', ' ')}
            </Badge>
            {flag.auto_flagged && (
              <Badge variant="secondary">Auto-flagged</Badge>
            )}
            {flag.manual_review_required && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Manual Review Required
              </Badge>
            )}
          </div>

          {/* AI Toxicity Score */}
          {flag.ai_toxicity_score !== null && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">AI Toxicity:</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getToxicityColor(flag.ai_toxicity_score)}`}>
                {getToxicityLabel(flag.ai_toxicity_score)} ({(flag.ai_toxicity_score * 100).toFixed(0)}%)
              </div>
              {flag.ai_scores && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Hide' : 'Show'} Details
                </Button>
              )}
            </div>
          )}

          {/* AI Score Details */}
          {expanded && flag.ai_scores && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
              {Object.entries(flag.ai_scores).map(([key, value]: [string, any]) => (
                <div key={key} className="text-sm">
                  <div className="text-muted-foreground capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="font-medium">
                    {(value * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content Preview */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Content Preview:</p>
            <p className="text-sm">
              {flag.content_preview || 'No preview available'}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Author: {flag.author?.email || 'Unknown'}</span>
            <span>•</span>
            <span>Flagged: {new Date(flag.created_at).toLocaleString()}</span>
            {flag.reviewed_at && (
              <>
                <span>•</span>
                <span>Reviewed: {new Date(flag.reviewed_at).toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {flag.status === 'pending' && (
          <div className="flex flex-col space-y-2 ml-4">
            <Button
              size="sm"
              variant="default"
              onClick={() => onAction(flag.id, 'approved')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onAction(flag.id, 'removed')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Remove
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(flag.id, 'dismissed')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
          </div>
        )}

        {/* Status Badge */}
        {flag.status !== 'pending' && (
          <Badge 
            variant={
              flag.status === 'approved' ? 'default' :
              flag.status === 'removed' ? 'destructive' :
              'secondary'
            }
          >
            {flag.status}
          </Badge>
        )}
      </div>
    </div>
  )
}
