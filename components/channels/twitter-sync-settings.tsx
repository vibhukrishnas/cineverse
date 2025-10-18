'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Twitter, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { toggleTwitterSync, manualSyncTweets } from '@/app/actions/twitter-sync'

interface TwitterSyncSettingsProps {
  channelSlug: string
  channelName: string
  twitterHandle?: string
  syncEnabled?: boolean
  lastSyncedTweetId?: string
  lastSyncAt?: string
}

export function TwitterSyncSettings({
  channelSlug,
  channelName,
  twitterHandle,
  syncEnabled = false,
  lastSyncedTweetId,
  lastSyncAt
}: TwitterSyncSettingsProps) {
  const [enabled, setEnabled] = useState(syncEnabled)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    setMessage(null)

    const result = await toggleTwitterSync(channelSlug, checked)
    
    if (result.success) {
      setEnabled(checked)
      setMessage({ type: 'success', text: result.message || 'Settings updated' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings' })
    }

    setLoading(false)
  }

  const handleManualSync = async () => {
    setSyncing(true)
    setMessage(null)

    const result = await manualSyncTweets(channelSlug)
    
    if (result.success) {
      const postsCount = 'postsCreated' in result ? result.postsCreated : 0
      setMessage({ 
        type: 'success', 
        text: result.message || `Synced ${postsCount} new tweets` 
      })
    } else {
      setMessage({ type: 'error', text: result.error || 'Sync failed' })
    }

    setSyncing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Twitter className="h-5 w-5 text-blue-500" />
          <CardTitle>Twitter Auto-Sync</CardTitle>
        </div>
        <CardDescription>
          Automatically post tweets from @{twitterHandle || 'unknown'} to this channel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Twitter Handle Display */}
        {twitterHandle ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Twitter className="h-4 w-4 text-blue-500" />
            <span className="font-medium">@{twitterHandle}</span>
            <Badge variant="secondary" className="ml-auto">
              Connected
            </Badge>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No Twitter account configured. Add a Twitter handle to this channel first.
            </AlertDescription>
          </Alert>
        )}

        {/* Enable/Disable Toggle */}
        {twitterHandle && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="sync-toggle" className="text-base">
                Auto-Sync Tweets
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically fetch and post new tweets as discussions
              </p>
            </div>
            <Switch
              id="sync-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>
        )}

        {/* Status Information */}
        {enabled && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            
            {lastSyncedTweetId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Tweet ID:</span>
                <span className="font-mono text-xs">{lastSyncedTweetId.substring(0, 15)}...</span>
              </div>
            )}

            {lastSyncAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Synced:</span>
                <span>{new Date(lastSyncAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {!enabled && twitterHandle && (
          <Alert>
            <AlertDescription>
              Enable auto-sync to automatically post new tweets from @{twitterHandle} to this channel.
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Sync Button */}
        {twitterHandle && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleManualSync}
              disabled={syncing || !enabled}
              variant="outline"
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Manually trigger a sync to fetch latest tweets immediately
            </p>
          </div>
        )}

        {/* Status Messages */}
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Instructions */}
        {!twitterHandle && (
          <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
            <h4 className="font-medium text-sm">Setup Instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Add a Twitter handle to this channel</li>
              <li>Get your Twitter API Bearer Token</li>
              <li>Add TWITTER_BEARER_TOKEN to .env.local</li>
              <li>Enable auto-sync toggle</li>
              <li>Tweets will be automatically posted!</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
