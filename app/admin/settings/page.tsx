'use client'

import { useState, useEffect } from 'react'
import { getPlatformSettings, updatePlatformSetting } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Shield, 
  Mail, 
  Zap,
  Save,
  RefreshCw
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getPlatformSettings()
    if (result.success) {
      setSettings(result.settings || {})
    }
    setLoading(false)
  }

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setChanged(prev => new Set(prev).add(key))
  }

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setChanged(prev => new Set(prev).add(key))
  }

  const handleSave = async (key: string) => {
    setSaving(true)
    const result = await updatePlatformSetting(key, settings[key])
    
    if (result.success) {
      setChanged(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      alert('Setting saved successfully')
    } else {
      alert(`Error: ${result.error}`)
    }
    setSaving(false)
  }

  const handleSaveAll = async () => {
    setSaving(true)
    let successCount = 0
    
    const changedKeys = Array.from(changed)
    for (const key of changedKeys) {
      const result = await updatePlatformSetting(key, settings[key])
      if (result.success) successCount++
    }
    
    setChanged(new Set())
    alert(`Saved ${successCount} setting(s) successfully`)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure platform features and behavior</p>
        </div>
        {changed.size > 0 && (
          <Button onClick={handleSaveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Save All Changes ({changed.size})
          </Button>
        )}
      </div>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Feature Toggles</CardTitle>
          </div>
          <CardDescription>
            Enable or disable platform features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingToggle
            label="Enable Channels"
            description="Allow users to create and join movie discussion channels"
            value={settings['features.channels_enabled']}
            onChange={(v) => handleToggle('features.channels_enabled', v)}
            changed={changed.has('features.channels_enabled')}
            onSave={() => handleSave('features.channels_enabled')}
          />
          
          <SettingToggle
            label="Enable Social Feed"
            description="Display social feed with user activity on homepage"
            value={settings['features.social_feed_enabled']}
            onChange={(v) => handleToggle('features.social_feed_enabled', v)}
            changed={changed.has('features.social_feed_enabled')}
            onSave={() => handleSave('features.social_feed_enabled')}
          />
          
          <SettingToggle
            label="Enable AI Recommendations"
            description="Use AI to generate personalized movie recommendations"
            value={settings['features.ai_recommendations_enabled']}
            onChange={(v) => handleToggle('features.ai_recommendations_enabled', v)}
            changed={changed.has('features.ai_recommendations_enabled')}
            onSave={() => handleSave('features.ai_recommendations_enabled')}
          />
          
          <SettingToggle
            label="Maintenance Mode"
            description="Put the platform in maintenance mode (only admins can access)"
            value={settings['features.maintenance_mode']}
            onChange={(v) => handleToggle('features.maintenance_mode', v)}
            changed={changed.has('features.maintenance_mode')}
            onSave={() => handleSave('features.maintenance_mode')}
            dangerous
          />
        </CardContent>
      </Card>

      {/* Moderation Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Moderation Settings</CardTitle>
          </div>
          <CardDescription>
            Configure content moderation and safety features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingInput
            label="Auto-Flag Toxicity Threshold"
            description="AI toxicity score (0-1) that triggers automatic flagging"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={settings['moderation.auto_flag_threshold']}
            onChange={(v) => handleChange('moderation.auto_flag_threshold', parseFloat(v))}
            changed={changed.has('moderation.auto_flag_threshold')}
            onSave={() => handleSave('moderation.auto_flag_threshold')}
          />
          
          <SettingInput
            label="Auto-Hide Threshold"
            description="AI toxicity score that automatically hides content"
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={settings['moderation.auto_hide_threshold']}
            onChange={(v) => handleChange('moderation.auto_hide_threshold', parseFloat(v))}
            changed={changed.has('moderation.auto_hide_threshold')}
            onSave={() => handleSave('moderation.auto_hide_threshold')}
          />
          
          <SettingInput
            label="Max Reports Before Auto-Flag"
            description="Number of user reports that triggers auto-flagging"
            type="number"
            min={1}
            max={20}
            value={settings['moderation.max_reports_before_flag']}
            onChange={(v) => handleChange('moderation.max_reports_before_flag', parseInt(v))}
            changed={changed.has('moderation.max_reports_before_flag')}
            onSave={() => handleSave('moderation.max_reports_before_flag')}
          />
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>API Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure external API integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingInput
            label="TMDB API Rate Limit"
            description="Maximum requests per second to TMDB API"
            type="number"
            min={1}
            max={50}
            value={settings['api.tmdb_rate_limit']}
            onChange={(v) => handleChange('api.tmdb_rate_limit', parseInt(v))}
            changed={changed.has('api.tmdb_rate_limit')}
            onSave={() => handleSave('api.tmdb_rate_limit')}
          />
          
          <SettingToggle
            label="Enable Perspective API"
            description="Use Google Perspective API for toxicity detection"
            value={settings['api.perspective_enabled']}
            onChange={(v) => handleToggle('api.perspective_enabled', v)}
            changed={changed.has('api.perspective_enabled')}
            onSave={() => handleSave('api.perspective_enabled')}
          />
          
          <SettingToggle
            label="Enable YouTube Integration"
            description="Show YouTube trailers and clips in movie pages"
            value={settings['api.youtube_enabled']}
            onChange={(v) => handleToggle('api.youtube_enabled', v)}
            changed={changed.has('api.youtube_enabled')}
            onSave={() => handleSave('api.youtube_enabled')}
          />
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure email notifications and delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingToggle
            label="Welcome Emails"
            description="Send welcome email to new users"
            value={settings['email.welcome_enabled']}
            onChange={(v) => handleToggle('email.welcome_enabled', v)}
            changed={changed.has('email.welcome_enabled')}
            onSave={() => handleSave('email.welcome_enabled')}
          />
          
          <SettingToggle
            label="Notification Emails"
            description="Send email notifications for important events"
            value={settings['email.notifications_enabled']}
            onChange={(v) => handleToggle('email.notifications_enabled', v)}
            changed={changed.has('email.notifications_enabled')}
            onSave={() => handleSave('email.notifications_enabled')}
          />
          
          <SettingToggle
            label="Weekly Digest"
            description="Send weekly digest emails to active users"
            value={settings['email.digest_enabled']}
            onChange={(v) => handleToggle('email.digest_enabled', v)}
            changed={changed.has('email.digest_enabled')}
            onSave={() => handleSave('email.digest_enabled')}
          />
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>
            Configure security and rate limiting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingInput
            label="Max Login Attempts"
            description="Maximum failed login attempts before temporary lock"
            type="number"
            min={3}
            max={10}
            value={settings['security.max_login_attempts']}
            onChange={(v) => handleChange('security.max_login_attempts', parseInt(v))}
            changed={changed.has('security.max_login_attempts')}
            onSave={() => handleSave('security.max_login_attempts')}
          />
          
          <SettingInput
            label="Session Timeout (minutes)"
            description="User session timeout in minutes"
            type="number"
            min={15}
            max={1440}
            value={settings['security.session_timeout']}
            onChange={(v) => handleChange('security.session_timeout', parseInt(v))}
            changed={changed.has('security.session_timeout')}
            onSave={() => handleSave('security.session_timeout')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SettingToggle({ 
  label, 
  description, 
  value, 
  onChange, 
  changed,
  onSave,
  dangerous = false
}: { 
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
  changed: boolean
  onSave: () => void
  dangerous?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <Label htmlFor={label} className="font-medium">
            {label}
          </Label>
          {changed && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
          {dangerous && <Badge variant="destructive" className="text-xs">Dangerous</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex items-center space-x-3 ml-4">
        <button
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${value ? 'bg-primary' : 'bg-muted'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${value ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        {changed && (
          <Button size="sm" variant="outline" onClick={onSave}>
            Save
          </Button>
        )}
      </div>
    </div>
  )
}

function SettingInput({ 
  label, 
  description, 
  type,
  min,
  max,
  step,
  value, 
  onChange, 
  changed,
  onSave
}: { 
  label: string
  description: string
  type: string
  min?: number
  max?: number
  step?: number
  value: any
  onChange: (value: string) => void
  changed: boolean
  onSave: () => void
}) {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div>
        <div className="flex items-center space-x-2">
          <Label htmlFor={label} className="font-medium">
            {label}
          </Label>
          {changed && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex items-center space-x-3">
        <Input
          id={label}
          type={type}
          min={min}
          max={max}
          step={step}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-xs"
        />
        {changed && (
          <Button size="sm" variant="outline" onClick={onSave}>
            Save
          </Button>
        )}
      </div>
    </div>
  )
}
