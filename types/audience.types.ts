// Audience Classification System Types

export interface AudienceType {
  id: string
  name: 'high_class' | 'celebration' | 'normal'
  display_name: string
  description: string | null
  icon: string | null
  color: string | null
  price_multiplier: number
  created_at: string
  updated_at: string
}

export interface MovieAudienceClassification {
  id: string
  tmdb_id: number
  audience_type_id: string
  score: number // 0-1 scale
  reasoning: string | null
  auto_classified: boolean
  created_at: string
  updated_at: string
  audience_type?: AudienceType
}

export interface UserAudiencePreference {
  id: string
  user_id: string
  audience_type_id: string
  preference_level: number // 1-10 scale
  created_at: string
  updated_at: string
  audience_type?: AudienceType
}

export interface AudienceEvent {
  id: string
  tmdb_id: number
  audience_type_id: string
  theater_name: string
  theater_location: string | null
  screening_time: string
  available_seats: number
  total_seats: number
  base_price: number
  final_price: number
  amenities: string[]
  special_features: string[]
  food_options: string[]
  dress_code: string | null
  min_group_size: number
  booking_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  audience_type?: AudienceType
}

export interface MovieAudienceScore {
  audience_type: string
  display_name: string
  score: number
  reasoning: string
  icon: string
  color: string
}

export interface AudienceRecommendation {
  tmdb_id: number
  score: number
  reasoning: string
}
