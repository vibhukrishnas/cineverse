'use client'

import { useState } from 'react'
import { MapPin, Navigation, Globe, AlertCircle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocation } from '@/hooks/use-location'
import { POPULAR_CITIES, LocationData } from '@/lib/location/geolocation'

interface LocationPickerProps {
  onLocationChange?: (location: LocationData) => void
}

export function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const { location, loading, error, requestBrowserLocation, useIPLocation, setManualLocation } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<'US' | 'IN'>('US')

  const handleBrowserLocation = async () => {
    await requestBrowserLocation()
    if (location && onLocationChange) {
      onLocationChange(location)
    }
  }

  const handleIPLocation = async () => {
    await useIPLocation()
    if (location && onLocationChange) {
      onLocationChange(location)
    }
  }

  const handleManualSelect = (city: typeof POPULAR_CITIES.US[0]) => {
    const newLocation: LocationData = {
      city: city.name,
      state: city.state,
      country: selectedCountry === 'US' ? 'United States' : 'India',
      countryCode: selectedCountry,
      lat: city.lat,
      lng: city.lng,
      source: 'manual',
    }
    
    setManualLocation(newLocation)
    
    if (onLocationChange) {
      onLocationChange(newLocation)
    }
    
    setIsOpen(false)
  }

  const displayLocation = location?.city 
    ? `${location.city}${location.state ? `, ${location.state}` : ''}`
    : location?.country || 'Select Location'

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MapPin className="h-4 w-4" />
        {loading ? 'Loading...' : displayLocation}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dialog */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Set Your Location</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Choose how you'd like to set your location for theater search and local content.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Browser Geolocation */}
                <div className="space-y-2">
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={handleBrowserLocation}
                    disabled={loading}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Use My Current Location
                  </Button>
                  <p className="text-xs text-muted-foreground px-1">
                    Most accurate. Requires permission.
                  </p>
                </div>

                {/* IP Location */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleIPLocation}
                    disabled={loading}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Detect from IP Address
                  </Button>
                  <p className="text-xs text-muted-foreground px-1">
                    Quick but may show VPN location if you're using one.
                  </p>
                </div>

                {/* Manual Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Or choose manually:</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={selectedCountry === 'US' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCountry('US')}
                      className="flex-1"
                    >
                      🇺🇸 United States
                    </Button>
                    <Button
                      variant={selectedCountry === 'IN' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCountry('IN')}
                      className="flex-1"
                    >
                      🇮🇳 India
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {POPULAR_CITIES[selectedCountry].map((city) => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleManualSelect(city)}
                        className="justify-start text-left"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{city.name}</span>
                          <span className="text-xs text-muted-foreground">{city.state}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">
                      {error.type === 'permission_denied' 
                        ? 'Location permission denied. Please use manual selection.'
                        : 'Unable to detect location. Please select manually.'}
                    </p>
                  </div>
                )}

                {/* VPN Warning */}
                {location?.isVPN && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-600">
                      VPN detected. Location may not be accurate. Consider using browser location or manual selection.
                    </p>
                  </div>
                )}

                {/* Current Location Display */}
                {location && (
                  <div className="flex items-start gap-2 p-3 bg-accent rounded-lg">
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium">Current Location:</p>
                      <p className="text-muted-foreground">
                        {displayLocation}
                        <span className="text-xs ml-2">
                          (via {location.source})
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
