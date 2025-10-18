import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.TMDB_API_KEY || '9d1a0985764201bee0eb1602d8214ed9'
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET() {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch upcoming movies')
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error: any) {
    console.error('Error fetching upcoming movies:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch movies', results: [] },
      { status: 500 }
    )
  }
}
