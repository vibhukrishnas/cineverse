'use client'

import { Theater, TheaterWithDetails } from '@/types/theater'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Star, 
  Clock, 
  Armchair, 
  Speaker, 
  Film,
  ExternalLink,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

interface TheaterGridProps {
  theaters: TheaterWithDetails[]
}

export function TheaterGrid({ theaters }: TheaterGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {theaters.map((theater) => (
        <TheaterCard key={theater.id} theater={theater} />
      ))}
    </div>
  )
}

function TheaterCard({ theater }: { theater: TheaterWithDetails }) {
  const audienceTypeLabels = {
    high_class: { label: 'Premium', variant: 'default' as const },
    celebration: { label: 'Special Events', variant: 'secondary' as const },
    normal: { label: 'Standard', variant: 'outline' as const }
  }

  const audienceInfo = audienceTypeLabels[theater.audience_type]

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{theater.name}</CardTitle>
            {theater.chain && (
              <CardDescription className="text-sm">
                {theater.chain.name}
              </CardDescription>
            )}
          </div>
          <Badge variant={audienceInfo.variant}>{audienceInfo.label}</Badge>
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

        {/* Theater Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Film className="h-4 w-4" />
            <span>{theater.total_screens} screens</span>
          </div>
          <div className="flex items-center gap-1">
            <Armchair className="h-4 w-4" />
            <span>{theater.total_seats} seats</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2">
          {theater.has_imax && (
            <Badge variant="secondary" className="text-xs">
              <Film className="h-3 w-3 mr-1" />
              IMAX
            </Badge>
          )}
          {theater.has_4dx && (
            <Badge variant="secondary" className="text-xs">
              4DX
            </Badge>
          )}
          {theater.has_dolby_atmos && (
            <Badge variant="secondary" className="text-xs">
              <Speaker className="h-3 w-3 mr-1" />
              Dolby Atmos
            </Badge>
          )}
          {theater.has_recliners && (
            <Badge variant="secondary" className="text-xs">
              <Armchair className="h-3 w-3 mr-1" />
              Recliners
            </Badge>
          )}
          {theater.has_3d && (
            <Badge variant="secondary" className="text-xs">
              3D
            </Badge>
          )}
        </div>

        {/* Contact */}
        {(theater.phone || theater.email) && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {theater.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{theater.phone}</span>
              </div>
            )}
            {theater.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{theater.email}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href={`/theaters/${theater.id}`}>
            <Clock className="h-4 w-4 mr-2" />
            View Showtimes
          </Link>
        </Button>
        {theater.booking_url && (
          <Button asChild variant="outline">
            <Link href={theater.booking_url} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
