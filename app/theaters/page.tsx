import { Suspense } from 'react'
import { getCities, searchTheaters } from '@/app/actions/theaters'
import { TheaterGrid } from '@/components/theaters/theater-grid'
import { TheaterFilters } from '@/components/theaters/theater-filters'
import { MapPin, Film, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface SearchParams {
  city_id?: string
  audience_type?: string
  has_imax?: string
  has_dolby_atmos?: string
  has_recliners?: string
  search?: string
}

export default async function TheatersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const cities = await getCities()
  
  // Build search params with proper typing
  const audienceType = searchParams.audience_type as 'high_class' | 'celebration' | 'normal' | undefined
  
  const params = {
    city_id: searchParams.city_id,
    audience_type: audienceType,
    has_imax: searchParams.has_imax === 'true',
    has_dolby_atmos: searchParams.has_dolby_atmos === 'true',
    has_recliners: searchParams.has_recliners === 'true',
  }
  
  const { theaters, total } = await searchTheaters(params)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Film className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Find Theaters</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Discover movie theaters near you and book your next show
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Theaters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {cities.length} cities
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Premium Screens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {theaters.filter(t => t.has_imax || t.has_4dx).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              IMAX & 4DX theaters
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cities Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Major metropolitan areas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>
                Refine your theater search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TheaterFilters cities={cities} />
            </CardContent>
          </Card>
        </div>

        {/* Theater Grid */}
        <div className="lg:col-span-3">
          <Suspense fallback={<TheaterGridSkeleton />}>
            {theaters.length > 0 ? (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">
                    {total} {total === 1 ? 'Theater' : 'Theaters'} Found
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Showing results {params.city_id ? 'for selected city' : 'from all cities'}
                  </p>
                </div>
                <TheaterGrid theaters={theaters} />
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Theaters Found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    We couldn&apos;t find any theaters matching your criteria. Try adjusting your filters or search in a different city.
                  </p>
                </CardContent>
              </Card>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function TheaterGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-4/6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
