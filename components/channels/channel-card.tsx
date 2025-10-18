'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'
import type { ChannelWithStats } from '@/app/actions/channels'

interface ChannelCardProps {
  channel: ChannelWithStats
}

export function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Link href={`/channel/${channel.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-3">
          {channel.icon && (
            <div className="text-3xl flex-shrink-0">
              {channel.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {channel.name}
            </h3>
            {channel.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                {channel.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {channel.member_count.toLocaleString()} members
              </span>
              {channel.is_official && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                  Official
                </span>
              )}
              {channel.is_member && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                  Joined
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
