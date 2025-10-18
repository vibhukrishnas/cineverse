/**
 * Geolocation Service
 * Handles browser geolocation with VPN detection and fallback options
 * Also provides language and region preferences
 */

export interface LocationData {
  city: string | null
  state: string | null
  country: string | null
  countryCode: string | null
  lat: number | null
  lng: number | null
  source: 'browser' | 'ip' | 'manual'
  isVPN?: boolean
}

export interface LanguagePreference {
  code: string // ISO 639-1 code (e.g., 'en', 'hi', 'ta')
  name: string
  nativeName: string
  region: string // TMDB region code (e.g., 'US', 'IN')
}

// Popular Indian languages for Bollywood/Regional cinema
export const INDIAN_LANGUAGES: LanguagePreference[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'IN' },
]

// Popular global languages
export const GLOBAL_LANGUAGES: LanguagePreference[] = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'DE' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'KR' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', region: 'CN' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'BR' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'RU' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'SA' },
]

export const ALL_LANGUAGES = [...GLOBAL_LANGUAGES, ...INDIAN_LANGUAGES]

export interface GeolocationError {
  code: number
  message: string
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'not_supported'
}

/**
 * Get user's location using IP-based geolocation
 */
export async function getUserLocation(): Promise<LocationData | null> {
  try {
    // Using ipapi.co for IP geolocation (free tier: 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/')
    
    if (!response.ok) {
      throw new Error('Failed to fetch location')
    }

    const data = await response.json()
    
    return {
      country: data.country_name,
      countryCode: data.country_code,
      state: data.region,
      city: data.city,
      lat: data.latitude,
      lng: data.longitude,
      source: 'ip',
    }
  } catch (error) {
    console.error('Error fetching user location:', error)
    return null
  }
}

/**
 * Detect preferred language based on user's location
 */
export function detectLanguageFromLocation(location: LocationData): LanguagePreference {
  const countryToLanguage: Record<string, string> = {
    'IN': 'hi', // India -> Hindi (default)
    'US': 'en',
    'GB': 'en',
    'CA': 'en',
    'AU': 'en',
    'ES': 'es',
    'MX': 'es',
    'FR': 'fr',
    'DE': 'de',
    'JP': 'ja',
    'KR': 'ko',
    'CN': 'zh',
    'BR': 'pt',
    'RU': 'ru',
    'SA': 'ar',
  }

  const languageCode = countryToLanguage[location.countryCode || ''] || 'en'
  const language = ALL_LANGUAGES.find(lang => lang.code === languageCode)
  
  return language || GLOBAL_LANGUAGES[0] // Default to English
}

/**
 * Get browser geolocation API
 */
export async function getBrowserLocation(): Promise<LocationData | GeolocationError> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        code: 0,
        message: 'Geolocation is not supported by your browser',
        type: 'not_supported',
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get city/state
          const location = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          )
          
          resolve({
            city: location.city || null,
            state: location.state || null,
            country: location.country || null,
            countryCode: location.countryCode || null,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            source: 'browser',
          })
        } catch (error) {
          resolve({
            city: null,
            state: null,
            country: null,
            countryCode: null,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            source: 'browser',
          })
        }
      },
      (error) => {
        let type: GeolocationError['type'] = 'position_unavailable'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            type = 'permission_denied'
            break
          case error.POSITION_UNAVAILABLE:
            type = 'position_unavailable'
            break
          case error.TIMEOUT:
            type = 'timeout'
            break
        }

        resolve({
          code: error.code,
          message: error.message,
          type,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
  })
}

/**
 * Get location from IP address (with VPN detection)
 */
export async function getIPLocation(): Promise<LocationData> {
  try {
    const response = await fetch('/api/location/ip')
    
    if (!response.ok) {
      throw new Error('Failed to fetch IP location')
    }

    const data = await response.json()
    
    return {
      city: data.city || null,
      state: data.region || null,
      country: data.country || null,
      countryCode: data.countryCode || null,
      lat: data.lat || null,
      lng: data.lon || null,
      source: 'ip',
      isVPN: data.proxy || data.hosting || false,
    }
  } catch (error) {
    console.error('Error fetching IP location:', error)
    return {
      city: null,
      state: null,
      country: null,
      countryCode: null,
      lat: null,
      lng: null,
      source: 'ip',
    }
  }
}

/**
 * Reverse geocode coordinates to get city/state
 * Uses OpenStreetMap Nominatim API (free, no key required)
 */
async function reverseGeocode(lat: number, lng: number): Promise<Partial<LocationData>> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }

    const data = await response.json()
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village || null,
      state: data.address?.state || null,
      country: data.address?.country || null,
      countryCode: data.address?.country_code?.toUpperCase() || null,
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return {
      city: null,
      state: null,
      country: null,
      countryCode: null,
    }
  }
}

/**
 * Get user's preferred location from storage
 */
export function getSavedLocation(): LocationData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem('userLocation')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

/**
 * Save user's preferred location
 */
export function saveLocation(location: LocationData): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('userLocation', JSON.stringify(location))
  } catch (error) {
    console.error('Error saving location:', error)
  }
}

/**
 * Clear saved location
 */
export function clearSavedLocation(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('userLocation')
  } catch (error) {
    console.error('Error clearing location:', error)
  }
}

/**
 * Get location with fallback strategy:
 * 1. Try saved location
 * 2. Try browser geolocation
 * 3. Fallback to IP geolocation
 */
export async function getLocation(): Promise<LocationData> {
  // Check saved location first
  const saved = getSavedLocation()
  if (saved) {
    return saved
  }

  // Try browser geolocation
  const browserLocation = await getBrowserLocation()
  
  if ('lat' in browserLocation && browserLocation.lat) {
    saveLocation(browserLocation)
    return browserLocation
  }

  // Fallback to IP geolocation
  const ipLocation = await getIPLocation()
  
  if (ipLocation.city || ipLocation.lat) {
    saveLocation(ipLocation)
    return ipLocation
  }

  // Default fallback (US)
  return {
    city: null,
    state: null,
    country: 'United States',
    countryCode: 'US',
    lat: null,
    lng: null,
    source: 'manual',
  }
}

/**
 * Popular cities for manual selection
 */
export const POPULAR_CITIES = {
  US: [
    { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.006 },
    { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074 },
    { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  ],
  IN: [
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
    { name: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
    { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  ],
}
