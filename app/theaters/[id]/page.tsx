import { notFound } from 'next/navigation'
import { getTheaterById, getShowtimesForTheater } from '@/app/actions/theaters'
import { ShowtimeGrid } from '@/components/theaters/showtime-grid'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock,
  Film,
  Armchair,
  Speaker,
  Star,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface TheaterPageProps {
  params: {
    id: string
  }
  searchParams: {
    date?: string
  }
}

export default async function TheaterPage({ params, searchParams }: TheaterPageProps) {
  const theater = await getTheaterById(params.id)
  
  if (!theater) {
    notFound()
  }

  const showtimes = await getShowtimesForTheater(params.id, searchParams.date)
  
  // Group showtimes by movie
  const showtimesByMovie = showtimes.reduce((acc, showtime) => {
    if (!acc[showtime.tmdb_id]) {
      acc[showtime.tmdb_id] = []
    }
    acc[showtime.tmdb_id].push(showtime)
    return {}
  }, {} as Record<number, typeof showtimes>)

  const audienceTypeLabels = {
    high_class: 'Premium Theater',
    celebration: 'Special Events Theater',
    normal: 'Standard Theater'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Theater Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{theater.name}</h1>
            {theater.chain && (
              <p className="text-lg text-muted-foreground">{theater.chain.name}</p>
            )}
          </div>
          <Badge variant="default" className="text-base px-4 py-2">
            {audienceTypeLabels[theater.audience_type]}
          </Badge>
        </div>

        {/* Contact & Location Bar */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{theater.address}, {theater.city?.name}</span>
          </div>
          {theater.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{theater.phone}</span>
            </div>
          )}
          {theater.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{theater.email}</span>
            </div>
          )}
          {theater.booking_url && (
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href={theater.booking_url} target="_blank">
                <Globe className="h-4 w-4 mr-1" />
                Visit Website
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Theater Info Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Theater Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Theater Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Screens</span>
                <div className="flex items-center gap-1">
                  <Film className="h-4 w-4" />
                  <span className="font-semibold">{theater.total_screens}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Seats</span>
                <div className="flex items-center gap-1">
                  <Armchair className="h-4 w-4" />
                  <span className="font-semibold">{theater.total_seats}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Features */}
          {(theater.has_imax || theater.has_4dx || theater.has_dolby_atmos || theater.has_3d) && (
            <Card>
              <CardHeader>
                <CardTitle>Premium Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {theater.has_imax && (
                  <Badge variant="secondary" className="w-full justify-center">
                    <Film className="h-3 w-3 mr-1" />
                    IMAX
                  </Badge>
                )}
                {theater.has_4dx && (
                  <Badge variant="secondary" className="w-full justify-center">
                    4DX
                  </Badge>
                )}
                {theater.has_dolby_atmos && (
                  <Badge variant="secondary" className="w-full justify-center">
                    <Speaker className="h-3 w-3 mr-1" />
                    Dolby Atmos
                  </Badge>
                )}
                {theater.has_3d && (
                  <Badge variant="secondary" className="w-full justify-center">
                    3D
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {theater.has_parking && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Parking Available</span>
                  </div>
                )}
                {theater.has_food_court && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Food Court</span>
                  </div>
                )}
                {theater.has_wheelchair_access && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Wheelchair Access</span>
                  </div>
                )}
                {theater.has_recliners && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Recliner Seats</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Showtimes */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Showtimes
                  </CardTitle>
                  <CardDescription>
                    Select a show time to book your tickets
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showtimes.length > 0 ? (
                <ShowtimeGrid showtimes={showtimes} theaterId={params.id} />
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Showtimes Available</h3>
                  <p className="text-muted-foreground">
                    There are currently no showtimes scheduled for this theater. Check back later!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
