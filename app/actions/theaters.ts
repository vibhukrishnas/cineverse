'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  Theater, 
  TheaterWithDetails, 
  Showtime, 
  City,
  TheaterSearchParams,
  ShowtimeSearchParams 
} from '@/types/theater'

// Get all cities
export async function getCities() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    console.error('Error fetching cities:', error)
    return []
  }
  
  return data as City[]
}

// Get theater by ID
export async function getTheaterById(theaterId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('theaters')
    .select(`
      *,
      chain:theater_chains(*),
      city:cities(*)
    `)
    .eq('id', theaterId)
    .eq('is_active', true)
    .single()
  
  if (error) {
    console.error('Error fetching theater:', error)
    return null
  }
  
  return data as TheaterWithDetails
}

// Search theaters
export async function searchTheaters(params: TheaterSearchParams) {
  const supabase = await createClient()
  
  let query = supabase
    .from('theaters')
    .select(`
      *,
      chain:theater_chains(*),
      city:cities(*)
    `)
    .eq('is_active', true)
  
  if (params.city_id) {
    query = query.eq('city_id', params.city_id)
  }
  
  if (params.audience_type) {
    query = query.eq('audience_type', params.audience_type)
  }
  
  if (params.has_imax) {
    query = query.eq('has_imax', true)
  }
  
  if (params.has_dolby_atmos) {
    query = query.eq('has_dolby_atmos', true)
  }
  
  if (params.has_recliners) {
    query = query.eq('has_recliners', true)
  }
  
  query = query.order('name')
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error searching theaters:', error)
    return { theaters: [], total: 0 }
  }
  
  return {
    theaters: data as TheaterWithDetails[],
    total: data.length
  }
}

// Get theaters by city
export async function getTheatersByCity(cityId: string, audienceType?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('theaters')
    .select(`
      *,
      chain:theater_chains(*),
      city:cities(*)
    `)
    .eq('city_id', cityId)
    .eq('is_active', true)
  
  if (audienceType) {
    query = query.eq('audience_type', audienceType)
  }
  
  query = query.order('audience_type').order('name')
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching theaters by city:', error)
    return []
  }
  
  return data as TheaterWithDetails[]
}

// Get showtimes for a movie
export async function getShowtimesForMovie(params: ShowtimeSearchParams) {
  const supabase = await createClient()
  
  let query = supabase
    .from('showtimes')
    .select(`
      *,
      theater:theaters(
        *,
        chain:theater_chains(*),
        city:cities(*)
      )
    `)
    .eq('tmdb_id', params.tmdb_id)
    .eq('is_active', true)
  
  if (params.theater_id) {
    query = query.eq('theater_id', params.theater_id)
  }
  
  if (params.date) {
    query = query.eq('show_date', params.date)
  } else {
    // Default to today and next 7 days
    const today = new Date().toISOString().split('T')[0]
    query = query.gte('show_date', today)
  }
  
  query = query.order('show_date').order('show_time')
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching showtimes:', error)
    return { showtimes: [], dates: [], total: 0 }
  }
  
  // Extract unique dates
  const dates = Array.from(new Set(data.map((st: any) => st.show_date))).sort()
  
  return {
    showtimes: data as any[],
    dates,
    total: data.length
  }
}

// Get showtimes for a theater
export async function getShowtimesForTheater(theaterId: string, date?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('showtimes')
    .select('*')
    .eq('theater_id', theaterId)
    .eq('is_active', true)
  
  if (date) {
    query = query.eq('show_date', date)
  } else {
    const today = new Date().toISOString().split('T')[0]
    query = query.gte('show_date', today)
  }
  
  query = query.order('show_date').order('show_time')
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching theater showtimes:', error)
    return []
  }
  
  return data as Showtime[]
}

// Create a booking (tracking only)
export async function createBooking(
  showtimeId: string,
  numSeats: number,
  totalPrice: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to create a booking')
  }
  
  // Get showtime details
  const { data: showtime, error: showtimeError } = await supabase
    .from('showtimes')
    .select('*, theater:theaters(*)')
    .eq('id', showtimeId)
    .single()
  
  if (showtimeError || !showtime) {
    throw new Error('Showtime not found')
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      showtime_id: showtimeId,
      theater_id: showtime.theater_id,
      tmdb_id: showtime.tmdb_id,
      num_seats: numSeats,
      total_price: totalPrice,
      booking_status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating booking:', error)
    throw new Error('Failed to create booking')
  }
  
  return data
}

// Get user's bookings
export async function getUserBookings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      showtime:showtimes(*),
      theater:theaters(
        *,
        chain:theater_chains(*),
        city:cities(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user bookings:', error)
    return []
  }
  
  return data
}

// Search nearby theaters using coordinates
export async function searchNearbyTheaters(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  audienceType?: string
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('search_nearby_theaters', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_km: radiusKm,
      p_audience_type: audienceType || null
    })
  
  if (error) {
    console.error('Error searching nearby theaters:', error)
    return []
  }
  
  // Fetch full theater details for returned IDs
  if (data && data.length > 0) {
    const theaterIds = data.map((t: any) => t.theater_id)
    
    const { data: theaters, error: theatersError } = await supabase
      .from('theaters')
      .select(`
        *,
        chain:theater_chains(*),
        city:cities(*)
      `)
      .in('id', theaterIds)
    
    if (theatersError) {
      console.error('Error fetching theater details:', error)
      return []
    }
    
    // Merge distance data
    return theaters.map((theater: any) => {
      const distanceData = data.find((d: any) => d.theater_id === theater.id)
      return {
        ...theater,
        distance_km: distanceData?.distance_km
      }
    }) as TheaterWithDetails[]
  }
  
  return []
}
