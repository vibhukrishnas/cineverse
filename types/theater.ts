// Theater & Ticketing Types
export interface City {
  id: string
  name: string
  state: string | null
  country: string
  latitude: number | null
  longitude: number | null
  timezone: string
  is_active: boolean
  created_at: string
}

export interface TheaterChain {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  booking_url: string | null
  country: string
  is_active: boolean
  created_at: string
}

export interface Theater {
  id: string
  chain_id: string | null
  city_id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  audience_type: 'high_class' | 'celebration' | 'normal'
  total_screens: number
  total_seats: number
  
  // Amenities
  has_parking: boolean
  has_food_court: boolean
  has_wheelchair_access: boolean
  has_3d: boolean
  has_imax: boolean
  has_4dx: boolean
  has_dolby_atmos: boolean
  has_recliners: boolean
  
  // Contact
  phone: string | null
  email: string | null
  booking_url: string | null
  
  // Status
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  chain?: TheaterChain
  city?: City
}

export interface TheaterAmenities {
  parking: boolean
  food_court: boolean
  wheelchair_access: boolean
  '3d': boolean
  imax: boolean
  '4dx': boolean
  dolby_atmos: boolean
  recliners: boolean
}

export interface MovieRelease {
  id: string
  tmdb_id: number
  country: string
  release_date: string
  release_type: string | null
  certification: string | null
  is_active: boolean
  created_at: string
}

export interface Showtime {
  id: string
  theater_id: string
  tmdb_id: number
  screen_number: number
  show_date: string
  show_time: string
  language: string
  format: '2D' | '3D' | 'IMAX' | '4DX'
  available_seats: number
  total_seats: number
  base_price: number
  final_price?: number
  booking_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  theater?: Theater
}

export interface Booking {
  id: string
  user_id: string
  showtime_id: string
  theater_id: string
  tmdb_id: number
  num_seats: number
  total_price: number
  booking_status: 'pending' | 'confirmed' | 'cancelled'
  external_booking_id: string | null
  created_at: string
  updated_at: string
  
  // Relations
  showtime?: Showtime
  theater?: Theater
}

// Search & Filter Types
export interface TheaterSearchParams {
  city_id?: string
  audience_type?: 'high_class' | 'celebration' | 'normal'
  has_imax?: boolean
  has_dolby_atmos?: boolean
  has_recliners?: boolean
  latitude?: number
  longitude?: number
  radius_km?: number
}

export interface ShowtimeSearchParams {
  tmdb_id: number
  theater_id?: string
  city_id?: string
  date?: string
  audience_type?: 'high_class' | 'celebration' | 'normal'
}

// API Response Types
export interface TheaterWithDetails extends Theater {
  chain?: TheaterChain
  city?: City
  amenities: TheaterAmenities
  distance_km?: number
}

export interface ShowtimeWithDetails extends Showtime {
  theater: TheaterWithDetails
  seats_left: number
}

export interface TheaterSearchResult {
  theaters: TheaterWithDetails[]
  total: number
}

export interface ShowtimeSearchResult {
  showtimes: ShowtimeWithDetails[]
  dates: string[]
  total: number
}
