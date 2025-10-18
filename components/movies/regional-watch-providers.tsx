'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ExternalLink, Tv, Globe, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Provider {
  logo_path: string
  provider_name: string
  provider_id: number
}

interface RegionalProviders {
  flatrate?: Provider[]
  rent?: Provider[]
  buy?: Provider[]
  link?: string
}

// Provider URLs mapping for direct links
const PROVIDER_URLS: Record<number, (movieTitle: string) => string> = {
  8: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`, // Netflix
  9: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`, // Amazon Prime
  337: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`, // Disney+
  350: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`, // Apple TV+
  384: (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}`, // HBO Max/Max
  15: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`, // Hulu
  531: (title) => `https://www.paramountplus.com/search/${encodeURIComponent(title)}`, // Paramount+
  386: (title) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`, // Peacock
  619: (title) => `https://www.hotstar.com/in/search?q=${encodeURIComponent(title)}`, // Disney+ Hotstar
  122: (title) => `https://www.sonyliv.com/search?term=${encodeURIComponent(title)}`, // SonyLIV
  175: (title) => `https://www.zee5.com/search?q=${encodeURIComponent(title)}`, // Zee5
  2: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`, // Apple iTunes
  3: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`, // Google Play
  10: (title) => `https://www.primevideo.com/search?phrase=${encodeURIComponent(title)}`, // Amazon Video
  192: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+full+movie`, // YouTube
  1899: (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}`, // Max
  389: (title) => `https://www.pluto.tv/search?query=${encodeURIComponent(title)}`, // Pluto TV
  257: (title) => `https://www.fubo.tv/welcome/search?query=${encodeURIComponent(title)}`, // fuboTV
  387: (title) => `https://www.starz.com/search?query=${encodeURIComponent(title)}`, // Starz
  43: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`, // Crunchyroll
  283: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`, // Crunchyroll (alternate)
  1796: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`, // Netflix basic with ads
  119: (title) => `https://www.primevideo.com/search?phrase=${encodeURIComponent(title)}`, // Amazon Prime Video
  1854: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`, // Apple TV
  677: (title) => `https://www.crackle.com/search?query=${encodeURIComponent(title)}`, // Crackle
}

const REGIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
]

interface RegionalWatchProvidersProps {
  movieId: number
  movieTitle: string
}

export function RegionalWatchProviders({ movieId, movieTitle }: RegionalWatchProvidersProps) {
  const [selectedRegion, setSelectedRegion] = useState('US')
  const [providers, setProviders] = useState<RegionalProviders | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [movieId, selectedRegion])

  const fetchProviders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/watch-providers?movieId=${movieId}&region=${selectedRegion}`)
      const data = await response.json()
      
      if (response.ok) {
        setProviders(data)
      } else {
        setError('No streaming data available')
      }
    } catch (err) {
      console.error('Error fetching watch providers:', err)
      setError('Failed to load streaming options')
    } finally {
      setLoading(false)
    }
  }

  const renderProviders = (providerList: Provider[] | undefined, type: string) => {
    if (!providerList || providerList.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium capitalize">{type}</h4>
        <div className="flex flex-wrap gap-3">
          {providerList.map((provider) => {
            const providerUrl = PROVIDER_URLS[provider.provider_id]?.(movieTitle) || providers?.link
            const isClickable = !!providerUrl

            const content = (
              <>
                <div className={`relative w-12 h-12 rounded-lg overflow-hidden bg-muted ${isClickable ? 'group-hover:ring-2 group-hover:ring-primary group-hover:scale-105' : ''} transition-all`}>
                  <Image
                    src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                    alt={provider.provider_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className={`text-xs text-center text-muted-foreground max-w-[60px] truncate ${isClickable ? 'group-hover:text-foreground' : ''} transition-colors`}>
                  {provider.provider_name}
                </span>
              </>
            )

            return isClickable ? (
              <a
                key={provider.provider_id}
                href={providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 group cursor-pointer"
                title={`Watch ${movieTitle} on ${provider.provider_name}`}
              >
                {content}
              </a>
            ) : (
              <div
                key={provider.provider_id}
                className="flex flex-col items-center gap-1"
                title={provider.provider_name}
              >
                {content}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const selectedRegionData = REGIONS.find(r => r.code === selectedRegion)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Where to Watch
            </CardTitle>
            <CardDescription>
              Available streaming options for "{movieTitle}"
            </CardDescription>
          </div>
          
          {/* Region Selector */}
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue>
                {selectedRegionData && (
                  <span className="flex items-center gap-2">
                    <span>{selectedRegionData.flag}</span>
                    <span className="text-sm">{selectedRegionData.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  <span className="flex items-center gap-2">
                    <span>{region.flag}</span>
                    <span>{region.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : error || !providers || (!providers.flatrate && !providers.rent && !providers.buy) ? (
          <div className="text-center py-8">
            <Tv className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              No streaming options available in {selectedRegionData?.name}
            </p>
            {providers?.link && (
              <Button variant="outline" size="sm" asChild>
                <a href={providers.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Options
                </a>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Subscription Streaming */}
            {renderProviders(providers.flatrate, 'Subscription Streaming')}
            
            {/* Rent */}
            {renderProviders(providers.rent, 'Rent')}
            
            {/* Buy */}
            {renderProviders(providers.buy, 'Buy')}

            {/* JustWatch Link */}
            {providers.link && (
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <a href={providers.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Options on JustWatch
                  </a>
                </Button>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Powered by JustWatch • Data for {selectedRegionData?.flag} {selectedRegionData?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
