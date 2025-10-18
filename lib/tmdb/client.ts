import {
  TMDBMovie,
  TMDBMovieDetail,
  TMDBCredits,
  TMDBSearchResponse,
  TMDBGenre,
  TMDBVideo,
} from '@/types/tmdb.types'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
// Use NEXT_PUBLIC prefix for client-side access
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

// Fallback/proxy URL if direct access fails
const USE_PROXY = process.env.NEXT_PUBLIC_USE_TMDB_PROXY === 'true'
const PROXY_URL = process.env.NEXT_PUBLIC_TMDB_PROXY_URL || ''

if (!TMDB_API_KEY) {
  console.error('TMDB API key is not set. Movie features will not work.')
  console.error('Make sure NEXT_PUBLIC_TMDB_API_KEY is set in .env.local')
}

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export function getTMDBImageUrl(path: string | null, size: string = 'w500'): string {
  if (!path) return '/placeholder-movie.png'
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key is not configured. Please add NEXT_PUBLIC_TMDB_API_KEY to your .env.local file.')
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
  url.searchParams.append('api_key', TMDB_API_KEY)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value)
  })

  console.log('Fetching TMDB:', endpoint)

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('TMDB API error:', response.status, errorText)
      throw new Error(`TMDB API error (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()
    console.log('TMDB API success:', endpoint)
    return data
  } catch (error) {
    console.error('Fetch error for', endpoint, ':', error)
    throw error
  }
}

// Search Movies
export async function searchMovies(
  query: string,
  page: number = 1
): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/search/movie', {
    query,
    page: page.toString(),
    include_adult: 'false',
  })
}

// Get Trending Movies with optional language support
export async function getTrendingMovies(
  timeWindow: 'day' | 'week' = 'day',
  page: number = 1,
  language?: string
): Promise<TMDBSearchResponse> {
  const params: Record<string, string> = {
    page: page.toString(),
  }
  if (language) params.language = language
  
  return tmdbFetch<TMDBSearchResponse>(`/trending/movie/${timeWindow}`, params)
}

// Get Popular Movies with optional region and language support
export async function getPopularMovies(
  page: number = 1, 
  region?: string, 
  language?: string
): Promise<TMDBSearchResponse> {
  const params: Record<string, string> = {
    page: page.toString(),
  }
  if (region) params.region = region
  if (language) params.language = language
  
  return tmdbFetch<TMDBSearchResponse>('/movie/popular', params)
}

// Get Top Rated Movies
export async function getTopRatedMovies(page: number = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/movie/top_rated', {
    page: page.toString(),
  })
}

// Get Upcoming Movies
export async function getUpcomingMovies(page: number = 1): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>('/movie/upcoming', {
    page: page.toString(),
  })
}

// Get Movie Details
export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetail> {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${movieId}`)
}

// Get Movie Credits
export async function getMovieCredits(movieId: number): Promise<TMDBCredits> {
  return tmdbFetch<TMDBCredits>(`/movie/${movieId}/credits`)
}

// Get Similar Movies
export async function getSimilarMovies(
  movieId: number,
  page: number = 1
): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>(`/movie/${movieId}/similar`, {
    page: page.toString(),
  })
}

// Get Movie Videos
export async function getMovieVideos(movieId: number): Promise<{ results: TMDBVideo[] }> {
  return tmdbFetch<{ results: TMDBVideo[] }>(`/movie/${movieId}/videos`)
}

// Get Movie Genres
export async function getMovieGenres(): Promise<{ genres: TMDBGenre[] }> {
  return tmdbFetch<{ genres: TMDBGenre[] }>('/genre/movie/list')
}

