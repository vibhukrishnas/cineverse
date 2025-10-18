/**
 * OTT Watch Providers Integration
 * Fetches streaming availability from TMDB Watch Providers API
 */

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'

export interface WatchProvider {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

export interface WatchProviders {
  link?: string
  flatrate?: WatchProvider[] // Subscription streaming (Netflix, Prime, etc.)
  rent?: WatchProvider[] // Rental options
  buy?: WatchProvider[] // Purchase options
  ads?: WatchProvider[] // Free with ads
}

export interface WatchProvidersResponse {
  id: number
  results: {
    [countryCode: string]: WatchProviders
  }
}

/**
 * Get watch providers for a movie
 * @param movieId - TMDB movie ID
 * @param region - Country code (default: 'US')
 */
export async function getMovieWatchProviders(
  movieId: number,
  region: string = 'US'
): Promise<WatchProviders | null> {
  if (!TMDB_API_KEY) {
    console.error('TMDB API key not configured')
    return null
  }

  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data: WatchProvidersResponse = await response.json()
    
    // Return providers for the specified region
    return data.results[region] || null
  } catch (error) {
    console.error('Error fetching watch providers:', error)
    return null
  }
}

/**
 * Get all available regions for watch providers
 */
export async function getAvailableRegions(): Promise<string[]> {
  if (!TMDB_API_KEY) {
    return []
  }

  try {
    const response = await fetch(
      `${BASE_URL}/watch/providers/regions?api_key=${TMDB_API_KEY}`,
      {
        next: { revalidate: 604800 }, // Cache for 1 week
      }
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results.map((region: any) => region.iso_3166_1)
  } catch (error) {
    console.error('Error fetching available regions:', error)
    return []
  }
}

/**
 * Get popular streaming providers
 */
export const POPULAR_PROVIDERS = {
  US: [
    { id: 8, name: 'Netflix', logo: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
    { id: 9, name: 'Amazon Prime Video', logo: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
    { id: 337, name: 'Disney Plus', logo: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
    { id: 384, name: 'HBO Max', logo: '/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg' },
    { id: 387, name: 'Apple TV Plus', logo: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
    { id: 350, name: 'Apple TV', logo: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
    { id: 386, name: 'Peacock', logo: '/xTVM8uXT9QcFBcFhh4I1pWvGJQK.jpg' },
    { id: 531, name: 'Paramount Plus', logo: '/h5DcR0J2EESLitnhR8xLG1QymTE.jpg' },
  ],
  IN: [
    { id: 8, name: 'Netflix', logo: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
    { id: 119, name: 'Amazon Prime Video', logo: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
    { id: 337, name: 'Disney Plus Hotstar', logo: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
    { id: 315, name: 'Jio Cinema', logo: '/paq2FPUo0xVEQT4DgqC6Y0B1dJ4.jpg' },
    { id: 531, name: 'SonyLIV', logo: '/pZ0Y8X1u3VpF1VCfGqv3pwLTJzI.jpg' },
    { id: 2, name: 'Apple TV', logo: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
  ],
}

/**
 * Format provider logo URL
 */
export function getProviderLogoUrl(logoPath: string): string {
  return `https://image.tmdb.org/t/p/original${logoPath}`
}
