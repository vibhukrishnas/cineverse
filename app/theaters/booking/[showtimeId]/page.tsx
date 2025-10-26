import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingForm } from '@/components/theaters/booking-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Film, 
  Armchair,
  IndianRupee
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface BookingPageProps {
  params: {
    showtimeId: string
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/auth/login?redirect=/theaters/booking/${params.showtimeId}`)
  }

  // Get showtime with theater details
  const { data: showtime, error } = await supabase
    .from('showtimes')
    .select(`
      *,
      theater:theaters(
        *,
        chain:theater_chains(*),
        city:cities(*)
      )
    `)
    .eq('id', params.showtimeId)
    .eq('is_active', true)
    .single()

  if (error || !showtime) {
    notFound()
  }

  // Check if showtime is still available
  if (showtime.available_seats === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Showtime Sold Out</CardTitle>
            <CardDescription>
              Unfortunately, this showtime is completely booked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please select a different showtime or check back later for cancellations.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dateObj = parseISO(showtime.show_date)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
          <p className="text-muted-foreground">
            Select your seats and confirm your booking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Theater */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Theater</span>
                  </div>
                  <p className="font-semibold">{showtime.theater.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {showtime.theater.address}
                  </p>
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                  </div>
                  <p className="font-semibold">{format(dateObj, 'EEEE, MMMM d, yyyy')}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Showtime</span>
                  </div>
                  <p className="text-2xl font-bold">{showtime.show_time}</p>
                </div>

                {/* Format & Language */}
                <div className="flex gap-2">
                  <Badge variant="default">{showtime.format}</Badge>
                  <Badge variant="secondary">{showtime.language}</Badge>
                </div>

                {/* Screen */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Film className="h-4 w-4" />
                    <span>Screen</span>
                  </div>
                  <p className="font-semibold">Screen {showtime.screen_number}</p>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Armchair className="h-4 w-4" />
                    <span>Available Seats</span>
                  </div>
                  <p className="font-semibold">
                    {showtime.available_seats} / {showtime.total_seats}
                  </p>
                </div>

                {/* Price */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <IndianRupee className="h-4 w-4" />
                    <span>Price per Seat</span>
                  </div>
                  <p className="text-2xl font-bold">₹{showtime.base_price}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <BookingForm 
              showtime={showtime}
              userId={user.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
