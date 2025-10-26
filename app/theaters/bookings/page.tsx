import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserBookings } from '@/app/actions/theaters'
import { BookingCard } from '@/components/theaters/booking-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Ticket, Clock } from 'lucide-react'

export default async function BookingsPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/theaters/bookings')
  }

  const bookings = await getUserBookings()

  // Separate bookings by status
  const now = new Date()
  const upcomingBookings = bookings.filter((b: any) => {
    const showDate = new Date(b.showtime.show_date + 'T' + b.showtime.show_time)
    return showDate > now && b.booking_status !== 'cancelled'
  })
  
  const pastBookings = bookings.filter((b: any) => {
    const showDate = new Date(b.showtime.show_date + 'T' + b.showtime.show_time)
    return showDate <= now || b.booking_status === 'cancelled'
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Ticket className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">My Bookings</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          View and manage your theater bookings
        </p>
      </div>

      {/* Stats */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Upcoming Shows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{upcomingBookings.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Past Shows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{pastBookings.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              <Clock className="h-4 w-4 mr-2" />
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              <Calendar className="h-4 w-4 mr-2" />
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {upcomingBookings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcomingBookings.map((booking: any) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Bookings</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You don&apos;t have any upcoming movie bookings. Start exploring theaters to book your next show!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {pastBookings.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pastBookings.map((booking: any) => (
                  <BookingCard key={booking.id} booking={booking} isPast />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Past Bookings</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Your booking history will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Ticket className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You haven&apos;t made any theater bookings yet. Explore our theaters and book your first show!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