// Discover Movies with Filters (enhanced with region and language)
export async function discoverMovies(params: {
  page?: number
  genre?: string
  year?: string
  sortBy?: string
  voteAverage?: string
  language?: string
  region?: string
  with_genres?: string
  sort_by?: string
  primary_release_year?: string
  with_original_language?: string
}): Promise<TMDBSearchResponse> {
  const queryParams: Record<string, string> = {
    page: (params.page || 1).toString(),
    include_adult: 'false',
    sort_by: params.sortBy || params.sort_by || 'popularity.desc',
  }

  if (params.genre) queryParams.with_genres = params.genre
  if (params.with_genres) queryParams.with_genres = params.with_genres
  if (params.year) queryParams.primary_release_year = params.year
  if (params.primary_release_year) queryParams.primary_release_year = params.primary_release_year
  if (params.voteAverage) queryParams['vote_average.gte'] = params.voteAverage
  if (params.language) queryParams.with_original_language = params.language
  if (params.with_original_language) queryParams.with_original_language = params.with_original_language
  if (params.region) queryParams.region = params.region

  return tmdbFetch<TMDBSearchResponse>('/discover/movie', queryParams)
}

// Get movie release dates by region
export async function getMovieReleaseDates(movieId: number) {
  return tmdbFetch<{
    id: number
    results: Array<{
      iso_3166_1: string
      release_dates: Array<{
        certification: string
        release_date: string
        type: number
        note?: string
      }>
    }>
  }>(`/movie/${movieId}/release_dates`)
}

// Check if movie is playing in theaters in specific region
export async function isMoviePlayingInRegion(movieId: number, region: string = 'IN'): Promise<boolean> {
  try {
    const releaseDates = await getMovieReleaseDates(movieId)
    const regionData = releaseDates.results.find(r => r.iso_3166_1 === region)
    
    if (!regionData) return false
    
    // Type 3 = Theatrical release
    const theatricalRelease = regionData.release_dates.find(rd => rd.type === 3)
    
    if (!theatricalRelease) return false
    
    const releaseDate = new Date(theatricalRelease.release_date)
    const now = new Date()
    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
    
    // Movie is "playing" if released within last 3 months
    return releaseDate >= threeMonthsAgo && releaseDate <= now
  } catch (error) {
    console.error('Error checking movie release status:', error)
    return false
  }
}

// Get actor/person details
export async function getPersonDetails(personId: number) {
  return tmdbFetch<{
    id: number
    name: string
    biography: string
    birthday: string | null
    deathday: string | null
    place_of_birth: string | null
    profile_path: string | null
    known_for_department: string
    gender: number
    popularity: number
    also_known_as: string[]
    homepage: string | null
    imdb_id: string | null
  }>(`/person/${personId}`)
}

// Get actor's social media accounts
export async function getPersonExternalIds(personId: number) {
  return tmdbFetch<{
    id: number
    freebase_mid: string | null
    freebase_id: string | null
    imdb_id: string | null
    tvrage_id: number | null
    wikidata_id: string | null
    facebook_id: string | null
    instagram_id: string | null
    tiktok_id: string | null
    twitter_id: string | null
    youtube_id: string | null
  }>(`/person/${personId}/external_ids`)
}

// Get actor's movie credits
export async function getPersonMovieCredits(personId: number) {
  return tmdbFetch<{
    id: number
    cast: Array<{
      id: number
      title: string
      character: string
      release_date: string
      poster_path: string | null
      vote_average: number
      popularity: number
    }>
    crew: Array<{
      id: number
      title: string
      job: string
      department: string
      release_date: string
      poster_path: string | null
    }>
  }>(`/person/${personId}/movie_credits`)
}

// Get actor's images
export async function getPersonImages(personId: number) {
  return tmdbFetch<{
    id: number
    profiles: Array<{
      file_path: string
      aspect_ratio: number
      height: number
      width: number
      vote_average: number
      vote_count: number
    }>
  }>(`/person/${personId}/images`)
}

// Search for actors/people
export async function searchPeople(query: string, page: number = 1) {
  return tmdbFetch<{
    page: number
    results: Array<{
      id: number
      name: string
      profile_path: string | null
      known_for_department: string
      popularity: number
      known_for: TMDBMovie[]
    }>
    total_pages: number
    total_results: number
  }>('/search/person', {
    query,
    page: page.toString(),
  })
}

// Get popular actors
export async function getPopularPeople(page: number = 1) {
  return tmdbFetch<{
    page: number
    results: Array<{
      id: number
      name: string
      profile_path: string | null
      known_for_department: string
      popularity: number
      known_for: TMDBMovie[]
    }>
    total_pages: number
    total_results: number
  }>('/person/popular', {
    page: page.toString(),
  })
}
