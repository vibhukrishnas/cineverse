'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { joinChannel, leaveChannel } from '@/app/actions/channels'
import { useRouter } from 'next/navigation'

interface JoinChannelButtonProps {
  channelId: string
  isMember: boolean
  memberCount: number
}

export function JoinChannelButton({ channelId, isMember, memberCount }: JoinChannelButtonProps) {
  const [joined, setJoined] = useState(isMember)
  const [count, setCount] = useState(memberCount)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    const previousJoined = joined
    const previousCount = count

    // Optimistic update
    setJoined(!joined)
    setCount(joined ? count - 1 : count + 1)

    try {
      if (joined) {
        await leaveChannel(channelId)
      } else {
        await joinChannel(channelId)
      }
      router.refresh()
    } catch (error) {
      // Revert on error
      setJoined(previousJoined)
      setCount(previousCount)
      console.error('Failed to toggle membership:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={joined ? 'outline' : 'default'}
      size="sm"
    >
      {joined ? 'Leave' : 'Join'} • {count.toLocaleString()}
    </Button>
  )
}
