'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Film, 
  Armchair,
  IndianRupee,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

interface BookingCardProps {
  booking: any
  isPast?: boolean
}

export function BookingCard({ booking, isPast = false }: BookingCardProps) {
  const { showtime, theater, num_seats, total_price, booking_status, created_at } = booking
  const dateObj = parseISO(showtime.show_date)

  const statusConfig = {
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    confirmed: { label: 'Confirmed', variant: 'default' as const, icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle }
  }

  const status = statusConfig[booking_status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <Card className={isPast ? 'opacity-75' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{theater.name}</CardTitle>
            {theater.chain && (
              <CardDescription>{theater.chain.name}</CardDescription>
            )}
          </div>
          <Badge variant={status.variant} className="gap-1">
            <status.icon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{theater.address}</p>
            <p className="text-muted-foreground">
              {theater.city?.name}, {theater.city?.state || theater.city?.country}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span>Date</span>
            </div>
            <p className="font-semibold">{format(dateObj, 'MMM d, yyyy')}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span>Time</span>
            </div>
            <p className="font-semibold text-lg">{showtime.show_time}</p>
          </div>
        </div>

        {/* Show Details */}
        <div className="flex gap-2">
          <Badge variant="secondary">Screen {showtime.screen_number}</Badge>
          <Badge variant="secondary">{showtime.format}</Badge>
          <Badge variant="outline">{showtime.language}</Badge>
        </div>

        {/* Booking Details */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Armchair className="h-4 w-4" />
              <span>Seats Booked</span>
            </div>
            <span className="font-semibold">{num_seats}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              <span>Total Amount</span>
            </div>
            <span className="text-lg font-bold">₹{total_price}</span>
          </div>
        </div>

        {/* Booking Info */}
        <p className="text-xs text-muted-foreground">
          Booked on {format(parseISO(created_at), 'MMM d, yyyy')}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/theaters/${theater.id}`}>
            <Film className="h-4 w-4 mr-2" />
            View Theater
          </Link>
        </Button>
        {theater.booking_url && !isPast && (
          <Button asChild variant="default">
            <Link href={theater.booking_url} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Get Tickets
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
