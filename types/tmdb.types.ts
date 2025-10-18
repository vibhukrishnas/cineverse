export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  adult: boolean
  genre_ids: number[]
  original_language: string
  video: boolean
}

export interface TMDBMovieDetail extends TMDBMovie {
  belongs_to_collection: {
    id: number
    name: string
    poster_path: string
    backdrop_path: string
  } | null
  budget: number
  genres: { id: number; name: string }[]
  homepage: string | null
  imdb_id: string | null
  production_companies: {
    id: number
    logo_path: string | null
    name: string
    origin_country: string
  }[]
  production_countries: { iso_3166_1: string; name: string }[]
  revenue: number
  runtime: number | null
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[]
  status: string
  tagline: string | null
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
  cast_id: number
  credit_id: string
}

export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
  credit_id: string
}

export interface TMDBCredits {
  id: number
  cast: TMDBCastMember[]
  crew: TMDBCrewMember[]
}

export interface TMDBVideo {
  id: string
  iso_639_1: string
  iso_3166_1: string
  key: string
  name: string
  site: string
  size: number
  type: string
  official: boolean
  published_at: string
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBSearchResponse {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}
