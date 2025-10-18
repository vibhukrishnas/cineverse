import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const type = searchParams.get('type') || 'movie' // movie, tv, person

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required' },
      { status: 400 }
    )
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}/external_ids?api_key=${TMDB_API_KEY}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching TMDB social media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social media information' },
      { status: 500 }
    )
  }
}
