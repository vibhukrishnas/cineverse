import { NotificationsList } from '@/components/notifications/notifications-list'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Notifications | CineVerse',
  description: 'Your notifications and activity updates'
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/notifications')
  }

  return (
    <div className="container max-w-3xl py-8">
      <NotificationsList />
    </div>
  )
}
