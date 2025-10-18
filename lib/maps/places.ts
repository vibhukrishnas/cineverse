// Google Places API Client for CineVerse
// Provides: Cinema finder, nearby theaters, showtimes

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export interface Cinema {
  placeId: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  rating?: number
  totalRatings?: number
  priceLevel?: number
  openNow?: boolean
  phoneNumber?: string
  website?: string
  photos?: string[]
  distance?: number // in meters
}

export interface CinemaDetails extends Cinema {
  openingHours?: string[]
  reviews?: {
    author: string
    rating: number
    text: string
    time: string
  }[]
}

// Find nearby cinemas
export async function findNearbyCinemas(
  latitude: number,
  longitude: number,
  radius: number = 5000 // meters
): Promise<Cinema[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=movie_theater&key=${GOOGLE_PLACES_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status)
      return []
    }
    
    return data.results.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      priceLevel: place.price_level,
      openNow: place.opening_hours?.open_now,
      photos: place.photos?.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      ) || []
    }))
  } catch (error) {
    console.error('Places API error:', error)
    return []
  }
}

// Search cinemas by name or location
export async function searchCinemas(
  query: string,
  latitude?: number,
  longitude?: number
): Promise<Cinema[]> {
  try {
    const locationParam = latitude && longitude 
      ? `&location=${latitude},${longitude}&radius=50000`
      : ''
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' movie theater')}${locationParam}&key=${GOOGLE_PLACES_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status)
      return []
    }
    
    return data.results.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      priceLevel: place.price_level,
      openNow: place.opening_hours?.open_now,
      photos: place.photos?.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      ) || []
    }))
  } catch (error) {
    console.error('Places API error:', error)
    return []
  }
}

// Get cinema details
export async function getCinemaDetails(placeId: string): Promise<CinemaDetails | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total,price_level,opening_hours,formatted_phone_number,website,photos,reviews&key=${GOOGLE_PLACES_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status !== 'OK') {
      console.error('Places API error:', data.status)
      return null
    }
    
    const place = data.result
    
    return {
      placeId: placeId,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      priceLevel: place.price_level,
      openNow: place.opening_hours?.open_now,
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      photos: place.photos?.map((photo: any) => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      ) || [],
      openingHours: place.opening_hours?.weekday_text,
      reviews: place.reviews?.map((review: any) => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: new Date(review.time * 1000).toISOString()
      })) || []
    }
  } catch (error) {
    console.error('Places API error:', error)
    return null
  }
}

// Get user's current location
export async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        console.error('Geolocation error:', error)
        resolve(null)
      }
    )
  })
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Find cinemas showing a specific movie (requires additional scraping/API)
// Note: Google Places doesn't provide showtimes directly
// You'd need to integrate with services like Fandango, MovieTickets.com, or cinema-specific APIs
export async function findCinemasShowingMovie(
  movieTitle: string,
  latitude: number,
  longitude: number,
  radius: number = 10000
): Promise<Cinema[]> {
  // This would require integration with showtimes APIs
  // For now, return nearby cinemas (assuming they might show the movie)
  return findNearbyCinemas(latitude, longitude, radius)
}
