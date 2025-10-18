'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Heart, UserPlus, MessageSquare, Star, Bell } from 'lucide-react'
import { markNotificationAsRead, deleteNotification } from '@/app/actions/notifications'
import type { NotificationWithActor } from '@/app/actions/notifications'
import { useState } from 'react'

interface NotificationItemProps {
  notification: NotificationWithActor
  onDelete?: (id: string) => void
  onRead?: (id: string) => void
}

export function NotificationItem({ notification, onDelete, onRead }: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClick = async () => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)
      onRead?.(notification.id)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDeleting(true)
    const result = await deleteNotification(notification.id)
    if (result.success) {
      onDelete?.(notification.id)
    }
    setIsDeleting(false)
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'follow':
        return <UserPlus className="h-5 w-5 text-blue-500" />
      case 'review_like':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'review_comment':
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case 'review_helpful':
        return <Star className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const content = (
    <Card 
      className={`p-4 transition-colors cursor-pointer hover:bg-muted/50 ${
        !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
      } ${isDeleting ? 'opacity-50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon or Actor Avatar */}
        <div className="flex-shrink-0">
          {notification.actor ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
              {notification.actor.avatar_url ? (
                <img
                  src={notification.actor.avatar_url}
                  alt={notification.actor.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                notification.actor.username.substring(0, 2).toUpperCase()
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {getIcon()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm mb-1">{notification.title}</p>
          {notification.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
              {notification.content}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-4 right-12 w-2 h-2 rounded-full bg-primary" />
      )}
    </Card>
  )

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>
  }

  return content
}
