import { NextRequest, NextResponse } from 'next/server'
import { discoverMovies } from '@/lib/tmdb/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page') || '1'
    const genres = searchParams.get('genres')
    const language = searchParams.get('language')
    const region = searchParams.get('region')
    const year = searchParams.get('year')
    const sortBy = searchParams.get('sortBy') || 'popularity.desc'

    const movies = await discoverMovies({
      page: parseInt(page),
      with_genres: genres || undefined,
      with_original_language: language || undefined,
      region: region || undefined,
      primary_release_year: year || undefined,
      sort_by: sortBy,
    })

    return NextResponse.json(movies)
  } catch (error) {
    console.error('Discovery API error:', error)
    return NextResponse.json(
      { error: 'Failed to discover movies' },
      { status: 500 }
    )
  }
}
