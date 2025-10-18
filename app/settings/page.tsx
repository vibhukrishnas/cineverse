import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings/settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Settings | CineVerse',
  description: 'Manage your account settings and preferences'
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/settings')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your profile information and bio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm user={user} profile={profile} />
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account Created</label>
              <p className="text-sm">
                {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-xs font-mono text-muted-foreground">{user.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your activity
                </p>
              </div>
              <div className="text-sm text-muted-foreground">Coming soon</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Review Likes</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone likes your review
                </p>
              </div>
              <div className="text-sm text-muted-foreground">Coming soon</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Followers</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone follows you
                </p>
              </div>
              <div className="text-sm text-muted-foreground">Coming soon</div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>
              Control your privacy and data sharing preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to other users
                </p>
              </div>
              <div className="text-sm text-muted-foreground">Public</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activity Visibility</p>
                <p className="text-sm text-muted-foreground">
                  Show your activity in public feeds
                </p>
              </div>
              <div className="text-sm text-muted-foreground">Public</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Help us improve by sharing anonymous usage data
                </p>
              </div>
              <div className="text-sm text-muted-foreground">Enabled</div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <div className="text-sm text-muted-foreground">Contact Support</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
