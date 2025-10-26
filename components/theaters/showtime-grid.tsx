'use client'

import { Showtime } from '@/types/theater'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, Armchair } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ShowtimeGridProps {
  showtimes: Showtime[]
  theaterId: string
}

export function ShowtimeGrid({ showtimes, theaterId }: ShowtimeGridProps) {
  // Group by date
  const showtimesByDate = showtimes.reduce((acc, showtime) => {
    if (!acc[showtime.show_date]) {
      acc[showtime.show_date] = []
    }
    acc[showtime.show_date].push(showtime)
    return acc
  }, {} as Record<string, Showtime[]>)

  const dates = Object.keys(showtimesByDate).sort()
  const [selectedDate, setSelectedDate] = useState(dates[0])

  if (dates.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((date) => {
          const dateObj = parseISO(date)
          const isSelected = date === selectedDate
          
          return (
            <Button
              key={date}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDate(date)}
              className="flex-shrink-0"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {format(dateObj, 'MMM d, yyyy')}
            </Button>
          )
        })}
      </div>

      {/* Showtimes for selected date */}
      {selectedDate && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {showtimesByDate[selectedDate].map((showtime) => (
              <ShowtimeCard key={showtime.id} showtime={showtime} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ShowtimeCard({ showtime }: { showtime: Showtime }) {
  const availabilityPercentage = (showtime.available_seats / showtime.total_seats) * 100
  const availabilityColor = 
    availabilityPercentage > 50 ? 'text-green-600' :
    availabilityPercentage > 20 ? 'text-yellow-600' :
    'text-red-600'

  const formatLabels = {
    '2D': 'secondary',
    '3D': 'default',
    'IMAX': 'default',
    '4DX': 'default'
  } as const

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl">{showtime.show_time}</CardTitle>
          </div>
          <Badge variant={formatLabels[showtime.format] || 'secondary'}>
            {showtime.format}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <span className="text-xs">{showtime.language}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Availability */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Armchair className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Availability:</span>
          </div>
          <span className={`font-semibold ${availabilityColor}`}>
            {showtime.available_seats}/{showtime.total_seats} seats
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price:</span>
          <div className="text-right">
            <span className="text-lg font-bold">₹{showtime.base_price}</span>
            <span className="text-xs text-muted-foreground ml-1">per seat</span>
          </div>
        </div>

        {/* Book Button */}
        <Button
          asChild
          className="w-full"
          disabled={showtime.available_seats === 0}
        >
          {showtime.available_seats > 0 ? (
            <Link href={`/theaters/booking/${showtime.id}`}>
              Book Now
            </Link>
          ) : (
            <span>Sold Out</span>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
