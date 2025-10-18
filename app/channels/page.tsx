import { getChannels } from '@/app/actions/channels'
import { ChannelCard } from '@/components/channels/channel-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default async function ChannelsPage({
  searchParams
}: {
  searchParams: { type?: string; search?: string }
}) {
  const type = searchParams.type as 'genre' | 'regional' | 'topic' | 'custom' | undefined
  const search = searchParams.search

  const channels = await getChannels({
    type,
    search,
    sort: 'members',
    limit: 50
  })

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Channels</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Join communities and discuss movies
          </p>
        </div>
        <Link href="/channel/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Channel
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search channels..."
          className="pl-10"
          defaultValue={search}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="genre">By Genre</TabsTrigger>
          <TabsTrigger value="regional">By Region</TabsTrigger>
          <TabsTrigger value="topic">By Topic</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {channels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No channels found
            </div>
          )}
        </TabsContent>

        <TabsContent value="genre" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels
              .filter((c) => c.type === 'genre')
              .map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels
              .filter((c) => c.type === 'regional')
              .map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="topic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels
              .filter((c) => c.type === 'topic')
              .map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels
              .filter((c) => c.type === 'custom')
              .map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
