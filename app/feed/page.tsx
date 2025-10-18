import { FeedList } from '@/components/feed/feed-list'
import { SuggestedUsers } from '@/components/social/suggested-users'
import { getChannels } from '@/app/actions/channels'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { MessageCircle, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Feed | CineVerse',
  description: 'See what your friends are watching and reviewing'
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/feed')
  }

  // Fetch popular channels
  const popularChannels = await getChannels({
    sort: 'members',
    limit: 5
  })

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2">
          <FeedList />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SuggestedUsers limit={5} title="Who to follow" />
          
          {/* Popular Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Trending Channels
              </CardTitle>
              <CardDescription>Join communities and discuss movies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {popularChannels.slice(0, 5).map((channel) => (
                <Link
                  key={channel.id}
                  href={`/channel/${channel.slug}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  {channel.icon && (
                    <div className="text-2xl">{channel.icon}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{channel.name}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3" />
                      {channel.member_count.toLocaleString()} members
                    </p>
                  </div>
                </Link>
              ))}
              <Link href="/channels" className="block">
                <Button variant="outline" className="w-full" size="sm">
                  View All Channels
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
