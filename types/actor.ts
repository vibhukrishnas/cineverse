// Actor/Person Types
export interface Actor {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  gender: number // 0 = not set, 1 = female, 2 = male, 3 = non-binary
  popularity: number
  also_known_as: string[]
  homepage: string | null
  imdb_id: string | null
}

export interface ActorSocialMedia {
  id: number
  imdb_id: string | null
  facebook_id: string | null
  instagram_id: string | null
  tiktok_id: string | null
  twitter_id: string | null
  youtube_id: string | null
  wikidata_id: string | null
}

export interface ActorMovieCredit {
  id: number
  title: string
  character?: string
  job?: string
  department?: string
  release_date: string
  poster_path: string | null
  vote_average?: number // Only present for cast credits
  popularity?: number // Only present for cast credits
}

export interface ActorCredits {
  id: number
  cast: ActorMovieCredit[]
  crew: ActorMovieCredit[]
}

export interface ActorImage {
  file_path: string
  aspect_ratio: number
  height: number
  width: number
  vote_average: number
  vote_count: number
}

export interface ActorSearchResult {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
  popularity: number
  known_for: {
    id: number
    title: string
    poster_path: string | null
    vote_average: number
  }[]
}

// Database Types for Actor Following
export interface ActorFollow {
  id: string
  user_id: string
  actor_id: number // TMDB person ID
  actor_name: string
  actor_profile_path: string | null
  created_at: string
}

export interface ActorUpdate {
  id: string
  actor_id: number
  update_type: 'new_movie' | 'birthday' | 'news' | 'social_post'
  title: string
  description: string
  image_url: string | null
  link_url: string | null
  published_at: string
  created_at: string
}

// Helper Types
export interface ActorWithSocial extends Actor {
  social: ActorSocialMedia
}

export interface ActorWithCredits extends Actor {
  credits: ActorCredits
  social: ActorSocialMedia
}

// Social Media Link Helpers
export const getSocialMediaUrl = (platform: keyof ActorSocialMedia, id: string | null): string | null => {
  if (!id) return null
  
  const urls: Record<string, string> = {
    facebook_id: `https://www.facebook.com/${id}`,
    instagram_id: `https://www.instagram.com/${id}`,
    twitter_id: `https://twitter.com/${id}`,
    tiktok_id: `https://www.tiktok.com/@${id}`,
    youtube_id: `https://www.youtube.com/${id}`,
    imdb_id: `https://www.imdb.com/name/${id}`,
    wikidata_id: `https://www.wikidata.org/wiki/${id}`,
  }
  
  return urls[platform] || null
}

export const getGenderLabel = (gender: number): string => {
  const labels: Record<number, string> = {
    0: 'Not specified',
    1: 'Female',
    2: 'Male',
    3: 'Non-binary',
  }
  return labels[gender] || 'Not specified'
}

export const calculateAge = (birthday: string | null, deathday: string | null = null): number | null => {
  if (!birthday) return null
  
  const birthDate = new Date(birthday)
  const endDate = deathday ? new Date(deathday) : new Date()
  
  let age = endDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = endDate.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}
