'use client'

import { useState, useEffect } from 'react'
import { Globe, MapPin, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ALL_LANGUAGES,
  INDIAN_LANGUAGES,
  GLOBAL_LANGUAGES,
  getUserLocation,
  detectLanguageFromLocation,
  type LanguagePreference,
  type LocationData,
} from '@/lib/location/geolocation'

interface LanguageSelectorProps {
  onLanguageChange: (language: LanguagePreference) => void
  onRegionChange: (region: string) => void
  compact?: boolean
}

export function LanguageSelector({
  onLanguageChange,
  onRegionChange,
  compact = false,
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguagePreference>(GLOBAL_LANGUAGES[0])
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoDetected, setAutoDetected] = useState(false)

  useEffect(() => {
    // Load saved preference from localStorage only once on mount
    const saved = localStorage.getItem('cineverse_language_preference')
    const savedRegion = localStorage.getItem('cineverse_region')
    if (saved) {
      const lang = ALL_LANGUAGES.find(l => l.code === saved)
      if (lang) {
        setSelectedLanguage(lang)
        // Only notify parent if this is truly from localStorage (not default)
        if (saved !== 'en') {
          onLanguageChange(lang)
          onRegionChange(savedRegion || lang.region)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAutoDetect = async () => {
    setLoading(true)
    try {
      const userLocation = await getUserLocation()
      if (userLocation) {
        setLocation(userLocation)
        const detectedLanguage = detectLanguageFromLocation(userLocation)
        setSelectedLanguage(detectedLanguage)
        setAutoDetected(true)
        
        // Save to localStorage
        localStorage.setItem('cineverse_language_preference', detectedLanguage.code)
        localStorage.setItem('cineverse_region', userLocation.countryCode || 'US')
        
        onLanguageChange(detectedLanguage)
        onRegionChange(userLocation.countryCode || 'US')
      }
    } catch (error) {
      console.error('Failed to detect location:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageSelect = (languageCode: string) => {
    const language = ALL_LANGUAGES.find(l => l.code === languageCode)
    if (language) {
      setSelectedLanguage(language)
      setAutoDetected(false)
      
      localStorage.setItem('cineverse_language_preference', language.code)
      localStorage.setItem('cineverse_region', language.region)
      
      onLanguageChange(language)
      onRegionChange(language.region)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select value={selectedLanguage.code} onValueChange={handleLanguageSelect}>
          <SelectTrigger className="w-[180px]">
            <Globe className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Global Languages
            </div>
            {GLOBAL_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName})
              </SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Indian Languages
            </div>
            {INDIAN_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={handleAutoDetect}
          disabled={loading}
          title="Auto-detect location"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Language & Region Preferences
        </CardTitle>
        <CardDescription>
          Choose your preferred language to see trending movies in your region
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedLanguage.code} onValueChange={handleLanguageSelect}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Global Languages
              </div>
              {GLOBAL_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    {lang.name} <span className="text-muted-foreground">({lang.nativeName})</span>
                  </span>
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2 border-t">
                Indian Regional Languages
              </div>
              {INDIAN_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    {lang.name} <span className="text-muted-foreground">({lang.nativeName})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleAutoDetect}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Auto-detect
              </>
            )}
          </Button>
        </div>

        {location && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {location.city}, {location.country}
            </Badge>
            {autoDetected && (
              <Badge variant="outline">Auto-detected</Badge>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Region: <span className="font-semibold">{selectedLanguage.region}</span> • 
          Language: <span className="font-semibold">{selectedLanguage.name}</span>
        </div>
      </CardContent>
    </Card>
  )
}
