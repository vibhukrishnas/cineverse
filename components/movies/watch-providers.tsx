'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ExternalLink, Tv, DollarSign, ShoppingCart, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WatchProviders, getProviderLogoUrl } from '@/lib/ott/watch-providers'

interface WatchProvidersCardProps {
  movieId: number
  movieTitle: string
  region?: string
}

export function WatchProvidersCard({ movieId, movieTitle, region = 'US' }: WatchProvidersCardProps) {
  const [providers, setProviders] = useState<WatchProviders | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState(region)

  useEffect(() => {
    fetchProviders()
  }, [movieId, selectedRegion])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/watch-providers?movieId=${movieId}&region=${selectedRegion}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      }
    } catch (error) {
      console.error('Error fetching watch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            Where to Watch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!providers || (!providers.flatrate && !providers.rent && !providers.buy && !providers.ads)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            Where to Watch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Streaming information not available for this movie in your region.
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasMultipleTypes = 
    [providers.flatrate, providers.rent, providers.buy, providers.ads].filter(Boolean).length > 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Where to Watch
        </CardTitle>
        <CardDescription>
          Available streaming options for "{movieTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasMultipleTypes ? (
          <Tabs defaultValue="stream" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {providers.flatrate && (
                <TabsTrigger value="stream" className="text-xs">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Stream
                </TabsTrigger>
              )}
              {providers.rent && (
                <TabsTrigger value="rent" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Rent
                </TabsTrigger>
              )}
              {providers.buy && (
                <TabsTrigger value="buy" className="text-xs">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Buy
                </TabsTrigger>
              )}
              {providers.ads && (
                <TabsTrigger value="ads" className="text-xs">
                  <Tv className="h-3 w-3 mr-1" />
                  Free
                </TabsTrigger>
              )}
            </TabsList>

            {providers.flatrate && (
              <TabsContent value="stream">
                <ProviderList providers={providers.flatrate} type="Subscription Streaming" />
              </TabsContent>
            )}

            {providers.rent && (
              <TabsContent value="rent">
                <ProviderList providers={providers.rent} type="Rent" />
              </TabsContent>
            )}

            {providers.buy && (
              <TabsContent value="buy">
                <ProviderList providers={providers.buy} type="Purchase" />
              </TabsContent>
            )}

            {providers.ads && (
              <TabsContent value="ads">
                <ProviderList providers={providers.ads} type="Free with Ads" />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <>
            {providers.flatrate && (
              <ProviderList providers={providers.flatrate} type="Subscription Streaming" />
            )}
            {providers.rent && (
              <ProviderList providers={providers.rent} type="Rent" />
            )}
            {providers.buy && (
              <ProviderList providers={providers.buy} type="Purchase" />
            )}
            {providers.ads && (
              <ProviderList providers={providers.ads} type="Free with Ads" />
            )}
          </>
        )}

        {providers.link && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(providers.link, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View All Options
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Powered by JustWatch • Data for {selectedRegion === 'US' ? 'United States' : 'India'}
        </p>
      </CardContent>
    </Card>
  )
}

interface ProviderListProps {
  providers: Array<{
    logo_path: string
    provider_id: number
    provider_name: string
    display_priority: number
  }>
  type: string
}

function ProviderList({ providers, type }: ProviderListProps) {
  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-xs">
        {type}
      </Badge>
      <div className="grid grid-cols-3 gap-3">
        {providers
          .sort((a, b) => a.display_priority - b.display_priority)
          .map((provider) => (
            <div
              key={provider.provider_id}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
              title={provider.provider_name}
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={getProviderLogoUrl(provider.logo_path)}
                  alt={provider.provider_name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xs text-center line-clamp-2 w-full">
                {provider.provider_name}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
