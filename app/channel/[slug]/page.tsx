import { getChannel, getPosts } from '@/app/actions/channels'
import { JoinChannelButton } from '@/components/channels/join-channel-button'
import { PostCard } from '@/components/channels/post-card'
import { ChannelTwitterFeed } from '@/components/channels/channel-twitter-feed'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/ui/back-button'
import { Plus, Users, FileText, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function ChannelPage({
  params,
  searchParams
}: {
  params: { slug: string }
  searchParams: { sort?: string }
}) {
  let channel
  let posts: any[] = []
  let error: string | null = null
  const sortOption = (searchParams.sort as 'hot' | 'top' | 'new' | 'controversial') || 'hot'

  // Try to fetch channel with error handling
  try {
    channel = await getChannel(params.slug)
    if (!channel) {
      notFound()
    }
  } catch (e: any) {
    console.error('Error fetching channel:', e)
    error = e.message || 'Failed to load channel'
  }

  // Try to fetch posts if channel loaded successfully
  if (channel && !error) {
    try {
      posts = await getPosts({
        channelId: channel.id,
        sort: sortOption,
        limit: 20,
        includeAuthor: true
      })
    } catch (e: any) {
      console.error('Error fetching posts:', e)
      // Don't block the page if posts fail to load
      posts = []
    }
  }

  // Show error state
  if (error || !channel) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <BackButton fallbackUrl="/channels" />
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Channel not found'}
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">
              This channel may not exist or there was an error loading it.
            </p>
            <Link href="/channels">
              <Button>Browse All Channels</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back Button */}
      <div className="container max-w-6xl mx-auto px-4 pt-4">
        <BackButton fallbackUrl="/channels" />
      </div>

      {/* Channel Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        {channel.banner_url && (
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
        )}
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            {channel.icon && (
              <div className="text-5xl">{channel.icon}</div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{channel.name}</h1>
              {channel.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {channel.member_count.toLocaleString()} members
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  {channel.post_count.toLocaleString()} posts
                </span>
                {channel.is_official && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                    Official Channel
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <JoinChannelButton
                channelId={channel.id}
                isMember={channel.is_member || false}
                memberCount={channel.member_count}
              />
              {channel.is_member && (
                <Link href={`/channel/${channel.slug}/post/create`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </Link>
              )}
              {channel.is_moderator && (
                <Link href={`/channel/${channel.slug}/mod`}>
                  <Button variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Moderate
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sort Options */}
            <Card className="p-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 px-2">Sort by:</span>
                <Tabs defaultValue={sortOption}>
                  <TabsList>
                    <Link href={`/channel/${channel.slug}?sort=hot`}>
                      <TabsTrigger value="hot">Hot</TabsTrigger>
                    </Link>
                    <Link href={`/channel/${channel.slug}?sort=new`}>
                      <TabsTrigger value="new">New</TabsTrigger>
                    </Link>
                    <Link href={`/channel/${channel.slug}?sort=top`}>
                      <TabsTrigger value="top">Top</TabsTrigger>
                    </Link>
                    <Link href={`/channel/${channel.slug}?sort=controversial`}>
                      <TabsTrigger value="controversial">Controversial</TabsTrigger>
                    </Link>
                  </TabsList>
                </Tabs>
              </div>
            </Card>

            {/* Posts */}
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} showChannel={false} />
              ))
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No posts yet</p>
                {channel.is_member && (
                  <Link href={`/channel/${channel.slug}/post/create`}>
                    <Button className="mt-4">
                      Be the first to post
                    </Button>
                  </Link>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* About */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">About</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  {channel.description || 'No description'}
                </p>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Members</span>
                    <span className="font-medium">{channel.member_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Posts</span>
                    <span className="font-medium">{channel.post_count.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Rules */}
            {channel.rules && channel.rules.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Channel Rules</h3>
                <ol className="space-y-2 text-sm">
                  {channel.rules.map((rule: string, index: number) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400">
                      {index + 1}. {rule}
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {/* Twitter Feed */}
            <ChannelTwitterFeed
              channelName={channel.name}
              twitterHandle={channel.twitter_handle}
              tmdbId={channel.tmdb_id}
              channelType={channel.type}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
