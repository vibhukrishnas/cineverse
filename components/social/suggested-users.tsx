'use client'

import { useState, useEffect } from 'react'
import { getSuggestedUsers } from '@/app/actions/follows'
import { UserCard } from './user-card'
import { Card } from '@/components/ui/card'
import { Loader2, Users } from 'lucide-react'
import type { UserProfile } from '@/app/actions/follows'

interface SuggestedUsersProps {
  limit?: number
  title?: string
}

export function SuggestedUsers({ limit = 5, title = 'Suggested Users' }: SuggestedUsersProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSuggestions()
  }, [limit])

  const loadSuggestions = async () => {
    setLoading(true)
    const result = await getSuggestedUsers(limit)
    if (result.success) {
      setUsers(result.users)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (users.length === 0) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">
        {users.map((user) => (
          <UserCard 
            key={user.id} 
            user={user} 
            showBio={false}
            showFollowButton
          />
        ))}
      </div>
    </Card>
  )
}
