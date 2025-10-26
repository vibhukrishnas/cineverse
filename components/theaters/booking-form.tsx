'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBooking } from '@/app/actions/theaters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Armchair, 
  IndianRupee, 
  Loader2, 
  CheckCircle2,
  Minus,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

interface BookingFormProps {
  showtime: any
  userId: string
}

export function BookingForm({ showtime, userId }: BookingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [numSeats, setNumSeats] = useState(1)
  const [isSuccess, setIsSuccess] = useState(false)

  const maxSeats = Math.min(10, showtime.available_seats)
  const totalPrice = numSeats * showtime.base_price

  const handleBooking = async () => {
    if (numSeats < 1 || numSeats > maxSeats) {
      toast.error('Invalid number of seats')
      return
    }

    startTransition(async () => {
      try {
        await createBooking(showtime.id, numSeats, totalPrice)
        setIsSuccess(true)
        toast.success('Booking created successfully!')
        
        // Redirect to bookings page after 2 seconds
        setTimeout(() => {
          router.push('/theaters/bookings')
        }, 2000)
      } catch (error) {
        toast.error('Failed to create booking. Please try again.')
        console.error('Booking error:', error)
      }
    })
  }

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground text-center mb-4">
            Your booking has been successfully created.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to your bookings...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Seats</CardTitle>
        <CardDescription>
          Choose the number of seats you want to book
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seat Selection */}
        <div className="space-y-4">
          <Label htmlFor="seats">Number of Seats</Label>
          
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setNumSeats(Math.max(1, numSeats - 1))}
              disabled={numSeats <= 1 || isPending}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex-1">
              <Input
                id="seats"
                type="number"
                min={1}
                max={maxSeats}
                value={numSeats}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  setNumSeats(Math.min(maxSeats, Math.max(1, value)))
                }}
                className="text-center text-2xl font-bold"
                disabled={isPending}
              />
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setNumSeats(Math.min(maxSeats, numSeats + 1))}
              disabled={numSeats >= maxSeats || isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Maximum {maxSeats} seats available
          </p>
        </div>

        {/* Visual Seat Representation */}
        <div className="bg-muted/30 rounded-lg p-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from({ length: numSeats }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-md"
              >
                <Armchair className="h-6 w-6" />
              </div>
            ))}
            {Array.from({ length: Math.min(8 - numSeats, 8) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center justify-center w-12 h-12 bg-muted border-2 border-dashed border-muted-foreground/20 rounded-md"
              >
                <Armchair className="h-6 w-6 text-muted-foreground/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Seats</span>
            <span className="font-medium">{numSeats}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price per Seat</span>
            <span className="font-medium">₹{showtime.base_price}</span>
          </div>
          
          <div className="h-px bg-border" />
          
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Amount</span>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-5 w-5" />
              <span className="text-2xl font-bold">{totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <strong>Note:</strong> This is a booking tracker only. Actual payment and seat assignment 
            will be handled at the theater. Please arrive 15 minutes early to collect your tickets.
          </p>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleBooking}
          disabled={isPending || numSeats < 1 || numSeats > maxSeats}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing Booking...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Confirm Booking - ₹{totalPrice}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By proceeding, you agree to our terms and conditions
        </p>
      </CardContent>
    </Card>
  )
}
