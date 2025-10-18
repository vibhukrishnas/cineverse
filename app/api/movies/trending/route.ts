import { NextResponse } from 'next/server'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

export async function GET(request: Request) {
  try {
    // Get query parameters from URL
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'US'
    const language = searchParams.get('language') || 'en'
    
    // Use discover endpoint to find movies by original language (the language they were made in)
    // This will give us Bollywood movies for Hindi, Tollywood for Telugu, etc.
    const url = new URL(`${TMDB_BASE_URL}/discover/movie`)
    url.searchParams.append('api_key', TMDB_API_KEY || '')
    url.searchParams.append('with_original_language', language) // Filter by production language
    url.searchParams.append('region', region) // Regional availability
    url.searchParams.append('sort_by', 'popularity.desc') // Most popular first
    url.searchParams.append('vote_count.gte', '10') // Minimum votes for quality
    url.searchParams.append('include_adult', 'false') // Exclude adult content
    url.searchParams.append('page', '1')
    
    console.log(`Fetching movies in language: ${language}, region: ${region}`)
    
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Found ${data.results?.length || 0} movies for ${language}`)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch movies' },
      { status: 500 }
    )
  }
}
