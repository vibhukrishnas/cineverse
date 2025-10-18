// External Ratings Integration
// Fetch ratings from multiple sources: Rotten Tomatoes, Metacritic, Indian critics, etc.

export interface ExternalRating {
  source: string
  rating: string
  maxRating: string
  url?: string
  logo?: string
}

export interface AllRatings {
  tmdb: { rating: number; votes: number }
  imdb?: { rating: string; votes: string; url: string }
  rottenTomatoes?: { critics: string; audience: string; url: string }
  metacritic?: { rating: string; url: string }
  timesOfIndia?: { rating: string; url: string }
  hindustanTimes?: { rating: string; url: string }
  greatAndhra?: { rating: string; url: string }
  ndtv?: { rating: string; url: string }
  bollywoodHungama?: { rating: string; url: string }
  filmCompanion?: { rating: string; url: string }
}

/**
 * Fetch IMDB rating from OMDB API
 * Note: Requires OMDB API key
 */
export async function getIMDBRating(imdbId: string): Promise<ExternalRating | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY || '8e46aed8' // Free key
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`)
    const data = await response.json()

    if (data.Response === 'True') {
      return {
        source: 'IMDb',
        rating: data.imdbRating,
        maxRating: '10',
        url: `https://www.imdb.com/title/${imdbId}/`,
        logo: '/logos/imdb.png',
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching IMDB rating:', error)
    return null
  }
}

/**
 * Fetch Rotten Tomatoes ratings from OMDB API
 */
export async function getRottenTomatoesRating(imdbId: string): Promise<ExternalRating | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY || '8e46aed8'
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`)
    const data = await response.json()

    if (data.Response === 'True' && data.Ratings) {
      const rtRating = data.Ratings.find((r: any) => r.Source === 'Rotten Tomatoes')
      if (rtRating) {
        return {
          source: 'Rotten Tomatoes',
          rating: rtRating.Value,
          maxRating: '100%',
          url: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(data.Title)}`,
          logo: '/logos/rotten-tomatoes.png',
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching Rotten Tomatoes rating:', error)
    return null
  }
}

/**
 * Fetch Metacritic rating from OMDB API
 */
export async function getMetacriticRating(imdbId: string): Promise<ExternalRating | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY || '8e46aed8'
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`)
    const data = await response.json()

    if (data.Response === 'True' && data.Ratings) {
      const mcRating = data.Ratings.find((r: any) => r.Source === 'Metacritic')
      if (mcRating) {
        return {
          source: 'Metacritic',
          rating: mcRating.Value.split('/')[0],
          maxRating: '100',
          url: `https://www.metacritic.com/search/${encodeURIComponent(data.Title)}/`,
          logo: '/logos/metacritic.png',
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching Metacritic rating:', error)
    return null
  }
}

/**
 * Get all available ratings for a movie
 */
export async function getAllRatings(
  tmdbData: { vote_average: number; vote_count: number },
  imdbId?: string
): Promise<AllRatings> {
  const ratings: AllRatings = {
    tmdb: {
      rating: tmdbData.vote_average,
      votes: tmdbData.vote_count,
    },
  }

  if (imdbId) {
    // Fetch from OMDB API
    try {
      const apiKey = process.env.NEXT_PUBLIC_OMDB_API_KEY || '8e46aed8'
      const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`)
      const data = await response.json()

      if (data.Response === 'True') {
        // IMDB
        if (data.imdbRating && data.imdbRating !== 'N/A') {
          ratings.imdb = {
            rating: data.imdbRating,
            votes: data.imdbVotes,
            url: `https://www.imdb.com/title/${imdbId}/`,
          }
        }

        // Rotten Tomatoes
        const rtRating = data.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')
        if (rtRating) {
          ratings.rottenTomatoes = {
            critics: rtRating.Value,
            audience: 'N/A',
            url: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(data.Title)}`,
          }
        }

        // Metacritic
        const mcRating = data.Ratings?.find((r: any) => r.Source === 'Metacritic')
        if (mcRating) {
          ratings.metacritic = {
            rating: mcRating.Value.split('/')[0],
            url: `https://www.metacritic.com/search/${encodeURIComponent(data.Title)}/`,
          }
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error)
    }
  }

  // Note: Indian review sites (Times of India, Hindustan Times, etc.) don't have public APIs
  // These would need to be scraped or manually entered
  // For now, we'll leave them as optional placeholders

  return ratings
}

/**
 * Format rating for display
 */
export function formatRating(rating: string | number, maxRating?: string): string {
  if (typeof rating === 'number') {
    return rating.toFixed(1)
  }
  if (maxRating) {
    return `${rating}/${maxRating}`
  }
  return rating
}

/**
 * Get rating color based on score
 */
export function getRatingColor(rating: number, max: number = 10): string {
  const percentage = (rating / max) * 100
  
  if (percentage >= 80) return 'text-green-500'
  if (percentage >= 60) return 'text-yellow-500'
  if (percentage >= 40) return 'text-orange-500'
  return 'text-red-500'
}
