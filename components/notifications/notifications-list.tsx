'use client'

import { useState, useEffect } from 'react'
import { 
  getNotifications, 
  markAllNotificationsAsRead,
  deleteReadNotifications
} from '@/app/actions/notifications'
import { NotificationItem } from './notification-item'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCheck, Trash2, Loader2, Bell } from 'lucide-react'
import type { NotificationWithActor } from '@/app/actions/notifications'

export function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [activeTab])

  const loadNotifications = async () => {
    setLoading(true)
    const result = await getNotifications(50, 0, activeTab === 'unread')
    if (result.success) {
      setNotifications(result.notifications)
    }
    setLoading(false)
  }

  const handleMarkAllRead = async () => {
    setIsMarkingRead(true)
    const result = await markAllNotificationsAsRead()
    if (result.success) {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    }
    setIsMarkingRead(false)
  }

  const handleDeleteRead = async () => {
    setIsDeleting(true)
    const result = await deleteReadNotifications()
    if (result.success) {
      setNotifications(notifications.filter(n => !n.is_read))
    }
    setIsDeleting(false)
  }

  const handleNotificationRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    ))
  }

  const handleNotificationDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingRead}
            >
              {isMarkingRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </>
              )}
            </Button>
          )}
          {notifications.some(n => n.is_read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteRead}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear read
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">
            All {!loading && `(${notifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread {!loading && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {activeTab === 'unread' 
                  ? 'You\'re all caught up!' 
                  : 'When someone follows you or interacts with your reviews, you\'ll see it here.'
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleNotificationRead}
                onDelete={handleNotificationDelete}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
