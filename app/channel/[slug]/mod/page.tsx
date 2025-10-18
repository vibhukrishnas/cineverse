import { getChannel } from '@/app/actions/channels'
import { getModeratedChannels } from '@/app/actions/moderation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Pin, Trash, Ban, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export default async function ModerationDashboard({
  params
}: {
  params: { slug: string }
}) {
  const channel = await getChannel(params.slug)
  if (!channel) notFound()
  if (!channel.is_moderator) redirect(`/channel/${params.slug}`)

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          href={`/channel/${params.slug}`}
          className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
        >
          ← Back to {channel.name}
        </Link>
        <h1 className="text-3xl font-bold mt-4 flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Moderation Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage {channel.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Stats Cards */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Members
          </h3>
          <p className="text-3xl font-bold mt-2">
            {channel.member_count.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Posts
          </h3>
          <p className="text-3xl font-bold mt-2">
            {channel.post_count.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Moderators
          </h3>
          <p className="text-3xl font-bold mt-2">
            {channel.moderator_ids.length}
          </p>
        </Card>
      </div>

      {/* Moderation Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Moderation Queue</h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              No pending items
            </p>
            <p className="text-xs text-gray-400">
              Reported posts and comments will appear here
            </p>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Pin className="w-4 h-4 mr-2" />
              Pinned Posts
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Ban className="w-4 h-4 mr-2" />
              Banned Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Moderator
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Trash className="w-4 h-4 mr-2" />
              Removed Content
            </Button>
          </div>
        </Card>

        {/* Channel Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Channel Settings</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {channel.description || 'No description'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Rules</h3>
              {channel.rules && channel.rules.length > 0 ? (
                <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
                  {channel.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-500">No rules set</p>
              )}
            </div>
            <Button variant="outline" className="w-full">
              Edit Channel Settings
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Moderation Log</h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              No recent moderation actions
            </p>
            <p className="text-xs text-gray-400">
              Moderation actions will be logged here
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
